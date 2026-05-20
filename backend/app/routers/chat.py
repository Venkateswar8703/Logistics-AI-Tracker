"""
Chat router — conversational AI endpoint and query suggestions.
"""

from typing import List

from fastapi import APIRouter

from app.models.schemas import ChatMessage, ChatResponse
from app.services.llm_service import llm_service

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("/", response_model=ChatResponse)
async def chat(msg: ChatMessage) -> ChatResponse:
    """
    Send a message to the AI assistant and receive a response.

    The assistant can answer questions about:
    - Specific shipments (e.g., *"Where is SHP-003?"*)
    - Freight rates and quotes
    - Delay information
    - Shipping policies, insurance, and documentation
    """
    result = llm_service.process_query(
        message=msg.message,
        session_id=msg.session_id,
    )
    return ChatResponse(
        response=result["response"],  # type: ignore[arg-type]
        sources=result["sources"],  # type: ignore[arg-type]
        session_id=result["session_id"],  # type: ignore[arg-type]
    )


@router.get("/suggestions", response_model=List[str])
async def suggestions() -> List[str]:
    """Return a curated list of suggested queries for the chat UI."""
    return [
        "Where is SHP-003?",
        "Show me all delayed shipments",
        "What's the freight rate from Shanghai to Los Angeles?",
        "Give me a quote for 5000 kg from Mumbai to Rotterdam by sea",
        "What are the shipping insurance options?",
        "What documentation do I need for international shipping?",
        "Show shipment statistics",
        "What are the delay classification tiers?",
        "Tell me about peak season surcharges",
        "How can I negotiate better freight rates?",
    ]
