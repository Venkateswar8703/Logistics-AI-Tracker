"""
Freight service — data access and quoting logic for freight rates.
"""

import json
from pathlib import Path
from typing import List, Optional

from app.config import settings
from app.models.schemas import FreightMode, FreightQuote, FreightRate


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

_RATES_PATH = Path(settings.DATA_DIR) / "freight_rates.json"


def _load_rates() -> List[dict]:
    """Load raw freight-rate entries from the JSON file."""
    with open(_RATES_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def get_all_rates(
    origin_filter: Optional[str] = None,
    destination_filter: Optional[str] = None,
    mode_filter: Optional[str] = None,
) -> List[FreightRate]:
    """
    Return freight rates, optionally filtered by origin, destination,
    or transport mode.
    """
    raw = _load_rates()
    results: List[FreightRate] = []

    for entry in raw:
        if origin_filter:
            if origin_filter.lower() not in entry.get("origin", "").lower():
                continue

        if destination_filter:
            if destination_filter.lower() not in entry.get("destination", "").lower():
                continue

        if mode_filter:
            if entry.get("mode", "").lower() != mode_filter.lower():
                continue

        results.append(FreightRate(**entry))

    return results


def get_quote(
    origin: str,
    destination: str,
    weight_kg: float,
    mode: Optional[str] = None,
) -> List[FreightQuote]:
    """
    Calculate total-cost quotes for a given origin/destination/weight.

    If *mode* is provided, only rates matching that mode are considered.
    Returns a list of :class:`FreightQuote` objects (one per matching rate),
    sorted by total cost ascending.
    """
    matching_rates = get_all_rates(
        origin_filter=origin,
        destination_filter=destination,
        mode_filter=mode,
    )

    quotes: List[FreightQuote] = []
    for rate in matching_rates:
        # Apply volume-based discount tiers
        discount = 0.0
        if weight_kg >= 10_000:
            discount = 0.15  # 15% — bulk
        elif weight_kg >= 1_000:
            discount = 0.10  # 10%
        elif weight_kg >= 100:
            discount = 0.05  # 5%

        effective_rate = rate.rate_per_kg * (1 - discount)
        total_cost = round(effective_rate * weight_kg, 2)

        quotes.append(
            FreightQuote(
                origin=rate.origin,
                destination=rate.destination,
                carrier=rate.carrier,
                mode=rate.mode,
                rate_per_kg=round(effective_rate, 4),
                weight_kg=weight_kg,
                total_cost=total_cost,
                currency=rate.currency,
                transit_days=rate.transit_days,
            )
        )

    # Cheapest first
    quotes.sort(key=lambda q: q.total_cost)
    return quotes
