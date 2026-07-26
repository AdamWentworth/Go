#!/usr/bin/env python3
"""Synchronize released Shadow and Shiny Shadow catalog entries through 2026-07-26."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from dataclasses import dataclass
from datetime import date
from pathlib import Path

from PIL import Image


EDITOR_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = EDITOR_DIR.parent
ASSET_ROOT = REPO_ROOT / "assets" / "images"

if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from config import load_editor_environment, production_editor_settings  # noqa: E402
from production_session import ProductionCatalogSession  # noqa: E402
from scripts.postgres_catalog import (  # noqa: E402
    CatalogConnection,
    configured_database_url,
    open_catalog_connection,
)
from utils.shadow_release_catalog import (  # noqa: E402
    ShadowSourceEntry,
    catalog_asset_path,
    compose_shadow_image,
    parse_catalog_date,
    parse_shadow_source_wikitext,
    shiny_shadow_release_date,
)


SOURCE_REVISION = 4594411
SOURCE_PAGE_URL = (
    "https://bulbapedia.bulbagarden.net/wiki/"
    "List_of_Shadow_Pok%C3%A9mon_in_Pok%C3%A9mon_GO"
)
SOURCE_API_URL = (
    "https://bulbapedia.bulbagarden.net/w/api.php"
    f"?action=parse&oldid={SOURCE_REVISION}"
    "&prop=wikitext%7Crevid&format=json&formatversion=2"
)
SOURCE_USER_AGENT = "PokeGoNexus Shadow catalog audit/1.0"

EXPECTED_SOURCE_RELEASES = 486
EXPECTED_EXCLUDED_SOURCE_ROWS = 16
EXPECTED_POKEMON_TARGETS = 478
EXPECTED_COSTUME_TARGETS = 9
EXPECTED_SHINY_SHADOW_TARGETS = 473
EXPECTED_SHINY_SHADOW_COSTUME_TARGETS = 9

REGIONAL_SUFFIXES = {
    "A": "Alolan",
    "G": "Galarian",
    "H": "Hisuian",
}
APEX_TOKENS = {
    "0249A": 2301,
    "0250A": 2302,
}
COSTUME_TOKENS = {
    "0020Jan2020": 42,
    "0033Jan2020": 123,
    "0037Halloween2022": 154,
    "0038Halloween2022": 155,
    "0054Holiday2023": 243,
    "0055Holiday2023": 244,
    "0143GOFest2022": 153,
    "0281Fashion2020": 126,
    "0403Fashion2020": 127,
}
# Unfezant's female visual is an authored catalog row rather than a separate
# source-list entry. It shares the base species' Shadow availability.
DERIVED_FORM_TARGETS = {
    521: (2339,),
}
REQUIRED_SHINY_RELEASES = {
    821: date(2026, 6, 25),
    822: date(2026, 6, 25),
    823: date(2026, 6, 25),
}


@dataclass(frozen=True)
class CatalogPokemon:
    pokemon_id: int
    pokedex_number: int
    name: str
    form: str
    shiny_available: bool
    shiny_released_on: date | None


@dataclass(frozen=True)
class ReleaseTarget:
    source: ShadowSourceEntry
    kind: str
    target_id: int


@dataclass(frozen=True)
class SyncSummary:
    pokemon_targets: int
    costume_targets: int
    shiny_shadow_targets: int
    shiny_shadow_costume_targets: int
    generated_assets: tuple[str, ...]


def fetch_source_wikitext() -> tuple[str, int]:
    request = urllib.request.Request(
        SOURCE_API_URL,
        headers={"User-Agent": SOURCE_USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8"))
    parsed = payload["parse"]
    revision = int(parsed.get("revid") or SOURCE_REVISION)
    if revision != SOURCE_REVISION:
        raise RuntimeError(
            f"Expected pinned Shadow source revision {SOURCE_REVISION}, received {revision}."
        )
    return str(parsed["wikitext"]), revision


def load_catalog_pokemon(
    connection: CatalogConnection,
) -> tuple[dict[int, CatalogPokemon], dict[int, list[CatalogPokemon]]]:
    by_id: dict[int, CatalogPokemon] = {}
    by_dex: dict[int, list[CatalogPokemon]] = {}
    rows = connection.execute(
        """
        SELECT pokemon_id, pokedex_number, name, form, shiny_available,
               date_shiny_available
        FROM pokemon
        ORDER BY pokemon_id
        """
    ).fetchall()
    for row in rows:
        pokemon = CatalogPokemon(
            pokemon_id=int(row[0]),
            pokedex_number=int(row[1]),
            name=str(row[2]),
            form=str(row[3] or ""),
            shiny_available=bool(row[4]),
            shiny_released_on=parse_catalog_date(row[5]),
        )
        by_id[pokemon.pokemon_id] = pokemon
        by_dex.setdefault(pokemon.pokedex_number, []).append(pokemon)
    return by_id, by_dex


def resolve_release_targets(
    entries: list[ShadowSourceEntry],
    by_id: dict[int, CatalogPokemon],
    by_dex: dict[int, list[CatalogPokemon]],
) -> list[ReleaseTarget]:
    targets: list[ReleaseTarget] = []
    errors: list[str] = []

    for entry in entries:
        token = entry.token
        dex_number = int(token[:4])

        if token in COSTUME_TOKENS:
            targets.append(
                ReleaseTarget(entry, "costume", COSTUME_TOKENS[token])
            )
            continue

        if token in APEX_TOKENS:
            pokemon_id = APEX_TOKENS[token]
        elif len(token) == 4:
            pokemon_id = dex_number
        else:
            expected_form = REGIONAL_SUFFIXES.get(token[4:])
            matches = [
                pokemon
                for pokemon in by_dex.get(dex_number, [])
                if pokemon.form == expected_form
            ]
            if expected_form is None or len(matches) != 1:
                errors.append(f"{token} {entry.name}: unresolved catalog form")
                continue
            pokemon_id = matches[0].pokemon_id

        if pokemon_id not in by_id:
            errors.append(f"{token} {entry.name}: missing catalog Pokemon {pokemon_id}")
            continue
        targets.append(ReleaseTarget(entry, "pokemon", pokemon_id))

    for source_id, derived_ids in DERIVED_FORM_TARGETS.items():
        source_target = next(
            (
                target
                for target in targets
                if target.kind == "pokemon" and target.target_id == source_id
            ),
            None,
        )
        if source_target is None:
            errors.append(f"Missing source target for derived forms of {source_id}")
            continue
        for derived_id in derived_ids:
            if derived_id not in by_id:
                errors.append(f"Missing derived catalog form {derived_id}")
                continue
            targets.append(
                ReleaseTarget(source_target.source, "pokemon", derived_id)
            )

    if errors:
        raise RuntimeError("Shadow source mapping failed:\n  " + "\n  ".join(errors))
    return targets


def _ensure_required_shiny_metadata(connection: CatalogConnection) -> None:
    for pokemon_id, released_on in REQUIRED_SHINY_RELEASES.items():
        connection.execute(
            """
            UPDATE pokemon
            SET shiny_available = TRUE,
                date_shiny_available = ?
            WHERE pokemon_id = ?
            """,
            (released_on.isoformat(), pokemon_id),
        )


def _asset_url(folder: str, filename: str) -> str:
    return f"/images/{folder}/{filename}"


def _prepare_pokemon_assets(
    targets: list[ReleaseTarget],
    by_id: dict[int, CatalogPokemon],
    *,
    write: bool,
) -> tuple[dict[int, tuple[str, str | None]], list[str]]:
    urls: dict[int, tuple[str, str | None]] = {}
    generated: list[str] = []
    for target in targets:
        if target.kind != "pokemon":
            continue
        pokemon = by_id[target.target_id]
        shadow_name = f"shadow_pokemon_{pokemon.pokemon_id}.png"
        shadow_path = ASSET_ROOT / "shadow" / shadow_name
        if not shadow_path.is_file():
            raise RuntimeError(f"Released Shadow artwork is missing: {shadow_path}")

        shiny_shadow_url: str | None = None
        if pokemon.shiny_available:
            shiny_name = f"shiny_shadow_pokemon_{pokemon.pokemon_id}.png"
            shiny_shadow_path = ASSET_ROOT / "shiny_shadow" / shiny_name
            if not shiny_shadow_path.is_file():
                shiny_source = (
                    ASSET_ROOT / "shiny" / f"shiny_pokemon_{pokemon.pokemon_id}.png"
                )
                if not shiny_source.is_file():
                    raise RuntimeError(
                        f"Shiny source artwork is missing for {pokemon.name}: {shiny_source}"
                    )
                if write:
                    shiny_shadow_path.parent.mkdir(parents=True, exist_ok=True)
                    compose_shadow_image(
                        Image.open(shiny_source),
                        asset_root=ASSET_ROOT,
                        include_shiny_icon=True,
                    ).save(shiny_shadow_path, "PNG")
                    generated.append(str(shiny_shadow_path.relative_to(REPO_ROOT)))
            if shiny_shadow_path.is_file() or write:
                shiny_shadow_url = _asset_url("shiny_shadow", shiny_name)

        urls[pokemon.pokemon_id] = (
            _asset_url("shadow", shadow_name),
            shiny_shadow_url,
        )
    return urls, generated


def _prepare_costume_assets(
    connection: CatalogConnection,
    targets: list[ReleaseTarget],
    *,
    write: bool,
) -> tuple[dict[int, tuple[str, str]], list[str]]:
    urls: dict[int, tuple[str, str]] = {}
    generated: list[str] = []
    for target in targets:
        if target.kind != "costume":
            continue
        row = connection.execute(
            """
            SELECT pokemon.pokedex_number, costume_pokemon.costume_name,
                   costume_pokemon.shiny_available,
                   costume_pokemon.image_url_shiny_costume
            FROM costume_pokemon
            JOIN pokemon USING (pokemon_id)
            WHERE costume_pokemon.costume_id = ?
            """,
            (target.target_id,),
        ).fetchone()
        if row is None:
            raise RuntimeError(f"Missing Shadow costume target {target.target_id}.")
        dex_number, costume_name, shiny_available, shiny_source_url = row
        if not shiny_available or not shiny_source_url:
            raise RuntimeError(
                f"Shadow costume {target.target_id} has no released Shiny costume."
            )

        shadow_name = f"shadow_pokemon_{dex_number}_{costume_name}_default.png"
        shadow_path = ASSET_ROOT / "shadow_costumes" / shadow_name
        if not shadow_path.is_file():
            raise RuntimeError(f"Released Shadow costume artwork is missing: {shadow_path}")

        shiny_name = (
            f"shiny_shadow_pokemon_{dex_number}_{costume_name}_default.png"
        )
        shiny_path = ASSET_ROOT / "shadow_costumes" / shiny_name
        if not shiny_path.is_file():
            shiny_source_path = catalog_asset_path(REPO_ROOT, shiny_source_url)
            if not shiny_source_path.is_file():
                raise RuntimeError(
                    f"Shiny costume source artwork is missing: {shiny_source_path}"
                )
            if write:
                compose_shadow_image(
                    Image.open(shiny_source_path),
                    asset_root=ASSET_ROOT,
                    include_shiny_icon=True,
                ).save(shiny_path, "PNG")
                generated.append(str(shiny_path.relative_to(REPO_ROOT)))
        urls[target.target_id] = (
            _asset_url("shadow_costumes", shadow_name),
            _asset_url("shadow_costumes", shiny_name),
        )
    return urls, generated


def _upsert_shadow_target(
    connection: CatalogConnection,
    target: ReleaseTarget,
    pokemon: CatalogPokemon,
    image_urls: tuple[str, str | None],
) -> bool:
    row = connection.execute(
        """
        SELECT id, date_shiny_available
        FROM shadow_pokemon
        WHERE pokemon_id = ?
        """,
        (pokemon.pokemon_id,),
    ).fetchone()
    shiny_date: date | None = None
    if pokemon.shiny_available:
        shiny_date = shiny_shadow_release_date(
            shadow_released_on=target.source.released_on,
            shiny_released_on=pokemon.shiny_released_on,
            existing_shiny_shadow_date=parse_catalog_date(row[1]) if row else None,
        )

    apex = pokemon.form == "Apex"
    if row is None:
        shadow_id = int(
            connection.execute(
                "SELECT COALESCE(MAX(id), 0) + 1 FROM shadow_pokemon"
            ).fetchone()[0]
        )
        connection.execute(
            """
            INSERT INTO shadow_pokemon (
              id, pokemon_id, shiny_available, apex, date_available,
              date_shiny_available, image_url_shadow, image_url_shiny_shadow
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                shadow_id,
                pokemon.pokemon_id,
                "1" if shiny_date else "0",
                "1" if apex else None,
                target.source.released_on.isoformat(),
                shiny_date.isoformat() if shiny_date else None,
                image_urls[0],
                image_urls[1],
            ),
        )
    else:
        connection.execute(
            """
            UPDATE shadow_pokemon
            SET shiny_available = ?,
                apex = CASE WHEN ? THEN '1' ELSE apex END,
                date_available = ?,
                date_shiny_available = ?,
                image_url_shadow = ?,
                image_url_shiny_shadow = ?
            WHERE pokemon_id = ?
            """,
            (
                "1" if shiny_date else "0",
                apex,
                target.source.released_on.isoformat(),
                shiny_date.isoformat() if shiny_date else None,
                image_urls[0],
                image_urls[1],
                pokemon.pokemon_id,
            ),
        )
    return shiny_date is not None


