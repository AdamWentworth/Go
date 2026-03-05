#!/usr/bin/env python3
"""
Sync background metadata from the Pokemon GO Fandom page into pokego.db.

Default behavior is DRY-RUN (no DB/file writes). Use --apply to persist.
"""

from __future__ import annotations

import argparse
import os
import re
import sqlite3
from dataclasses import dataclass, field
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple
from urllib.parse import urlparse

import requests
from PIL import Image
from bs4 import BeautifulSoup, Tag


FANDOM_PARSE_API = (
    "https://pokemongo.fandom.com/api.php"
    "?action=parse&page=Backgrounds&prop=text&format=json"
)
DEFAULT_TIMEOUT = 20
DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


MONTH_TO_NUM = {
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
}


MONTH_NAME_PATTERN = re.compile(
    r"\b("
    r"January|February|March|April|May|June|July|August|September|October|November|December"
    r")\b",
    flags=re.IGNORECASE,
)


@dataclass
class ParsedBackground:
    image_filename: str
    source_image_url: str
    name: str
    location: Optional[str]
    date: Optional[str]
    event: Optional[str]
    pokemon_refs: Set[Tuple[str, str]] = field(default_factory=set)


@dataclass(frozen=True)
class CostumeRecord:
    costume_id: int
    pokemon_id: int
    costume_name: str
    image_urls: Tuple[str, ...]
    match_tokens: Set[str]


@dataclass
class BackgroundRecord:
    background_id: int
    name: Optional[str]
    location: Optional[str]
    image_url: Optional[str]
    date: Optional[str]


@dataclass
class SyncStats:
    parsed_backgrounds: int = 0
    skipped_without_image_url: int = 0
    backgrounds_inserted: int = 0
    backgrounds_updated: int = 0
    links_added: int = 0
    links_collapsed_pair: int = 0
    links_deduped_exact: int = 0
    unresolved_pokemon_names: int = 0
    costume_auto_matches: int = 0
    costume_uncertain_skipped: int = 0
    costume_no_candidate_skipped: int = 0
    images_downloaded: int = 0
    images_already_present: int = 0
    images_cropped: int = 0
    image_download_failures: int = 0


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip())


def normalize_rel_path(path_value: str) -> str:
    normalized = (path_value or "").replace("\\", "/").lstrip("/")
    return f"/{normalized}"


def extract_filename(value: str) -> Optional[str]:
    if not value:
        return None
    parsed = urlparse(value)
    candidate = parsed.path or value
    base = os.path.basename(candidate).strip()
    if not base:
        return None
    base = base.split("?")[0]
    return base or None


def normalize_fandom_image_url(url: str) -> Optional[str]:
    if not url:
        return None
    normalized = url.strip()
    if not normalized:
        return None
    if normalized.startswith("//"):
        normalized = "https:" + normalized
    if normalized.startswith("http://"):
        normalized = "https://" + normalized[len("http://") :]
    return normalized


def derive_background_name_from_filename(image_filename: str) -> str:
    stem = Path(image_filename).stem
    value = stem.replace("_", " ")
    value = re.sub(r"(?i)^special background\s+", "", value)
    value = re.sub(r"(?i)^location card\s+", "", value)
    value = re.sub(r"(?i)^location background\s+", "", value)
    value = normalize_space(value)
    return value or stem


def parse_start_date(
    event_text: Optional[str],
    default_year: Optional[int] = None,
    fallback_text: Optional[str] = None,
) -> Optional[str]:
    text = normalize_space(event_text or "")
    if not text:
        return None

    year_match = re.search(r"\b(20\d{2})\b", text)
    if year_match:
        year = int(year_match.group(1))
    elif default_year is not None:
        year = int(default_year)
    else:
        fallback_year_match = re.search(r"\b(20\d{2})\b", normalize_space(fallback_text or ""))
        if not fallback_year_match:
            return None
        year = int(fallback_year_match.group(1))

    md_match = re.search(rf"{MONTH_NAME_PATTERN.pattern}\s+(\d{{1,2}})", text, flags=re.IGNORECASE)
    if not md_match:
        return None

    month_name = md_match.group(1).lower()
    day = int(md_match.group(2))
    month = MONTH_TO_NUM.get(month_name)
    if not month:
        return None

    try:
        return datetime(year=year, month=month, day=day).strftime("%Y-%m-%d")
    except ValueError:
        return None


