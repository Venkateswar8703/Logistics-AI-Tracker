"""
LLM / RAG service for the Logistics AI Tracker chat assistant.

Works in two modes:
  1. **Rule-based** (default, no API key required): Uses retrieved context
     from a FAISS vector store + structured data to compose natural-language
     responses without calling any external LLM.
  2. **OpenAI-backed** (when ``OPENAI_API_KEY`` is set): Uses LangChain's
     ``ChatOpenAI`` with RAG retrieval for higher-quality answers.
"""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from app.config import settings
from app.services import shipment_service, freight_service

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Optional heavy imports — only loaded when actually needed
# ---------------------------------------------------------------------------
_faiss_store = None  # will be lazily initialised


def _build_vector_store():
    """
    Load documents from ``data/docs/``, chunk them, and build a FAISS
    index backed by HuggingFace ``all-MiniLM-L6-v2`` embeddings.
    """
    from langchain_community.document_loaders import DirectoryLoader, TextLoader
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_community.vectorstores import FAISS

    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError:
        from langchain_community.embeddings import HuggingFaceEmbeddings

    docs_dir = Path(settings.DOCS_DIR)
    vector_path = Path(settings.VECTOR_STORE_PATH)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
    )

    # Try to load a cached FAISS index
    if vector_path.exists():
        try:
            store = FAISS.load_local(
                str(vector_path), embeddings, allow_dangerous_deserialization=True
            )
            logger.info("Loaded cached FAISS vector store from %s", vector_path)
            return store
        except Exception:
            logger.warning("Failed to load cached index — rebuilding.")

    # Build from scratch
    loader = DirectoryLoader(
        str(docs_dir),
        glob="**/*.txt",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
    )
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=80,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    logger.info("Split %d documents into %d chunks", len(documents), len(chunks))

    store = FAISS.from_documents(chunks, embeddings)

    # Persist for next startup
    vector_path.parent.mkdir(parents=True, exist_ok=True)
    store.save_local(str(vector_path))
    logger.info("Saved FAISS index to %s", vector_path)

    return store


def _get_vector_store():
    """Return the singleton FAISS vector store, building it on first call."""
    global _faiss_store
    if _faiss_store is None:
        try:
            _faiss_store = _build_vector_store()
        except Exception as exc:
            logger.error("Could not build vector store: %s", exc)
    return _faiss_store


# ---------------------------------------------------------------------------
# Session memory (simple in-process dict)
# ---------------------------------------------------------------------------

_session_history: Dict[str, List[Dict[str, str]]] = {}

MAX_HISTORY = 10  # max turns to keep per session


def _get_session(session_id: str) -> List[Dict[str, str]]:
    """Retrieve or create conversation history for a session."""
    if session_id not in _session_history:
        _session_history[session_id] = []
    return _session_history[session_id]


def _append_to_session(
    session_id: str, user_msg: str, assistant_msg: str
) -> None:
    history = _get_session(session_id)
    history.append({"role": "user", "content": user_msg})
    history.append({"role": "assistant", "content": assistant_msg})
    # Trim to keep memory bounded
    if len(history) > MAX_HISTORY * 2:
        _session_history[session_id] = history[-(MAX_HISTORY * 2) :]


# ---------------------------------------------------------------------------
# Tracking-number detection
# ---------------------------------------------------------------------------

_TRACKING_RE = re.compile(r"SHP[-\s]?(\d{1,4})", re.IGNORECASE)


def _extract_tracking_numbers(text: str) -> List[str]:
    """Return normalised tracking numbers found in *text* (e.g. SHP-001)."""
    matches = _TRACKING_RE.findall(text)
    return [f"SHP-{int(m):03d}" for m in matches]


# ---------------------------------------------------------------------------
# Intent detection helpers
# ---------------------------------------------------------------------------

_FREIGHT_KEYWORDS = [
    "freight", "rate", "quote", "cost", "price", "shipping cost",
    "how much", "per kg", "per kilogram", "tariff", "surcharge",
    "cheapest", "expensive",
]

_SHIPMENT_KEYWORDS = [
    "shipment", "track", "tracking", "where is", "status",
    "delivery", "timeline", "delayed", "customs",
    "in transit", "delivered", "out for delivery",
]

_DELAY_KEYWORDS = [
    "delay", "delayed", "late", "overdue", "behind schedule",
    "stuck", "hold", "customs hold",
]

_POLICY_KEYWORDS = [
    "policy", "insurance", "documentation", "packaging", "liability",
    "handling", "rules", "procedure", "sla", "compensation", "claim",
]


