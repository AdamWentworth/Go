"""Runtime configuration for the internal catalog editor.

The editor defaults to the checked-out SQLite recovery copy. A PostgreSQL URL
is opt-in through the environment, so opening the GUI never silently targets
production.
"""

from __future__ import annotations

import os
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parent
DEFAULT_SQLITE_PATH = EDITOR_DIR.parent / "pokemon" / "data" / "pokego.db"


def catalog_database_target() -> str:
    """Return the explicit editor target or the local SQLite fallback."""
    configured = os.environ.get("POKEGO_EDITOR_DATABASE_URL", "").strip()
    if configured:
        return configured
    return str(DEFAULT_SQLITE_PATH)


def catalog_database_label(target: str) -> str:
    """Return a non-secret label suitable for the editor window title."""
    configured_label = os.environ.get("POKEGO_EDITOR_DATABASE_LABEL", "").strip()
    if configured_label:
        return configured_label
    normalized = target.strip().lower()
    if normalized.startswith(("postgres://", "postgresql://")):
        return "PostgreSQL catalog"
    return "SQLite recovery copy"