def _update_costume_target(
    connection: CatalogConnection,
    target: ReleaseTarget,
    image_urls: tuple[str, str],
) -> bool:
    row = connection.execute(
        """
        SELECT shadow_costume_pokemon.id,
               shadow_costume_pokemon.date_shiny_available,
               costume_pokemon.date_shiny_available
        FROM shadow_costume_pokemon
        JOIN costume_pokemon USING (costume_id)
        WHERE shadow_costume_pokemon.costume_id = ?
        """,
        (target.target_id,),
    ).fetchone()
    if row is None:
        raise RuntimeError(
            f"Shadow costume link is missing for costume {target.target_id}."
        )

    shiny_date = shiny_shadow_release_date(
        shadow_released_on=target.source.released_on,
        shiny_released_on=parse_catalog_date(row[2]),
        existing_shiny_shadow_date=parse_catalog_date(row[1]),
    )
    connection.execute(
        """
        UPDATE shadow_costume_pokemon
        SET date_available = ?,
            date_shiny_available = ?,
            image_url_shadow_costume = ?,
            image_url_shiny_shadow_costume = ?
        WHERE costume_id = ?
        """,
        (
            target.source.released_on.isoformat(),
            shiny_date.isoformat(),
            image_urls[0],
            image_urls[1],
            target.target_id,
        ),
    )
    return True