def _classify_intent(query: str) -> str:
    """Simple keyword-based intent classifier."""
    q = query.lower()

    # Specific shipment query
    if _extract_tracking_numbers(query):
        return "shipment_lookup"

    for kw in _DELAY_KEYWORDS:
        if kw in q:
            return "delay_info"

    for kw in _FREIGHT_KEYWORDS:
        if kw in q:
            return "freight_info"

    for kw in _SHIPMENT_KEYWORDS:
        if kw in q:
            return "shipment_info"

    for kw in _POLICY_KEYWORDS:
        if kw in q:
            return "policy_info"

    return "general"


# ---------------------------------------------------------------------------
# Response formatters (rule-based, no API key required)
# ---------------------------------------------------------------------------


def _format_shipment_detail(tracking_number: str) -> Tuple[str, List[str]]:
    """Build a natural-language response for a specific shipment."""
    shipment = shipment_service.get_shipment_by_id(tracking_number)
    if not shipment:
        return (
            f"I couldn't find a shipment with tracking number **{tracking_number}**. "
            "Please double-check the number and try again.",
            [],
        )

    timeline_text = ""
    for evt in shipment.timeline:
        timeline_text += (
            f"  • **{evt.timestamp}** — {evt.location}: {evt.description}\n"
        )

    response = (
        f"📦 **Shipment {shipment.tracking_number}**\n\n"
        f"- **Status:** {shipment.status}\n"
        f"- **Origin:** {shipment.origin}\n"
        f"- **Destination:** {shipment.destination}\n"
        f"- **Carrier:** {shipment.carrier}\n"
        f"- **Weight:** {shipment.weight_kg:,.1f} kg\n"
        f"- **Current Location:** {shipment.current_location}\n"
        f"- **Estimated Delivery:** {shipment.estimated_delivery}\n\n"
        f"**Timeline:**\n{timeline_text}"
    )
    return response, [f"shipments.json (tracking: {shipment.tracking_number})"]


def _format_shipment_overview() -> Tuple[str, List[str]]:
    """Return a summary of all shipments."""
    stats = shipment_service.get_shipment_stats()
    shipments = shipment_service.get_all_shipments()

    lines = [
        "📊 **Shipment Overview**\n",
        f"- **Total Shipments:** {stats.total}",
        f"- **In Transit:** {stats.in_transit}",
        f"- **Delivered:** {stats.delivered}",
        f"- **Delayed:** {stats.delayed}",
        f"- **Customs Hold:** {stats.customs_hold}",
        f"- **Out for Delivery:** {stats.out_for_delivery}",
        f"- **Processing:** {stats.processing}",
        "",
        "**Recent Shipments:**",
    ]
    for s in shipments[:5]:
        lines.append(
            f"  • {s.tracking_number}: {s.origin} → {s.destination} "
            f"({s.status}) via {s.carrier}"
        )

    return "\n".join(lines), ["shipments.json"]


def _format_freight_info(query: str) -> Tuple[str, List[str]]:
    """Provide freight rate information or a quote."""
    rates = freight_service.get_all_rates()
    if not rates:
        return "No freight rate data is currently available.", []

    # Attempt to match origin/destination from the query
    matched_rates = []
    q = query.lower()
    for r in rates:
        if r.origin.lower() in q or r.destination.lower() in q:
            matched_rates.append(r)

    if matched_rates:
        lines = ["💰 **Matching Freight Rates:**\n"]
        for r in matched_rates:
            lines.append(
                f"  • **{r.origin} → {r.destination}** via {r.carrier} "
                f"({r.mode}): ${r.rate_per_kg:.2f}/kg — "
                f"{r.transit_days} days transit"
            )
        return "\n".join(lines), ["freight_rates.json"]

    # No specific match → show summary
    modes = {}
    for r in rates:
        modes.setdefault(r.mode, []).append(r.rate_per_kg)

    lines = [
        "💰 **Freight Rate Summary:**\n",
        "Here's an overview of current rates by transport mode:\n",
    ]
    for mode, prices in sorted(modes.items()):
        avg = sum(prices) / len(prices)
        lo, hi = min(prices), max(prices)
        lines.append(
            f"  • **{mode}:** ${lo:.2f} – ${hi:.2f}/kg "
            f"(avg ${avg:.2f}/kg, {len(prices)} routes)"
        )
    lines.append(
        "\nAsk about a specific route for detailed pricing — e.g., "
        '"What\'s the freight rate from Shanghai to Los Angeles?"'
    )
    return "\n".join(lines), ["freight_rates.json"]