def infer_table_year(table: Tag) -> Optional[int]:
    for heading in table.find_all_previous(["h2", "h3", "h4", "h5", "h6"], limit=12):
        heading_text = normalize_space(heading.get_text(" ", strip=True))
        year_match = re.search(r"\b(20\d{2})\b", heading_text)
        if year_match:
            return int(year_match.group(1))
    return None


def looks_like_location_label(text: Optional[str]) -> bool:
    value = normalize_space(text or "")
    if not value:
        return False
    if MONTH_NAME_PATTERN.search(value):
        return False
    if re.search(r"\d", value):
        return False
    if "," in value:
        return True
    return value.lower().endswith("japan")


def normalize_pokemon_name_for_lookup(value: str) -> str:
    lowered = normalize_space(value).lower()
    lowered = lowered.replace("é", "e")
    lowered = re.sub(r"\(.*?\)", "", lowered)
    lowered = normalize_space(lowered)
    lowered = re.sub(r"[^a-z0-9]+", "", lowered)
    return lowered


def tokenize_for_matching(value: str) -> List[str]:
    return [token for token in re.split(r"[^a-z0-9]+", normalize_space(value).lower()) if token]


def infer_costume_hint_tokens(title: str, image_key: str) -> Set[str]:
    filename = extract_filename(image_key or "") or image_key or ""
    stem = Path(filename).stem
    image_tokens = set(tokenize_for_matching(stem))
    species_tokens = set(tokenize_for_matching(title))
    ignored = {
        "pokemon",
        "default",
        "shiny",
        "female",
        "male",
        "normal",
        "form",
        "forme",
        "mega",
        "primal",
        "gmax",
        "gigantamax",
        "shadow",
        "apex",
        "alolan",
        "galarian",
        "hisuian",
        "paldean",
    }

    return {
        t
        for t in image_tokens
        if t not in species_tokens and not t.isdigit() and t not in ignored and len(t) > 1
    }


def build_costume_match_tokens(costume_name: str, image_urls: Sequence[str]) -> Set[str]:
    ignored = {
        "pokemon",
        "costume",
        "costumes",
        "default",
        "shiny",
        "female",
        "male",
        "images",
    }
    tokens: Set[str] = set()
    tokens.update(tokenize_for_matching(costume_name))
    for image_url in image_urls:
        filename = extract_filename(image_url or "")
        if not filename:
            continue
        tokens.update(tokenize_for_matching(Path(filename).stem))
    return {token for token in tokens if token not in ignored and not token.isdigit()}


def choose_preferred_pokemon_id(rows: List[Tuple[int, str, Optional[str]]]) -> int:
    def score(row: Tuple[int, str, Optional[str]]) -> Tuple[int, int]:
        pokemon_id, _name, form = row
        norm_form = normalize_space(form or "").lower()
        if not norm_form:
            return (0, pokemon_id)
        if norm_form in {"hero", "base", "normal", "standard"}:
            return (1, pokemon_id)
        return (2, pokemon_id)

    return sorted(rows, key=score)[0][0]


def parse_background_cell(cell: Optional[Tag]) -> Optional[Tuple[str, str, str, Optional[str]]]:
    if cell is None:
        return None

    image_anchor = cell.select_one("a.mw-file-description.image")
    image_tag = None
    if image_anchor is not None:
        image_tag = image_anchor.find("img")
    if image_tag is None:
        image_tag = cell.select_one("img.mw-file-element")
    if image_tag is None:
        return None

    image_key = image_tag.get("data-image-key") or image_tag.get("data-image-name") or ""
    image_url = normalize_fandom_image_url(
        (image_anchor.get("href") if image_anchor is not None else None)
        or image_tag.get("data-src")
        or image_tag.get("src")
        or ""
    )
    if not image_url:
        return None

    filename = extract_filename(image_key) or extract_filename(image_url)
    if not filename:
        return None

    raw_text = normalize_space(cell.get_text(" ", strip=True))
    raw_text = re.sub(r"(?i)\brequires\s+fusion\b", "", raw_text)
    raw_text = normalize_space(raw_text)
    location = raw_text or None

    return filename, image_url, image_key or filename, location


def parse_pokemon_refs(cell: Optional[Tag]) -> Set[Tuple[str, str]]:
    if cell is None:
        return set()

    refs: Set[Tuple[str, str]] = set()
    for anchor in cell.select("a[title]"):
        image_tag = anchor.find("img")
        if image_tag is None:
            continue
        title = normalize_space(anchor.get("title") or "")
        if not title:
            continue
        image_key = (
            image_tag.get("data-image-key")
            or image_tag.get("data-image-name")
            or image_tag.get("data-src")
            or image_tag.get("src")
            or ""
        )
        refs.add((title, str(image_key)))
    return refs


