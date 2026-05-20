"""
Shipments router — CRUD and dashboard endpoints for shipment data.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import Shipment, ShipmentStats
from app.services import shipment_service

router = APIRouter(prefix="/api/shipments", tags=["Shipments"])


@router.get("/", response_model=List[Shipment])
async def list_shipments(
    status: Optional[str] = Query(None, description="Filter by status (e.g. 'Delayed')"),
    origin: Optional[str] = Query(None, description="Filter by origin city"),
    destination: Optional[str] = Query(None, description="Filter by destination city"),
    search: Optional[str] = Query(None, description="Free-text search across fields"),
) -> List[Shipment]:
    """
    List all shipments with optional filters.

    Supports filtering by **status**, **origin**, **destination**, and a
    free-text **search** query that matches against tracking number,
    origin, destination, carrier, and current location.
    """
    return shipment_service.get_all_shipments(
        status_filter=status,
        origin_filter=origin,
        destination_filter=destination,
        search_query=search,
    )


@router.get("/stats", response_model=ShipmentStats)
async def shipment_stats() -> ShipmentStats:
    """Return aggregated shipment statistics for the dashboard."""
    return shipment_service.get_shipment_stats()


@router.get("/{tracking_id}", response_model=Shipment)
async def get_shipment(tracking_id: str) -> Shipment:
    """
    Retrieve a single shipment by its tracking number (e.g. ``SHP-001``)
    or internal ID.
    """
    shipment = shipment_service.get_shipment_by_id(tracking_id)
    if not shipment:
        raise HTTPException(
            status_code=404,
            detail=f"Shipment with tracking ID '{tracking_id}' not found.",
        )
    return shipment
