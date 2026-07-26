"""Pure helpers for synchronizing Pokemon GO Shadow release metadata."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

from PIL import Image


SHINY_SHADOW_RULE_DATE = date(2026, 3, 3)
_SOURCE_DATE_PATTERN = re.compile(
    r"(January|February|March|April|May|June|July|August|September|"
    r"October|November|December)\s+\d{1,2},\s+\d{4}"
)


@dataclass(frozen=True)
class ShadowSourceEntry:
    token: str
    name: str
    released_on: date
    source_marks_shiny: bool


def _split_top_level(value: str) -> list[str]:
    """Split a MediaWiki template without splitting nested templates or links."""
    parts: list[str] = []
    start = 0
    depth = 0
    index = 0
    while index < len(value):
        pair = value[index : index + 2]
        if pair in {"{{", "[["}:
            depth += 1
            index += 2
            continue
        if pair in {"}}", "]]"}:
            depth = max(0, depth - 1)
            index += 2
            continue
        if value[index] == "|" and depth == 0:
            parts.append(value[start:index])
            start = index + 1
        index += 1
    parts.append(value[start:])
    return parts


def parse_shadow_source_wikitext(
    wikitext: str,
) -> tuple[list[ShadowSourceEntry], list[tuple[str, str, str]]]:
    """Parse dated release rows and return undated/unobtainable rows separately."""
    entries: list[ShadowSourceEntry] = []
    excluded: list[tuple[str, str, str]] = []

    for source_line in wikitext.splitlines():
        line = source_line.strip()
        start = line.find("{{lop/shadow/GO|")
        if start < 0:
            continue

        raw_template = line[start + 2 :]
        if raw_template.endswith("-->"):
            raw_template = raw_template[:-3]
        if raw_template.endswith("}}"):
            raw_template = raw_template[:-2]

        positional: list[str] = []
        named: dict[str, str] = {}
        for part in _split_top_level(raw_template)[1:]:
            if "=" in part and not part.startswith(("{{", "[[")):
                key, value = part.split("=", 1)
                named[key.strip()] = value.strip()
            else:
                positional.append(part.strip())

        if len(positional) != 7:
            raise ValueError(
                "Unexpected Shadow source row shape for "
                f"{positional[:2] or raw_template[:40]!r}: {len(positional)} fields"
            )

        token, name = positional[:2]
        raw_date = positional[6]
        date_match = _SOURCE_DATE_PATTERN.search(raw_date)
        if date_match is None:
            excluded.append((token, name, raw_date))
            continue

        entries.append(
            ShadowSourceEntry(
                token=token,
                name=name,
                released_on=datetime.strptime(
                    date_match.group(0), "%B %d, %Y"
                ).date(),
                source_marks_shiny=named.get("shiny") == "yes",
            )
        )

    return entries, excluded


def parse_catalog_date(value: object) -> date | None:
    if value is None:
        return None
    normalized = str(value).strip()
    if not normalized:
        return None
    try:
        return date.fromisoformat(normalized[:10])
    except ValueError:
        return None


def catalog_asset_path(repo_root: Path, image_url: object) -> Path:
    """Resolve legacy catalog URLs that may contain Windows separators."""
    relative_url = str(image_url).replace("\\", "/").lstrip("/")
    return repo_root / "assets" / relative_url


def shiny_shadow_release_date(
    *,
    shadow_released_on: date,
    shiny_released_on: date | None,
    existing_shiny_shadow_date: date | None,
) -> date:
    """Return the earliest defensible Shiny Shadow availability date."""
    prerequisites_met = max(
        shadow_released_on,
        shiny_released_on or shadow_released_on,
    )
    universal_eligibility = max(prerequisites_met, SHINY_SHADOW_RULE_DATE)

    if (
        existing_shiny_shadow_date is not None
        and existing_shiny_shadow_date >= prerequisites_met
    ):
        return min(existing_shiny_shadow_date, universal_eligibility)
    return universal_eligibility


def compose_shadow_image(
    pokemon_image: Image.Image,
    *,
    asset_root: Path,
    include_shiny_icon: bool,
) -> Image.Image:
    """Apply the established 240px Shadow aura and registration icons."""
    base_image = Image.new("RGBA", (240, 240), (0, 0, 0, 0))
    shadow_effect = Image.open(asset_root / "shadow_effect.png").convert("RGBA")
    shadow_icon = Image.open(asset_root / "shadow_icon_middle_ground.png").convert(
        "RGBA"
    )

    shadow_effect = shadow_effect.resize(
        (240, int((240 / shadow_effect.width) * shadow_effect.height))
    )
    effect_position = (
        (base_image.width - shadow_effect.width) // 2,
        (base_image.height - shadow_effect.height) // 2 + 20,
    )
    base_image.paste(shadow_effect, effect_position, shadow_effect)

    normalized_pokemon = pokemon_image.convert("RGBA").resize((240, 240))
    base_image.paste(normalized_pokemon, (0, 0), normalized_pokemon)

    if include_shiny_icon:
        shiny_icon = Image.open(asset_root / "shiny_icon.png").convert("RGBA")
        base_image.paste(shiny_icon, (0, 0), shiny_icon)

    shadow_position = (0, base_image.height - shadow_icon.height)
    base_image.paste(shadow_icon, shadow_position, shadow_icon)
    return base_image