def iter_rows_with_rowspan(table: Tag) -> Iterable[Dict[int, Tag]]:
    active: Dict[int, Tuple[Tag, int]] = {}
    rows = table.find_all("tr")
    for tr in rows[1:]:
        columns: Dict[int, Tag] = {}

        next_active: Dict[int, Tuple[Tag, int]] = {}
        for col, (cell, remaining) in active.items():
            columns[col] = cell
            if remaining > 1:
                next_active[col] = (cell, remaining - 1)
        active = next_active

        col_idx = 0
        for cell in tr.find_all(["td", "th"], recursive=False):
            while col_idx in columns:
                col_idx += 1

            rowspan = int(cell.get("rowspan", "1") or "1")
            colspan = int(cell.get("colspan", "1") or "1")

            for offset in range(colspan):
                target_col = col_idx + offset
                columns[target_col] = cell
                if rowspan > 1:
                    active[target_col] = (cell, rowspan - 1)

            col_idx += colspan

        yield columns


def parse_backgrounds_from_html(html: str) -> List[ParsedBackground]:
    soup = BeautifulSoup(html, "html.parser")
    parsed: Dict[str, ParsedBackground] = {}

    for table in soup.select("table.pogo-legacy-table"):
        header = [
            normalize_space(th.get_text(" ", strip=True)).lower().replace("é", "e")
            for th in table.select("tr:first-child th")
        ]
        if len(header) < 2:
            continue
        if "background" not in header[0]:
            continue
        if "pokemon" not in header[1]:
            continue

        table_year = infer_table_year(table)

        table_last_valid_date: Optional[str] = None
        for columns in iter_rows_with_rowspan(table):
            bg_data = parse_background_cell(columns.get(0))
            if not bg_data:
                continue

            image_filename, source_image_url, image_key, location = bg_data
            event_text = normalize_space(columns.get(2).get_text(" ", strip=True)) if columns.get(2) else None
            date_value = parse_start_date(
                event_text,
                default_year=table_year,
                fallback_text=image_filename,
            )
            if date_value is None and looks_like_location_label(event_text) and table_last_valid_date:
                date_value = table_last_valid_date
            if date_value:
                table_last_valid_date = date_value
            pokemon_refs = parse_pokemon_refs(columns.get(1))

            key = image_filename.lower()
            if key not in parsed:
                parsed[key] = ParsedBackground(
                    image_filename=image_filename,
                    source_image_url=source_image_url,
                    name=derive_background_name_from_filename(image_key),
                    location=location,
                    date=date_value,
                    event=event_text,
                )
            else:
                entry = parsed[key]
                if not entry.location and location:
                    entry.location = location
                if not entry.date and date_value:
                    entry.date = date_value
                if (not entry.event) and event_text:
                    entry.event = event_text
                if entry.source_image_url != source_image_url and source_image_url:
                    entry.source_image_url = source_image_url

            parsed[key].pokemon_refs.update(pokemon_refs)

    return sorted(parsed.values(), key=lambda item: item.image_filename.lower())


def fetch_fandom_background_html(session: requests.Session, timeout: int) -> str:
    response = session.get(
        FANDOM_PARSE_API,
        timeout=timeout,
        headers={"User-Agent": DEFAULT_USER_AGENT},
    )
    response.raise_for_status()
    payload = response.json()
    return payload["parse"]["text"]["*"]


def build_pokemon_lookup(conn: sqlite3.Connection) -> Dict[str, int]:
    cursor = conn.cursor()
    cursor.execute("SELECT pokemon_id, name, form FROM pokemon")
    grouped: Dict[str, List[Tuple[int, str, Optional[str]]]] = {}
    form_specific: Dict[str, int] = {}
    for pokemon_id, name, form in cursor.fetchall():
        key = normalize_pokemon_name_for_lookup(name)
        grouped.setdefault(key, []).append((int(pokemon_id), str(name), form))
        if form:
            form_key = normalize_pokemon_name_for_lookup(f"{form} {name}")
            form_specific[form_key] = int(pokemon_id)

    lookup: Dict[str, int] = {}
    for key, rows in grouped.items():
        lookup[key] = choose_preferred_pokemon_id(rows)
    lookup.update(form_specific)
    return lookup


