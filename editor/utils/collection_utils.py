from __future__ import annotations

from math import ceil
from typing import Iterable, List, Sequence, Tuple


def normalize_query(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def paginate_items(items: Sequence, page_index: int, page_size: int):
    if page_size <= 0:
        raise ValueError("page_size must be greater than zero")

    total_pages = max(1, ceil(len(items) / page_size))
    clamped_page_index = min(max(page_index, 0), total_pages - 1)
    start = clamped_page_index * page_size
    end = start + page_size
    return list(items[start:end]), clamped_page_index, total_pages


def format_costume_row_label(costume_row: Sequence) -> str:
    costume_id = costume_row[0]
    costume_name = (costume_row[2] or "").strip() or "(unnamed costume)"
    return f"{costume_id}: {costume_name}"


def filter_costume_rows(costume_rows: Iterable[Sequence], query: str | None) -> List[Sequence]:
    normalized_query = normalize_query(query)
    if not normalized_query:
        return list(costume_rows)

    tokens = normalized_query.split(" ")
    filtered_rows = []
    for row in costume_rows:
        haystack = " ".join(
            str(value or "")
            for value in (
                row[0],
                row[2],
                row[6],
                row[7],
                row[8],
                row[9],
            )
        ).lower()
        if all(token in haystack for token in tokens):
            filtered_rows.append(row)
    return filtered_rows


def format_background_row_label(background_row: Sequence) -> str:
    link_row_id = background_row[0]
    background_id = background_row[2]
    background_name = (background_row[4] or "").strip() or "(unnamed background)"
    costume_id = background_row[3]
    costume_suffix = f" [costume {costume_id}]" if costume_id is not None else ""
    return f"Link {link_row_id} | Background {background_id}: {background_name}{costume_suffix}"


def filter_background_rows(background_rows: Iterable[Sequence], query: str | None) -> List[Sequence]:
    normalized_query = normalize_query(query)
    if not normalized_query:
        return list(background_rows)

    tokens = normalized_query.split(" ")
    filtered_rows = []
    for row in background_rows:
        haystack = " ".join(
            str(value or "")
            for value in (
                row[0],
                row[2],
                row[3],
                row[4],
                row[5],
                row[7],
            )
        ).lower()
        if all(token in haystack for token in tokens):
            filtered_rows.append(row)
    return filtered_rows
