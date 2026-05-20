"""
Utility helpers for the Logistics AI Tracker backend.
"""

import re
from datetime import datetime, timezone
from typing import Optional


def format_date(iso_string: str, fmt: str = "%d %b %Y") -> str:
    """
    Convert an ISO-8601 date/datetime string to a human-readable format.

    Examples
    --------
    >>> format_date("2026-05-21T08:00:00Z")
    '21 May 2026'
    >>> format_date("2026-06-02", fmt="%B %d, %Y")
    'June 02, 2026'
    """
    try:
        # Handle both date-only and datetime strings
        for pattern in ("%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
            try:
                dt = datetime.strptime(iso_string, pattern)
                return dt.strftime(fmt)
            except ValueError:
                continue
        return iso_string  # Return as-is if nothing matched
    except Exception:
        return iso_string


def format_datetime(iso_string: str) -> str:
    """
    Format an ISO-8601 datetime string into a friendly representation.

    Example
    -------
    >>> format_datetime("2026-05-21T08:30:00Z")
    '21 May 2026, 08:30 UTC'
    """
    try:
        dt = datetime.fromisoformat(iso_string.replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y, %H:%M UTC")
    except Exception:
        return iso_string


def parse_tracking_number(text: str) -> Optional[str]:
    """
    Extract and normalise a tracking number from arbitrary text.

    Recognises patterns like ``SHP-001``, ``SHP 12``, ``shp003``, etc.
    Returns the normalised form (e.g. ``SHP-001``) or ``None``.
    """
    match = re.search(r"SHP[-\s]?(\d{1,4})", text, re.IGNORECASE)
    if match:
        number = int(match.group(1))
        return f"SHP-{number:03d}"
    return None


def slugify(text: str) -> str:
    """
    Convert a string to a URL-friendly slug.

    Example
    -------
    >>> slugify("Mumbai, India")
    'mumbai-india'
    """
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def truncate(text: str, max_length: int = 100) -> str:
    """Truncate *text* to *max_length* characters, adding '…' if trimmed."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 1] + "…"


def utcnow_iso() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(timezone.utc).isoformat()