def resolve_pokemon_id(title: str, pokemon_lookup: Dict[str, int]) -> Optional[int]:
    key = normalize_pokemon_name_for_lookup(title)
    resolved = pokemon_lookup.get(key)
    if resolved is not None:
        return resolved

    # Fallback for regional prefixes when wiki title is e.g. "Alolan Vulpix".
    stripped = re.sub(
        r"^(alolan|galarian|hisuian|paldean)\s+",
        "",
        normalize_space(title),
        flags=re.IGNORECASE,
    )
    if stripped != title:
        return pokemon_lookup.get(normalize_pokemon_name_for_lookup(stripped))

    return None


def build_costume_lookup(conn: sqlite3.Connection) -> Dict[int, List[CostumeRecord]]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT
            costume_id,
            pokemon_id,
            costume_name,
            image_url_costume,
            image_url_shiny_costume,
            image_url_costume_female,
            image_url_shiny_costume_female
        FROM costume_pokemon
        """
    )
    by_pokemon: Dict[int, List[CostumeRecord]] = {}
    for row in cursor.fetchall():
        costume_id = int(row[0])
        pokemon_id = int(row[1])
        costume_name = normalize_space(row[2] or "")
        image_urls = tuple(value for value in row[3:] if value)
        match_tokens = build_costume_match_tokens(costume_name, image_urls)
        by_pokemon.setdefault(pokemon_id, []).append(
            CostumeRecord(
                costume_id=costume_id,
                pokemon_id=pokemon_id,
                costume_name=costume_name,
                image_urls=image_urls,
                match_tokens=match_tokens,
            )
        )
    return by_pokemon


def resolve_costume_id_for_ref(
    pokemon_id: int,
    title: str,
    image_key: str,
    costume_lookup: Dict[int, List[CostumeRecord]],
) -> Tuple[Optional[int], bool, str, List[int], Set[str]]:
    costumes = costume_lookup.get(pokemon_id, [])
    hint_tokens = infer_costume_hint_tokens(title, image_key)
    if not hint_tokens or not costumes:
        return None, False, "not_costume", [], hint_tokens

    scored: List[Tuple[int, int, CostumeRecord]] = []
    for costume in costumes:
        overlap = hint_tokens.intersection(costume.match_tokens)
        if not overlap:
            continue
        scored.append((len(overlap), len(costume.match_tokens), costume))

    if not scored:
        return None, True, "no_candidate", [], hint_tokens

    scored.sort(key=lambda item: (item[0], -item[1], -item[2].costume_id), reverse=True)
    top_score = scored[0][0]
    top = [entry for entry in scored if entry[0] == top_score]

    if len(top) == 1:
        return top[0][2].costume_id, True, "matched", [], hint_tokens

    subset_candidates = [entry for entry in top if hint_tokens.issubset(entry[2].match_tokens)]
    if len(subset_candidates) == 1:
        return subset_candidates[0][2].costume_id, True, "matched", [], hint_tokens

    candidate_ids = sorted({entry[2].costume_id for entry in top})
    return None, True, "ambiguous", candidate_ids, hint_tokens


def normalize_desired_links(desired_links: Set[Tuple[int, Optional[int]]]) -> Set[Tuple[int, Optional[int]]]:
    by_pokemon: Dict[int, Set[Optional[int]]] = {}
    for pokemon_id, costume_id in desired_links:
        by_pokemon.setdefault(pokemon_id, set()).add(costume_id)

    normalized = set(desired_links)
    for pokemon_id, costume_ids in by_pokemon.items():
        has_costume = any(costume_id is not None for costume_id in costume_ids)
        if has_costume and (pokemon_id, None) in normalized:
            normalized.remove((pokemon_id, None))
    return normalized


def load_background_records(
    conn: sqlite3.Connection,
) -> Tuple[Dict[str, BackgroundRecord], Dict[int, Set[Tuple[int, Optional[int]]]]]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT background_id, name, location, image_url, date
        FROM backgrounds
        ORDER BY background_id
        """
    )
    by_filename: Dict[str, BackgroundRecord] = {}
    for row in cursor.fetchall():
        record = BackgroundRecord(
            background_id=int(row[0]),
            name=row[1],
            location=row[2],
            image_url=row[3],
            date=row[4],
        )
        filename = extract_filename(record.image_url or "")
        if filename:
            by_filename[filename.lower()] = record

    cursor.execute("SELECT background_id, pokemon_id, costume_id FROM pokemon_backgrounds")
    links: Dict[int, Set[Tuple[int, Optional[int]]]] = {}
    for background_id, pokemon_id, costume_id in cursor.fetchall():
        links.setdefault(int(background_id), set()).add((int(pokemon_id), int(costume_id) if costume_id is not None else None))

    return by_filename, links


