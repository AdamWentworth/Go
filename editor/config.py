"""Runtime configuration for the internal catalog editor."""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import urlparse

from dotenv import load_dotenv


EDITOR_DIR = Path(__file__).resolve().parent
DEFAULT_EDITOR_ENV_PATH = EDITOR_DIR / ".env"


def load_editor_environment(path: Path = DEFAULT_EDITOR_ENV_PATH) -> None:
    """Load local editor settings without overriding explicit shell values."""
    load_dotenv(path, override=False)


def editor_mode() -> str:
    """Return the sole supported authoring target mode."""
    mode = os.environ.get("POKEGO_EDITOR_MODE", "production").strip().lower()
    if mode != "production":
        raise ValueError("POKEGO_EDITOR_MODE must be 'production'.")
    return mode


def production_editor_settings() -> dict[str, str]:
    """Read non-secret SSH settings for the production editor session."""
    host = os.environ.get("POKEGO_EDITOR_PROD_HOST", "").strip()
    if not host:
        raise ValueError("POKEGO_EDITOR_PROD_HOST is required for production editor mode.")

    local_port = os.environ.get("POKEGO_EDITOR_POSTGRES_PORT", "5433").strip()
    if not local_port.isdigit() or not 1 <= int(local_port) <= 65535:
        raise ValueError("POKEGO_EDITOR_POSTGRES_PORT must be a valid TCP port.")

    ssh_key = os.environ.get("POKEGO_EDITOR_SSH_KEY", "").strip()
    if ssh_key:
        ssh_key = str(Path(ssh_key).expanduser())

    catalog_api_url = os.environ.get(
        "POKEGO_EDITOR_CATALOG_API_URL",
        "https://pokegonexus.com/api/pokemon",
    ).strip().rstrip("/")
    parsed_catalog_url = urlparse(catalog_api_url)
    if parsed_catalog_url.scheme not in {"http", "https"} or not parsed_catalog_url.netloc:
        raise ValueError("POKEGO_EDITOR_CATALOG_API_URL must be an HTTP(S) URL.")

    return {
        "host": host,
        "ssh_key": ssh_key,
        "deploy_root": os.environ.get(
            "POKEGO_EDITOR_DEPLOY_ROOT", "/srv/pokegonexus"
        ).strip(),
        "publisher_env": os.environ.get(
            "POKEGO_EDITOR_PUBLISHER_ENV", ""
        ).strip(),
        "local_port": local_port,
        "catalog_api_url": catalog_api_url,
    }


def catalog_database_target() -> str:
    """Return the PostgreSQL catalog URL prepared for the editor session."""
    configured = os.environ.get("POKEGO_EDITOR_DATABASE_URL", "").strip()
    if not configured:
        raise ValueError("POKEGO_EDITOR_DATABASE_URL is required for the PostgreSQL catalog editor.")
    return configured


def catalog_database_label(target: str) -> str:
    """Return a non-secret label suitable for the editor window title."""
    configured_label = os.environ.get("POKEGO_EDITOR_DATABASE_LABEL", "").strip()
    if configured_label:
        return configured_label
    return "PostgreSQL catalog"