def synchronize_catalog(
    connection: CatalogConnection,
    source_wikitext: str,
    *,
    write: bool,
) -> SyncSummary:
    entries, excluded = parse_shadow_source_wikitext(source_wikitext)
    if len(entries) != EXPECTED_SOURCE_RELEASES:
        raise RuntimeError(
            f"Expected {EXPECTED_SOURCE_RELEASES} dated source rows, found {len(entries)}."
        )
    if len(excluded) != EXPECTED_EXCLUDED_SOURCE_ROWS:
        raise RuntimeError(
            f"Expected {EXPECTED_EXCLUDED_SOURCE_ROWS} unavailable source rows, "
            f"found {len(excluded)}."
        )

    connection.execute("BEGIN")
    try:
        _ensure_required_shiny_metadata(connection)
        by_id, by_dex = load_catalog_pokemon(connection)
        targets = resolve_release_targets(entries, by_id, by_dex)
        pokemon_targets = [
            target for target in targets if target.kind == "pokemon"
        ]
        costume_targets = [
            target for target in targets if target.kind == "costume"
        ]
        if len(pokemon_targets) != EXPECTED_POKEMON_TARGETS:
            raise RuntimeError(
                f"Expected {EXPECTED_POKEMON_TARGETS} Pokemon targets, "
                f"found {len(pokemon_targets)}."
            )
        if len(costume_targets) != EXPECTED_COSTUME_TARGETS:
            raise RuntimeError(
                f"Expected {EXPECTED_COSTUME_TARGETS} costume targets, "
                f"found {len(costume_targets)}."
            )

        pokemon_urls, pokemon_assets = _prepare_pokemon_assets(
            targets, by_id, write=write
        )
        costume_urls, costume_assets = _prepare_costume_assets(
            connection, targets, write=write
        )

        shiny_shadow_count = sum(
            _upsert_shadow_target(
                connection,
                target,
                by_id[target.target_id],
                pokemon_urls[target.target_id],
            )
            for target in pokemon_targets
        )
        shiny_costume_count = sum(
            _update_costume_target(
                connection, target, costume_urls[target.target_id]
            )
            for target in costume_targets
        )

        target_ids = {target.target_id for target in pokemon_targets}
        released_ids = {
            int(row[0])
            for row in connection.execute(
                """
                SELECT pokemon_id
                FROM shadow_pokemon
                WHERE NULLIF(TRIM(date_available), '') IS NOT NULL
                """
            ).fetchall()
        }
        unexpected = sorted(released_ids - target_ids)
        if unexpected:
            raise RuntimeError(
                "Catalog contains released Shadow rows absent from the pinned "
                f"source roster: {unexpected}"
            )
        if shiny_shadow_count != EXPECTED_SHINY_SHADOW_TARGETS:
            raise RuntimeError(
                f"Expected {EXPECTED_SHINY_SHADOW_TARGETS} Shiny Shadow targets, "
                f"found {shiny_shadow_count}."
            )
        if shiny_costume_count != EXPECTED_SHINY_SHADOW_COSTUME_TARGETS:
            raise RuntimeError(
                "Expected "
                f"{EXPECTED_SHINY_SHADOW_COSTUME_TARGETS} Shiny Shadow costumes, "
                f"found {shiny_costume_count}."
            )

        if write:
            connection.commit()
        else:
            connection.rollback()
        return SyncSummary(
            pokemon_targets=len(pokemon_targets),
            costume_targets=len(costume_targets),
            shiny_shadow_targets=shiny_shadow_count,
            shiny_shadow_costume_targets=shiny_costume_count,
            generated_assets=tuple(pokemon_assets + costume_assets),
        )
    except Exception:
        connection.rollback()
        raise


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database-url", help="Explicit PostgreSQL catalog URL")
    parser.add_argument("--source-path", type=Path)
    parser.add_argument("--apply", action="store_true", help="Write catalog changes")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    if args.source_path:
        source_wikitext = args.source_path.read_text(encoding="utf-8")
        source_revision = SOURCE_REVISION
    else:
        source_wikitext, source_revision = fetch_source_wikitext()

    load_editor_environment()
    refresh = bool(args.apply)
    if args.database_url:
        with open_catalog_connection(args.database_url) as connection:
            summary = synchronize_catalog(
                connection, source_wikitext, write=args.apply
            )
    else:
        with ProductionCatalogSession(
            production_editor_settings(),
            refresh_on_success=refresh,
        ):
            database_url = configured_database_url(
                os.environ.get("POKEGO_EDITOR_DATABASE_URL")
            )
            with open_catalog_connection(database_url) as connection:
                summary = synchronize_catalog(
                    connection, source_wikitext, write=args.apply
                )

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(
        f"{mode}: {summary.pokemon_targets} released Shadow Pokemon/forms, "
        f"{summary.costume_targets} Shadow costumes, "
        f"{summary.shiny_shadow_targets} Shiny Shadow Pokemon/forms, and "
        f"{summary.shiny_shadow_costume_targets} Shiny Shadow costumes."
    )
    print(f"Pinned Shadow roster revision: {source_revision}")
    print(f"Source: {SOURCE_PAGE_URL}")
    if summary.generated_assets:
        print("Generated assets:")
        for asset in summary.generated_assets:
            print(f"  {asset}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