def dedupe_exact_background_links(
    conn: sqlite3.Connection,
    dry_run: bool,
    verbose: bool,
    stats: SyncStats,
) -> None:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT rowid, pokemon_id, background_id, costume_id
        FROM pokemon_backgrounds
        ORDER BY pokemon_id, background_id, COALESCE(costume_id, -1), rowid
        """
    )
    rows = cursor.fetchall()
    seen: Set[Tuple[int, int, Optional[int]]] = set()
    duplicate_rowids: List[int] = []
    for rowid, pokemon_id, background_id, costume_id in rows:
        key = (int(pokemon_id), int(background_id), int(costume_id) if costume_id is not None else None)
        if key in seen:
            duplicate_rowids.append(int(rowid))
        else:
            seen.add(key)

    if not duplicate_rowids:
        return

    stats.links_deduped_exact += len(duplicate_rowids)
    if dry_run:
        if verbose:
            print(f"[DRY] Would remove {len(duplicate_rowids)} exact duplicate pokemon_background rows")
        return

    cursor.executemany("DELETE FROM pokemon_backgrounds WHERE rowid = ?", [(rowid,) for rowid in duplicate_rowids])
    if verbose:
        print(f"[INFO] Removed {len(duplicate_rowids)} exact duplicate pokemon_background rows")


def collapse_links_to_one_per_pokemon_background(
    conn: sqlite3.Connection,
    dry_run: bool,
    verbose: bool,
    stats: SyncStats,
) -> None:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT rowid, pokemon_id, background_id, costume_id
        FROM pokemon_backgrounds
        ORDER BY pokemon_id, background_id, rowid
        """
    )
    rows = cursor.fetchall()
    kept_by_pair: Dict[Tuple[int, int], Tuple[int, Optional[int]]] = {}
    remove_rowids: List[int] = []

    for rowid, pokemon_id, background_id, costume_id in rows:
        pair = (int(pokemon_id), int(background_id))
        normalized_costume = int(costume_id) if costume_id is not None else None
        existing = kept_by_pair.get(pair)
        if existing is None:
            kept_by_pair[pair] = (int(rowid), normalized_costume)
            continue

        kept_rowid, kept_costume = existing
        should_replace_kept = kept_costume is None and normalized_costume is not None
        if should_replace_kept:
            remove_rowids.append(kept_rowid)
            kept_by_pair[pair] = (int(rowid), normalized_costume)
        else:
            remove_rowids.append(int(rowid))

    if not remove_rowids:
        return

    stats.links_collapsed_pair += len(remove_rowids)
    if dry_run:
        if verbose:
            print(
                f"[DRY] Would remove {len(remove_rowids)} extra pokemon_background rows "
                "to enforce one row per (pokemon_id, background_id)"
            )
        return

    cursor.executemany("DELETE FROM pokemon_backgrounds WHERE rowid = ?", [(rowid,) for rowid in remove_rowids])
    if verbose:
        print(
            f"[INFO] Removed {len(remove_rowids)} extra pokemon_background rows "
            "to enforce one row per (pokemon_id, background_id)"
        )


def crop_solid_black_bottom(image: Image.Image, threshold: int = 4) -> Tuple[Image.Image, int]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()

    crop_bottom = height
    for y in range(height - 1, -1, -1):
        is_black_row = True
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r > threshold or g > threshold or b > threshold:
                is_black_row = False
                break
        if is_black_row:
            crop_bottom = y
        else:
            break

    if crop_bottom >= height or crop_bottom <= 0:
        return rgba, 0

    return rgba.crop((0, 0, width, crop_bottom)), height - crop_bottom


def resolve_local_image_rel_path(
    existing_image_url: Optional[str],
    image_filename: str,
) -> str:
    current = normalize_space(existing_image_url or "")
    if current and not current.startswith(("http://", "https://")):
        return normalize_rel_path(current)
    return f"/images/backgrounds/{image_filename}"


