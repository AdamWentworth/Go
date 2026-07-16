"""Helpers for local catalog artwork and cache-safe public URLs."""

from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit


def catalog_image_file_path(asset_root: str, catalog_url: str) -> Path:
    """Resolve a catalog URL to its local asset while ignoring cache metadata."""
    relative_path = urlsplit(catalog_url).path.lstrip("\\/")
    return Path(asset_root) / relative_path


def version_catalog_image_url(catalog_url: str, image_path: str | Path) -> str:
    """Attach a content-derived version so replaced artwork bypasses edge caches."""
    path = Path(image_path)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    parsed = urlsplit(catalog_url)
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, f"v={digest}", ""))
