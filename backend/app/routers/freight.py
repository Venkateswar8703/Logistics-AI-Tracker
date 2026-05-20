"""
Freight router — rate listing and quote calculation endpoints.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.schemas import FreightQuote, FreightRate
from app.services import freight_service

router = APIRouter(prefix="/api/freight", tags=["Freight"])


@router.get("/rates", response_model=List[FreightRate])
async def list_rates(
    origin: Optional[str] = Query(None, description="Filter by origin city"),
    destination: Optional[str] = Query(None, description="Filter by destination city"),
    mode: Optional[str] = Query(None, description="Filter by mode: Air, Sea, Road, Rail"),
) -> List[FreightRate]:
    """
    List available freight rates with optional origin, destination, and
    transport-mode filters.
    """
    return freight_service.get_all_rates(
        origin_filter=origin,
        destination_filter=destination,
        mode_filter=mode,
    )


@router.get("/quote", response_model=List[FreightQuote])
async def get_quote(
    origin: str = Query(..., description="Origin city / port"),
    destination: str = Query(..., description="Destination city / port"),
    weight_kg: float = Query(..., gt=0, description="Cargo weight in kilograms"),
    mode: Optional[str] = Query(None, description="Preferred mode: Air, Sea, Road, Rail"),
) -> List[FreightQuote]:
    """
    Calculate freight quotes for a given route and weight.

    Returns all matching carrier/mode options sorted by total cost
    (cheapest first).  Volume discounts are applied automatically.
    """
    quotes = freight_service.get_quote(
        origin=origin,
        destination=destination,
        weight_kg=weight_kg,
        mode=mode,
    )
    if not quotes:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No freight rates found for route {origin} → {destination}"
                + (f" ({mode})" if mode else "")
                + ". Try broadening your search."
            ),
        )
    return quotes