def ensure_background_row(
    conn: sqlite3.Connection,
    record: Optional[BackgroundRecord],
    parsed: ParsedBackground,
    dry_run: bool,
    verbose: bool,
    stats: SyncStats,
) -> Tuple[int, str]:
    desired_image_rel = resolve_local_image_rel_path(record.image_url if record else None, parsed.image_filename)
    desired_name = normalize_space((record.name if record and record.name else parsed.name) or parsed.name)
    desired_location = record.location if record and record.location else parsed.location
    desired_date = record.date if record and record.date else parsed.date

    if record is None:
        if dry_run:
            fake_id = -1
            if verbose:
                print(
                    f"[DRY] INSERT background name='{desired_name}' "
                    f"location='{desired_location}' image_url='{desired_image_rel}' date='{desired_date}'"
                )
            stats.backgrounds_inserted += 1
            return fake_id, desired_image_rel

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO backgrounds (name, location, image_url, date)
            VALUES (?, ?, ?, ?)
            """,
            (desired_name, desired_location, desired_image_rel, desired_date),
        )
        stats.backgrounds_inserted += 1
        return int(cursor.lastrowid), desired_image_rel

    updates: Dict[str, Optional[str]] = {}
    if not normalize_space(record.name or "") and desired_name:
        updates["name"] = desired_name
    if not normalize_space(record.location or "") and desired_location:
        updates["location"] = desired_location
    if (
        (not normalize_space(record.image_url or ""))
        or normalize_space(record.image_url or "").startswith(("http://", "https://"))
    ) and desired_image_rel:
        updates["image_url"] = desired_image_rel
    if not normalize_space(record.date or "") and desired_date:
        updates["date"] = desired_date

    if updates:
        if dry_run:
            if verbose:
                print(f"[DRY] UPDATE background_id={record.background_id} fields={updates}")
            stats.backgrounds_updated += 1
        else:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE backgrounds
                SET
                    name = ?,
                    location = ?,
                    image_url = ?,
                    date = ?
                WHERE background_id = ?
                """,
                (
                    updates.get("name", record.name),
                    updates.get("location", record.location),
                    updates.get("image_url", record.image_url),
                    updates.get("date", record.date),
                    record.background_id,
                ),
            )
            stats.backgrounds_updated += 1

    return record.background_id, resolve_local_image_rel_path(
        updates.get("image_url", record.image_url), parsed.image_filename
    )


