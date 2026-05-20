"""
Shipment service — data access and business logic for shipment operations.
"""

import json
from pathlib import Path
from typing import List, Optional

from app.config import settings
from app.models.schemas import Shipment, ShipmentStats, ShipmentStatus


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

_SHIPMENTS_PATH = Path(settings.DATA_DIR) / "shipments.json"


def _load_shipments() -> List[dict]:
    """Load raw shipment records from the JSON file."""
    with open(_SHIPMENTS_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_all_shipments(
    status_filter: Optional[str] = None,
    origin_filter: Optional[str] = None,
    destination_filter: Optional[str] = None,
    search_query: Optional[str] = None,
) -> List[Shipment]:
    """
    Return shipments, optionally filtered by status, origin, destination,
    or a free-text search query.
    """
    raw = _load_shipments()
    results: List[Shipment] = []

    for record in raw:
        # --- status filter ---
        if status_filter:
            if record.get("status", "").lower() != status_filter.lower():
                continue

        # --- origin filter ---
        if origin_filter:
            if origin_filter.lower() not in record.get("origin", "").lower():
                continue

        # --- destination filter ---
        if destination_filter:
            if destination_filter.lower() not in record.get("destination", "").lower():
                continue

        # --- free-text search ---
        if search_query:
            query_lower = search_query.lower()
            searchable = " ".join(
                [
                    record.get("tracking_number", ""),
                    record.get("origin", ""),
                    record.get("destination", ""),
                    record.get("carrier", ""),
                    record.get("status", ""),
                    record.get("current_location", ""),
                ]
            ).lower()
            if query_lower not in searchable:
                continue

        results.append(Shipment(**record))

    return results


def get_shipment_by_id(tracking_id: str) -> Optional[Shipment]:
    """
    Look up a single shipment by its tracking number (e.g. ``SHP-001``)
    or internal ID.  Returns ``None`` when not found.
    """
    raw = _load_shipments()
    tracking_id_upper = tracking_id.upper()

    for record in raw:
        if (
            record.get("tracking_number", "").upper() == tracking_id_upper
            or record.get("id", "").upper() == tracking_id_upper
        ):
            return Shipment(**record)

    return None


def get_shipment_stats() -> ShipmentStats:
    """Compute aggregate shipment statistics across all records."""
    raw = _load_shipments()
    stats = ShipmentStats(total=len(raw))

    for record in raw:
        status = record.get("status", "")
        if status == ShipmentStatus.IN_TRANSIT.value:
            stats.in_transit += 1
        elif status == ShipmentStatus.DELIVERED.value:
            stats.delivered += 1
        elif status == ShipmentStatus.DELAYED.value:
            stats.delayed += 1
        elif status == ShipmentStatus.CUSTOMS_HOLD.value:
            stats.customs_hold += 1
        elif status == ShipmentStatus.OUT_FOR_DELIVERY.value:
            stats.out_for_delivery += 1
        elif status == ShipmentStatus.PROCESSING.value:
            stats.processing += 1

    return stats


def search_shipments(query: str) -> List[Shipment]:
    """
    Convenience wrapper — search shipments by tracking number, origin,
    destination, or carrier name.
    """
    return get_all_shipments(search_query=query)
