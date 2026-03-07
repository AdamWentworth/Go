from __future__ import annotations

import os
from hashlib import blake2b
from typing import Dict, Tuple

from PIL import Image


class LocalImagePreviewCache:
    def __init__(self):
        self._cache: Dict[Tuple[str, int], Tuple[Tuple[int, int, int], bytes, Image.Image]] = {}
        self._placeholder_cache: Dict[Tuple[int, Tuple[int, int, int, int]], Image.Image] = {}

    def clear(self):
        self._cache.clear()
        self._placeholder_cache.clear()

    def get_resized_image(self, absolute_path: str | None, size: int):
        if not absolute_path:
            return None

        normalized_path = os.path.abspath(absolute_path)
        if not os.path.exists(normalized_path):
            return None

        stat_result = os.stat(normalized_path)
        stamp = (
            stat_result.st_mtime_ns,
            stat_result.st_ctime_ns,
            stat_result.st_size,
        )
        fingerprint = self._content_fingerprint(normalized_path, stat_result.st_size)
        cache_key = (normalized_path, size)
        cached = self._cache.get(cache_key)
        if cached and cached[0] == stamp and cached[1] == fingerprint:
            return cached[2].copy()

        with Image.open(normalized_path) as image:
            prepared = image.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS)
        self._cache[cache_key] = (stamp, fingerprint, prepared)
        return prepared.copy()

    def get_placeholder(self, size: int, color=(190, 190, 190, 255)):
        cache_key = (size, color)
        cached = self._placeholder_cache.get(cache_key)
        if cached is None:
            cached = Image.new("RGBA", (size, size), color)
            self._placeholder_cache[cache_key] = cached
        return cached.copy()

    @staticmethod
    def _content_fingerprint(absolute_path: str, file_size: int) -> bytes:
        chunk_size = 1024
        hasher = blake2b(digest_size=16)
        with open(absolute_path, "rb") as file_handle:
            if file_size <= chunk_size * 2:
                hasher.update(file_handle.read())
            else:
                hasher.update(file_handle.read(chunk_size))
                file_handle.seek(-chunk_size, os.SEEK_END)
                hasher.update(file_handle.read(chunk_size))
        return hasher.digest()