def add_missing_links(
    conn: sqlite3.Connection,
    background_id: int,
    desired_links: Set[Tuple[int, Optional[int]]],
    existing_links: Set[Tuple[int, Optional[int]]],
    dry_run: bool,
    verbose: bool,
    stats: SyncStats,
) -> None:
    existing_pokemon = {pokemon_id for pokemon_id, _costume_id in existing_links}
    filtered_desired = {(pokemon_id, costume_id) for pokemon_id, costume_id in desired_links if pokemon_id not in existing_pokemon}
    missing = sorted(filtered_desired - existing_links, key=lambda item: (item[0], -1 if item[1] is None else item[1]))
    if not missing:
        return

    for pokemon_id, costume_id in missing:
        if dry_run:
            if verbose:
                print(
                    f"[DRY] LINK pokemon_id={pokemon_id} costume_id={costume_id} "
                    f"-> background_id={background_id}"
                )
            stats.links_added += 1
            continue

        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 1
            FROM pokemon_backgrounds
            WHERE pokemon_id = ? AND background_id = ?
            LIMIT 1
            """,
            (pokemon_id, background_id),
        )
        exists = cursor.fetchone() is not None
        if exists:
            continue

        cursor.execute(
            """
            INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id)
            VALUES (?, ?, ?)
            """,
            (pokemon_id, background_id, costume_id),
        )
        stats.links_added += 1


def maybe_download_image(
    session: requests.Session,
    parsed: ParsedBackground,
    assets_root: Path,
    rel_image_path: str,
    dry_run: bool,
    force: bool,
    threshold: int,
    timeout: int,
    verbose: bool,
    stats: SyncStats,
) -> None:
    if not parsed.source_image_url:
        stats.skipped_without_image_url += 1
        return

    absolute_path = assets_root / rel_image_path.lstrip("/\\")
    absolute_path.parent.mkdir(parents=True, exist_ok=True)

    if absolute_path.exists() and not force:
        stats.images_already_present += 1
        return

    if dry_run:
        if verbose:
            print(f"[DRY] DOWNLOAD {parsed.source_image_url} -> {absolute_path}")
        stats.images_downloaded += 1
        return

    try:
        response = session.get(
            parsed.source_image_url,
            timeout=timeout,
            headers={"User-Agent": DEFAULT_USER_AGENT},
        )
        response.raise_for_status()
        image = Image.open(BytesIO(response.content)).convert("RGBA")
        cropped_image, cropped_rows = crop_solid_black_bottom(image, threshold=threshold)
        cropped_image.save(absolute_path, format="PNG")
        stats.images_downloaded += 1
        if cropped_rows > 0:
            stats.images_cropped += 1
            if verbose:
                print(f"[INFO] Cropped {cropped_rows}px black footer from {parsed.image_filename}")
    except Exception as exc:
        stats.image_download_failures += 1
        print(f"[WARN] Failed to download {parsed.source_image_url}: {exc}")


def sync_backgrounds(
    conn: sqlite3.Connection,
    assets_root: Path,
    parsed_backgrounds: List[ParsedBackground],
    dry_run: bool,
    force_download: bool,
    crop_threshold: int,
    timeout: int,
    verbose: bool,
) -> SyncStats:
    stats = SyncStats(parsed_backgrounds=len(parsed_backgrounds))
    dedupe_exact_background_links(
        conn=conn,
        dry_run=dry_run,
        verbose=verbose,
        stats=stats,
    )
    collapse_links_to_one_per_pokemon_background(
        conn=conn,
        dry_run=dry_run,
        verbose=verbose,
        stats=stats,
    )
    by_filename, links_by_background = load_background_records(conn)
    pokemon_lookup = build_pokemon_lookup(conn)
    costume_lookup = build_costume_lookup(conn)

    unresolved_names: Set[str] = set()

    with requests.Session() as session:
        for parsed in parsed_backgrounds:
            existing = by_filename.get(parsed.image_filename.lower())
            background_id, rel_image_path = ensure_background_row(
                conn=conn,
                record=existing,
                parsed=parsed,
                dry_run=dry_run,
                verbose=verbose,
                stats=stats,
            )

            existing_links = links_by_background.get(background_id, set())
            existing_pokemon_for_background = {pokemon_id for pokemon_id, _costume_id in existing_links}

            desired_by_pokemon: Dict[int, Optional[int]] = {}
            for title, image_key in sorted(parsed.pokemon_refs):
                pokemon_id = resolve_pokemon_id(title, pokemon_lookup)
                if pokemon_id is None:
                    unresolved_names.add(title)
                    continue

                # Hard rule: one row per (pokemon_id, background_id). If it exists, skip.
                if pokemon_id in existing_pokemon_for_background:
                    continue

                costume_id, suspected_costume, reason, candidate_ids, hint_tokens = resolve_costume_id_for_ref(
                    pokemon_id=pokemon_id,
                    title=title,
                    image_key=image_key,
                    costume_lookup=costume_lookup,
                )

                current_value = desired_by_pokemon.get(pokemon_id)
                if costume_id is not None:
                    if current_value is None:
                        desired_by_pokemon[pokemon_id] = costume_id
                        stats.costume_auto_matches += 1
                        if verbose:
                            print(
                                f"[INFO] Costume match bg={parsed.image_filename} "
                                f"pokemon='{title}' image='{extract_filename(image_key) or image_key}' "
                                f"-> costume_id={costume_id}"
                            )
                    continue

                if suspected_costume:
                    if reason == "no_candidate":
                        stats.costume_no_candidate_skipped += 1
                    else:
                        stats.costume_uncertain_skipped += 1
                    print(
                        f"[COSTUME][{reason.upper()}] bg={parsed.image_filename} "
                        f"pokemon='{title}' image='{extract_filename(image_key) or image_key}' "
                        f"hints={sorted(hint_tokens)} candidates={candidate_ids or 'none'}"
                    )

                if pokemon_id not in desired_by_pokemon:
                    # No confident costume match: still keep generic link.
                    desired_by_pokemon[pokemon_id] = None

            desired_links = normalize_desired_links({(pokemon_id, costume_id) for pokemon_id, costume_id in desired_by_pokemon.items()})

            if desired_links and (background_id > 0 or dry_run):
                add_missing_links(
                    conn=conn,
                    background_id=background_id,
                    desired_links=desired_links,
                    existing_links=existing_links,
                    dry_run=dry_run,
                    verbose=verbose,
                    stats=stats,
                )
                if not dry_run:
                    links_by_background.setdefault(background_id, set()).update(desired_links)

            maybe_download_image(
                session=session,
                parsed=parsed,
                assets_root=assets_root,
                rel_image_path=rel_image_path,
                dry_run=dry_run,
                force=force_download,
                threshold=crop_threshold,
                timeout=timeout,
                verbose=verbose,
                stats=stats,
            )

            if existing is None and not dry_run and background_id > 0:
                by_filename[parsed.image_filename.lower()] = BackgroundRecord(
                    background_id=background_id,
                    name=parsed.name,
                    location=parsed.location,
                    image_url=rel_image_path,
                    date=parsed.date,
                )

    stats.unresolved_pokemon_names = len(unresolved_names)
    if unresolved_names:
        print(f"[WARN] Unresolved Pokemon names ({len(unresolved_names)}): {', '.join(sorted(unresolved_names))}")
    return stats


def parse_args() -> argparse.Namespace:
    repo_root = Path(__file__).resolve().parents[2]
    default_db = repo_root / "pokemon" / "data" / "pokego.db"
    default_assets = repo_root / "assets"

    parser = argparse.ArgumentParser(
        description=(
            "Sync backgrounds from the Fandom Backgrounds page into pokego.db and "
            "download images into assets/images/backgrounds."
        )
    )
    parser.add_argument("--db-path", default=str(default_db), help="Path to pokego.db")
    parser.add_argument("--assets-root", default=str(default_assets), help="Path to repo assets directory")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist DB changes and write files. Without this flag, runs in dry-run mode.",
    )
    parser.add_argument("--limit", type=int, default=0, help="Limit number of parsed backgrounds to process.")
    parser.add_argument(
        "--force-download",
        action="store_true",
        help="Re-download images even if local file already exists.",
    )
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="HTTP timeout seconds.")
    parser.add_argument(
        "--crop-black-threshold",
        type=int,
        default=4,
        help="RGB threshold for detecting solid black footer rows.",
    )
    parser.add_argument("--verbose", action="store_true", help="Print per-item actions.")
    return parser.parse_args()


def print_summary(stats: SyncStats, dry_run: bool) -> None:
    mode = "DRY-RUN" if dry_run else "APPLY"
    print(f"\n=== Background Sync Summary ({mode}) ===")
    print(f"Parsed backgrounds:        {stats.parsed_backgrounds}")
    print(f"Backgrounds inserted:      {stats.backgrounds_inserted}")
    print(f"Backgrounds updated:       {stats.backgrounds_updated}")
    print(f"Pokemon links added:       {stats.links_added}")
    print(f"Links collapsed (pair):    {stats.links_collapsed_pair}")
    print(f"Links deduped (exact):     {stats.links_deduped_exact}")
    print(f"Costume auto-matches:      {stats.costume_auto_matches}")
    print(f"Costume skipped (other):   {stats.costume_uncertain_skipped}")
    print(f"Costume skipped (no cand): {stats.costume_no_candidate_skipped}")
    print(f"Images downloaded:         {stats.images_downloaded}")
    print(f"Images already present:    {stats.images_already_present}")
    print(f"Images cropped (black):    {stats.images_cropped}")
    print(f"Image download failures:   {stats.image_download_failures}")
    print(f"Unresolved pokemon names:  {stats.unresolved_pokemon_names}")
    print(f"Skipped missing image URL: {stats.skipped_without_image_url}")


def main() -> int:
    args = parse_args()
    dry_run = not args.apply

    db_path = Path(args.db_path).resolve()
    assets_root = Path(args.assets_root).resolve()
    if not db_path.exists():
        raise FileNotFoundError(f"Database not found: {db_path}")
    if not assets_root.exists():
        raise FileNotFoundError(f"Assets root not found: {assets_root}")

    with requests.Session() as session:
        html = fetch_fandom_background_html(session=session, timeout=args.timeout)
    parsed = parse_backgrounds_from_html(html)

    if args.limit and args.limit > 0:
        parsed = parsed[: args.limit]

    conn = sqlite3.connect(str(db_path))
    try:
        stats = sync_backgrounds(
            conn=conn,
            assets_root=assets_root,
            parsed_backgrounds=parsed,
            dry_run=dry_run,
            force_download=args.force_download,
            crop_threshold=args.crop_black_threshold,
            timeout=args.timeout,
            verbose=args.verbose,
        )
        if dry_run:
            conn.rollback()
        else:
            conn.commit()
    finally:
        conn.close()

    print_summary(stats, dry_run=dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
