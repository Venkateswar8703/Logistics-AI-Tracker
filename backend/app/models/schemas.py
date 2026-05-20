"""
Pydantic models / schemas for the Logistics AI Tracker API.
"""

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ShipmentStatus(str, Enum):
    """Possible statuses for a shipment."""
    IN_TRANSIT = "In Transit"
    DELIVERED = "Delivered"
    DELAYED = "Delayed"
    CUSTOMS_HOLD = "Customs Hold"
    OUT_FOR_DELIVERY = "Out for Delivery"
    PROCESSING = "Processing"


class FreightMode(str, Enum):
    """Supported freight transport modes."""
    AIR = "Air"
    SEA = "Sea"
    ROAD = "Road"
    RAIL = "Rail"


# ---------------------------------------------------------------------------
# Shipment models
# ---------------------------------------------------------------------------

class TimelineEvent(BaseModel):
    """A single event in a shipment's timeline."""
    timestamp: str = Field(..., description="ISO-8601 timestamp of the event")
    location: str = Field(..., description="Location where the event occurred")
    status: str = Field(..., description="Short status label")
    description: str = Field(..., description="Human-readable description")


class Shipment(BaseModel):
    """Full shipment record."""
    id: str = Field(..., description="Internal shipment ID")
    tracking_number: str = Field(..., description="Public tracking number (e.g. SHP-001)")
    origin: str = Field(..., description="Origin city / port")
    destination: str = Field(..., description="Destination city / port")
    status: ShipmentStatus
    carrier: str = Field(..., description="Carrier / shipping line name")
    weight_kg: float = Field(..., ge=0, description="Weight in kilograms")
    estimated_delivery: str = Field(..., description="Estimated delivery date (ISO-8601)")
    current_location: str = Field(..., description="Current known location")
    created_at: str = Field(..., description="Record creation timestamp")
    timeline: List[TimelineEvent] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Freight rate models
# ---------------------------------------------------------------------------

class FreightRate(BaseModel):
    """A single freight rate entry."""
    id: str
    origin: str
    destination: str
    carrier: str
    mode: FreightMode
    rate_per_kg: float = Field(..., ge=0)
    currency: str = "USD"
    transit_days: int = Field(..., ge=1)
    last_updated: str


class FreightQuote(BaseModel):
    """Calculated freight quote returned to the client."""
    origin: str
    destination: str
    carrier: str
    mode: FreightMode
    rate_per_kg: float
    weight_kg: float
    total_cost: float
    currency: str
    transit_days: int


# ---------------------------------------------------------------------------
# Chat models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """Incoming chat message from the client."""
    message: str = Field(..., min_length=1, description="User query text")
    session_id: Optional[str] = Field(None, description="Optional session ID for context continuity")


class ChatResponse(BaseModel):
    """Response returned by the chat endpoint."""
    response: str
    sources: List[str] = Field(default_factory=list)
    session_id: str


# ---------------------------------------------------------------------------
# Dashboard / stats
# ---------------------------------------------------------------------------

class ShipmentStats(BaseModel):
    """Aggregated shipment statistics for the dashboard."""
    total: int = 0
    in_transit: int = 0
    delivered: int = 0
    delayed: int = 0
    customs_hold: int = 0
    out_for_delivery: int = 0
    processing: int = 0