def _format_delay_info() -> Tuple[str, List[str]]:
    """Return information about delayed shipments."""
    delayed = shipment_service.get_all_shipments(status_filter="Delayed")
    held = shipment_service.get_all_shipments(status_filter="Customs Hold")
    problem_shipments = delayed + held

    if not problem_shipments:
        return "✅ Great news — there are currently no delayed or held shipments!", []

    lines = ["⚠️ **Delayed / Held Shipments:**\n"]
    for s in problem_shipments:
        last_event = s.timeline[-1] if s.timeline else None
        reason = last_event.description if last_event else "No details available"
        lines.append(
            f"  • **{s.tracking_number}** ({s.status}): "
            f"{s.origin} → {s.destination}\n"
            f"    Last update: {reason}"
        )

    return "\n".join(lines), ["shipments.json"]


def _format_rag_response(query: str) -> Tuple[str, List[str]]:
    """Use the FAISS vector store to retrieve relevant document chunks."""
    store = _get_vector_store()
    sources: List[str] = []

    if store is None:
        return (
            "I'm sorry, the knowledge base is currently unavailable. "
            "Please try again later or ask about a specific shipment or freight rate.",
            [],
        )

    docs = store.similarity_search(query, k=4)
    if not docs:
        return (
            "I couldn't find specific information about that in our knowledge base. "
            "Try asking about shipping policies, delay guidelines, or freight rates.",
            [],
        )

    # Collect unique source file names
    for doc in docs:
        src = Path(doc.metadata.get("source", "")).name
        if src and src not in sources:
            sources.append(src)

    # Build a response from retrieved chunks
    context_text = "\n\n".join(d.page_content for d in docs)

    # Smart rule-based response generation
    response = _generate_rule_based_answer(query, context_text, sources)
    return response, sources


def _generate_rule_based_answer(
    query: str, context: str, sources: List[str]
) -> str:
    """
    Produce a natural-language answer from retrieved context without
    calling an external LLM.  Uses keyword extraction and context
    summarisation heuristics.
    """
    q_lower = query.lower()

    # Contextual intro
    if "insurance" in q_lower:
        intro = "Here's what our policies say about **cargo insurance**:\n\n"
    elif "documentation" in q_lower or "document" in q_lower:
        intro = "Here are the **documentation requirements**:\n\n"
    elif "packaging" in q_lower or "handling" in q_lower:
        intro = "Here are the **packaging and handling guidelines**:\n\n"
    elif "sla" in q_lower or "service level" in q_lower:
        intro = "Here are our **SLA commitments**:\n\n"
    elif "compensation" in q_lower or "claim" in q_lower:
        intro = "Here is our **compensation and claims policy**:\n\n"
    elif "surcharge" in q_lower or "fee" in q_lower:
        intro = "Here's information about **surcharges and fees**:\n\n"
    elif "seasonal" in q_lower or "peak" in q_lower:
        intro = "Here's what you should know about **seasonal rate variations**:\n\n"
    elif "negotiat" in q_lower:
        intro = "Here are some **freight rate negotiation tips**:\n\n"
    elif "delay" in q_lower or "late" in q_lower:
        intro = "Here is information about **delay classifications and resolution**:\n\n"
    elif "liability" in q_lower:
        intro = "Here's what our policies say about **liability**:\n\n"
    else:
        intro = "Based on our knowledge base, here's the relevant information:\n\n"

    # Clean up the context into readable paragraphs
    paragraphs = [p.strip() for p in context.split("\n\n") if p.strip()]
    # Take the most relevant paragraphs (first 3)
    selected = paragraphs[:3]
    body = "\n\n".join(f"> {p}" for p in selected)

    source_line = ""
    if sources:
        source_names = ", ".join(f"*{s}*" for s in sources)
        source_line = f"\n\n📄 **Sources:** {source_names}"

    return f"{intro}{body}{source_line}"


# ---------------------------------------------------------------------------
# OpenAI-backed mode (when API key is available)
# ---------------------------------------------------------------------------


def _query_openai(
    query: str, session_id: str, context: str, sources: List[str]
) -> str:
    """Use LangChain ChatOpenAI with retrieved context."""
    from langchain_community.chat_models import ChatOpenAI  # type: ignore
    from langchain.schema import HumanMessage, SystemMessage

    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.3,
        openai_api_key=settings.OPENAI_API_KEY,
    )

    system_prompt = (
        "You are the Logistics AI Tracker assistant. Answer the user's question "
        "accurately and concisely using the provided context. If the context doesn't "
        "contain the answer, say so honestly. Format your response with markdown.\n\n"
        f"Context:\n{context}"
    )

    history = _get_session(session_id)
    messages = [SystemMessage(content=system_prompt)]
    for turn in history[-6:]:  # last 3 exchanges
        if turn["role"] == "user":
            messages.append(HumanMessage(content=turn["content"]))
        else:
            from langchain.schema import AIMessage

            messages.append(AIMessage(content=turn["content"]))
    messages.append(HumanMessage(content=query))

    result = llm.invoke(messages)
    return result.content  # type: ignore[union-attr]


