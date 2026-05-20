"""
FastAPI application entry point for the Logistics AI Tracker.
"""

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import settings
from app.routers import chat, freight, shipments

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered logistics tracking and freight management platform. "
        "Provides shipment tracking, freight rate quoting, and an intelligent "
        "chat assistant backed by RAG (Retrieval-Augmented Generation)."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# CORS middleware (permissive for development)
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Include routers
# ---------------------------------------------------------------------------

app.include_router(shipments.router)
app.include_router(freight.router)
app.include_router(chat.router)

# ---------------------------------------------------------------------------
# Root & health endpoints
# ---------------------------------------------------------------------------


@app.get("/", include_in_schema=False)
async def root():
    """Redirect the bare root URL to the interactive API docs."""
    return RedirectResponse(url="/docs")


@app.get("/api/health", tags=["Health"])
async def health_check():
    """
    Lightweight health-check endpoint for load balancers and
    orchestration tools.
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "debug": settings.DEBUG,
    }