# ===================================================================
# PUBLIC INTERFACE
# ===================================================================


class LLMService:
    """
    High-level chat service.  Initialise once at application startup
    (the vector store is built lazily on first RAG query).
    """

    def __init__(self) -> None:
        self._use_openai: bool = bool(settings.OPENAI_API_KEY)
        if self._use_openai:
            logger.info("OpenAI API key detected — using ChatOpenAI mode.")
        else:
            logger.info(
                "No OpenAI API key — using rule-based responder. "
                "Set OPENAI_API_KEY in .env to enable GPT-powered answers."
            )

    # ------------------------------------------------------------------ #
    def process_query(
        self, message: str, session_id: Optional[str] = None
    ) -> Dict[str, object]:
        """
        Process an incoming user query and return a dict with keys
        ``response``, ``sources``, and ``session_id``.
        """
        if not session_id:
            session_id = str(uuid.uuid4())

        intent = _classify_intent(message)
        response_text: str = ""
        sources: List[str] = []

        try:
            if intent == "shipment_lookup":
                tracking_numbers = _extract_tracking_numbers(message)
                parts: List[str] = []
                all_sources: List[str] = []
                for tn in tracking_numbers:
                    text, srcs = _format_shipment_detail(tn)
                    parts.append(text)
                    all_sources.extend(srcs)
                response_text = "\n\n---\n\n".join(parts)
                sources = list(dict.fromkeys(all_sources))  # dedupe

            elif intent == "shipment_info":
                response_text, sources = _format_shipment_overview()

            elif intent == "freight_info":
                response_text, sources = _format_freight_info(message)

            elif intent == "delay_info":
                response_text, sources = _format_delay_info()

            elif intent == "policy_info":
                if self._use_openai:
                    response_text, sources = self._openai_rag(
                        message, session_id
                    )
                else:
                    response_text, sources = _format_rag_response(message)

            else:  # general
                if self._use_openai:
                    response_text, sources = self._openai_rag(
                        message, session_id
                    )
                else:
                    response_text, sources = _format_rag_response(message)

                # Fallback if RAG returned nothing useful
                if not response_text or response_text.startswith("I couldn't find"):
                    response_text = (
                        "👋 I'm the **Logistics AI Tracker** assistant! "
                        "I can help you with:\n\n"
                        "  • **Shipment tracking** — ask about a specific shipment "
                        "(e.g., *\"Where is SHP-003?\"*)\n"
                        "  • **Freight rates & quotes** — get pricing info "
                        "(e.g., *\"Freight rate from Shanghai to Los Angeles\"*)\n"
                        "  • **Delay information** — check delayed shipments\n"
                        "  • **Shipping policies** — insurance, documentation, "
                        "liability, and more\n\n"
                        "Go ahead — ask me anything!"
                    )
                    sources = []

        except Exception as exc:
            logger.exception("Error processing query: %s", exc)
            response_text = (
                "I'm sorry, I encountered an error processing your request. "
                "Please try again or rephrase your question."
            )
            sources = []

        # Persist history
        _append_to_session(session_id, message, response_text)

        return {
            "response": response_text,
            "sources": sources,
            "session_id": session_id,
        }

    # ------------------------------------------------------------------ #
    def _openai_rag(
        self, query: str, session_id: str
    ) -> Tuple[str, List[str]]:
        """Retrieve context via FAISS then answer with OpenAI."""
        store = _get_vector_store()
        sources: List[str] = []
        context = ""

        if store:
            docs = store.similarity_search(query, k=4)
            for doc in docs:
                src = Path(doc.metadata.get("source", "")).name
                if src and src not in sources:
                    sources.append(src)
            context = "\n\n".join(d.page_content for d in docs)

        # Append live data summaries to context
        context += self._live_data_context()

        answer = _query_openai(query, session_id, context, sources)
        return answer, sources

    @staticmethod
    def _live_data_context() -> str:
        """Build a compact text summary of live shipment & freight data."""
        lines = ["\n\n--- LIVE DATA ---"]
        try:
            stats = shipment_service.get_shipment_stats()
            lines.append(
                f"Shipment stats: {stats.total} total, {stats.in_transit} in transit, "
                f"{stats.delivered} delivered, {stats.delayed} delayed, "
                f"{stats.customs_hold} customs hold."
            )
            shipments = shipment_service.get_all_shipments()
            for s in shipments:
                lines.append(
                    f"  {s.tracking_number}: {s.origin}→{s.destination} "
                    f"({s.status}), carrier={s.carrier}, "
                    f"location={s.current_location}"
                )
        except Exception:
            pass
        return "\n".join(lines)


# Module-level singleton
llm_service = LLMService()
