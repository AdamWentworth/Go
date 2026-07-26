#!/usr/bin/env python3
"""Stage or publish confirmed Pokemon GO base-species releases through 2026-07-22.

The roster is deliberately separate from shiny, shadow, and costume availability.
It imports battle data from a pinned Game Master revision, preserves editor-managed
shiny metadata, and refuses to publish rows whose normal artwork is missing.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


EDITOR_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = EDITOR_DIR.parent
ASSET_ROOT = REPO_ROOT / "assets" / "images"
POKEMON_SCRIPTS_DIR = REPO_ROOT / "pokemon" / "scripts"

if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))
if str(POKEMON_SCRIPTS_DIR) not in sys.path:
    # Keep unittest discovery's test directory ahead of the Pokemon scripts.
    # Both trees intentionally contain similarly named test modules.
    sys.path.append(str(POKEMON_SCRIPTS_DIR))

from config import load_editor_environment, production_editor_settings  # noqa: E402
from production_session import ProductionCatalogSession  # noqa: E402
from refresh_game_master_moves import (  # noqa: E402
    build_game_master_moves,
    build_game_master_pools,
    duplicate_move_ids_by_base_key,
    ensure_moves,
    refresh_move_maps,
    sync_assignment_table,
)
from scripts.postgres_catalog import (  # noqa: E402
    CatalogConnection,
    configured_database_url,
    open_catalog_connection,
)


GAME_MASTER_REVISION = "5ac6c0edd9315644d5ead8f45847157126ba73cd"
DEFAULT_GAME_MASTER_URL = (
    "https://raw.githubusercontent.com/PokeMiners/game_masters/"
    f"{GAME_MASTER_REVISION}/latest/latest.json"
)


@dataclass(frozen=True)
class CatalogForm:
    pokemon_id: int
    pokedex_number: int
    name: str
    released_on: str
    form: str | None = None
    game_master_form: str = ""
    rarity: str = "Standard"

    @property
    def image_path(self) -> str:
        return f"/images/default/pokemon_{self.pokemon_id}.png"

    @property
    def shiny_image_path(self) -> str:
        return f"/images/shiny/shiny_pokemon_{self.pokemon_id}.png"

    @property
    def pool_key(self) -> str:
        return f"{self.pokedex_number}:{self.game_master_form}"


def form(
    pokemon_id: int,
    pokedex_number: int,
    name: str,
    released_on: str,
    display_form: str | None = None,
    game_master_form: str = "",
    rarity: str = "Standard",
) -> CatalogForm:
    return CatalogForm(
        pokemon_id,
        pokedex_number,
        name,
        released_on,
        display_form,
        game_master_form,
        rarity,
    )


# Alternate-form IDs continue the catalog's established authored-ID range.
# National Dex IDs remain the primary row for each species.
BASE_RELEASE_FORMS = (
    form(679, 679, "Honedge", "2025-07-22"),
    form(680, 680, "Doublade", "2025-07-22"),
    form(681, 681, "Aegislash", "2025-07-22", "Shield", "shield"),
    form(2345, 681, "Aegislash", "2025-07-22", "Blade", "blade"),
    form(778, 778, "Mimikyu", "2026-04-01", "Busted", "busted"),
    form(2269, 778, "Mimikyu", "2026-04-01", "Disguised", "disguised"),
    form(807, 807, "Zeraora", "2026-05-29", rarity="Mythical"),
    form(824, 824, "Blipbug", "2026-03-17"),
    form(825, 825, "Dottler", "2026-03-17"),
    form(826, 826, "Orbeetle", "2026-03-17"),
    form(837, 837, "Rolycoly", "2025-12-24"),
    form(838, 838, "Carkol", "2025-12-24"),
    form(839, 839, "Coalossal", "2025-12-24"),
    form(843, 843, "Silicobra", "2026-04-14"),
    form(844, 844, "Sandaconda", "2026-04-14"),
    form(852, 852, "Clobbopus", "2025-12-13"),
    form(853, 853, "Grapploct", "2025-12-13"),
    form(859, 859, "Impidimp", "2025-11-07"),
    form(860, 860, "Morgrem", "2025-11-07"),
    form(872, 872, "Snom", "2025-08-06"),
    form(873, 873, "Frosmoth", "2025-08-06"),
    form(876, 876, "Indeedee", "2025-09-16", "Female", "female"),
    form(2286, 876, "Indeedee", "2025-09-16", "Male", "male"),
    form(917, 917, "Tarountula", "2025-11-04"),
    form(918, 918, "Spidops", "2025-11-04"),
    form(931, 931, "Squawkabilly", "2026-06-23", "Green", "green"),
    form(2346, 931, "Squawkabilly", "2026-06-23", "Blue", "blue"),
    form(2347, 931, "Squawkabilly", "2026-06-23", "Yellow", "yellow"),
    form(2348, 931, "Squawkabilly", "2026-06-23", "White", "white"),
    form(932, 932, "Nacli", "2025-12-02"),
    form(933, 933, "Naclstack", "2025-12-02"),
    form(934, 934, "Garganacl", "2025-12-02"),
    form(940, 940, "Wattrel", "2026-01-14"),
    form(941, 941, "Kilowattrel", "2026-01-14"),
    form(948, 948, "Toedscool", "2025-07-29"),
    form(949, 949, "Toedscruel", "2025-07-29"),
    form(950, 950, "Klawf", "2026-01-06"),
    form(955, 955, "Flittle", "2026-05-12"),
    form(956, 956, "Espathra", "2026-05-12"),
    form(968, 968, "Orthworm", "2026-04-28"),
    form(969, 969, "Glimmet", "2026-01-27"),
    form(970, 970, "Glimmora", "2026-01-27"),
    form(973, 973, "Flamigo", "2026-02-03"),
    form(977, 977, "Dondozo", "2025-08-25"),
    form(978, 978, "Tatsugiri", "2025-07-15", "Curly", "curly"),
    form(2349, 978, "Tatsugiri", "2025-07-15", "Droopy", "droopy"),
    form(2350, 978, "Tatsugiri", "2025-07-15", "Stretchy", "stretchy"),
    form(982, 982, "Dudunsparce", "2025-09-23", "Two-segment", "two"),
    form(2351, 982, "Dudunsparce", "2025-09-23", "Three-segment", "three"),
    form(1011, 1011, "Dipplin", "2025-10-10"),
    form(1012, 1012, "Poltchageist", "2025-10-21", "Counterfeit", "counterfeit"),
    form(2352, 1012, "Poltchageist", "2025-10-21", "Artisan", "artisan"),
    form(1013, 1013, "Sinistcha", "2025-10-21", "Unremarkable", "unremarkable"),
    form(2353, 1013, "Sinistcha", "2025-10-21", "Masterpiece", "masterpiece"),
    form(1019, 1019, "Hydrapple", "2025-10-10"),
)


@dataclass(frozen=True)
class Evolution:
    source_id: int
    target_id: int
    candy: int
    other: str = ""


EVOLUTIONS = (
    Evolution(206, 982, 50, "Two-segment Forme (99%)"),
    Evolution(206, 2351, 50, "Three-segment Forme (1%)"),
    Evolution(679, 680, 25),
    Evolution(680, 681, 100),
    Evolution(824, 825, 25),
    Evolution(825, 826, 100),
    Evolution(837, 838, 25),
    Evolution(838, 839, 100),
    Evolution(840, 1011, 200, "20 Syrupy Apples"),
    Evolution(843, 844, 50),
    Evolution(852, 853, 50),
    Evolution(859, 860, 25),
    Evolution(860, 861, 100),
    Evolution(872, 873, 400, "Adventure together; evolve at night"),
    Evolution(917, 918, 50),
    Evolution(932, 933, 25),
    Evolution(933, 934, 100),
    Evolution(940, 941, 50),
    Evolution(948, 949, 50),
    Evolution(955, 956, 50),
    Evolution(969, 970, 50),
    Evolution(1011, 1019, 400, "Adventure together"),
    Evolution(1012, 1013, 50, "Counterfeit to Unremarkable"),
    Evolution(2352, 2353, 400, "Artisan to Masterpiece"),
)


def generation_for_dex(dex_number: int) -> int:
    if dex_number <= 151:
        return 1
    if dex_number <= 251:
        return 2
    if dex_number <= 386:
        return 3
    if dex_number <= 493:
        return 4
    if dex_number <= 649:
        return 5
    if dex_number <= 721:
        return 6
    if dex_number <= 809:
        return 7
    if dex_number <= 898:
        return 8
    if dex_number <= 905:
        return 9
    return 10


def _normalize_form(value: Any, species: Any) -> str:
    species_token = str(species or "").lower()
    value_token = str(value or "").lower()
    prefix = f"{species_token}_"
    if value_token.startswith(prefix):
        value_token = value_token[len(prefix) :]
    if value_token in {"", "normal", species_token}:
        return ""
    return value_token


def load_game_master(path: Path | None, url: str) -> list[dict[str, Any]]:
    if path:
        return json.loads(path.read_text(encoding="utf-8"))
    with urllib.request.urlopen(url, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def pokemon_settings_by_key(game_master: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    settings_by_key: dict[str, dict[str, Any]] = {}
    for item in game_master:
        template_id = str(item.get("templateId") or "")
        if not template_id.startswith("V") or "_POKEMON_" not in template_id:
            continue
        settings = item.get("data", {}).get("pokemonSettings")
        if not settings:
            continue
        try:
            dex_number = int(template_id[1:5])
        except ValueError:
            continue
        pokemon_id = settings.get("pokemonId")
        key = f"{dex_number}:{_normalize_form(settings.get('form'), pokemon_id)}"
        # Prefer the explicit no-form template over its duplicate *_NORMAL row.
        if key not in settings_by_key or settings.get("form") is None:
            settings_by_key[key] = settings
    return settings_by_key


def gender_rates_by_key(game_master: list[dict[str, Any]]) -> dict[str, str]:
    rates: dict[str, str] = {}
    for item in game_master:
        template_id = str(item.get("templateId") or "")
        settings = item.get("data", {}).get("genderSettings")
        if not settings or not template_id.startswith("SPAWN_V"):
            continue
        try:
            dex_number = int(template_id[7:11])
        except ValueError:
            continue
        pokemon_id = settings.get("pokemon")
        template_form = template_id.split("_POKEMON_", 1)[-1]
        normalized_form = _normalize_form(template_form, pokemon_id)
        gender = settings.get("gender", {})
        male = int(float(gender.get("malePercent") or 0) * 100)
        female = int(float(gender.get("femalePercent") or 0) * 100)
        genderless = int(float(gender.get("genderlessPercent") or 0) * 100)
        rates[f"{dex_number}:{normalized_form}"] = f"{male}M_{female}F_{genderless}GL"
    return rates


def missing_normal_assets(
    asset_root: Path = ASSET_ROOT,
    entries: tuple[CatalogForm, ...] = BASE_RELEASE_FORMS,
) -> list[CatalogForm]:
    return [
        entry
        for entry in entries
        if not (asset_root / "default" / f"pokemon_{entry.pokemon_id}.png").is_file()
    ]


def print_asset_report(asset_root: Path = ASSET_ROOT) -> None:
    print("Base-release normal image review:")
    for entry in BASE_RELEASE_FORMS:
        path = asset_root / "default" / f"pokemon_{entry.pokemon_id}.png"
        status = "READY" if path.is_file() else "MISSING"
        label = f"{entry.name} ({entry.form})" if entry.form else entry.name
        print(f"  {status:7} #{entry.pokedex_number:04d} {label}: {entry.image_path}")


def _type_ids(connection: CatalogConnection) -> dict[str, int]:
    return {
        str(row["name"]).lower(): int(row["type_id"])
        for row in connection.execute("SELECT type_id, name FROM types")
    }


def upsert_forms(
    connection: CatalogConnection,
    settings_by_key: dict[str, dict[str, Any]],
    genders_by_key: dict[str, str],
    publish: bool,
) -> None:
    type_ids = _type_ids(connection)
    for entry in BASE_RELEASE_FORMS:
        settings = settings_by_key.get(entry.pool_key)
        if settings is None:
            raise RuntimeError(f"Game Master is missing {entry.pool_key} ({entry.name} {entry.form or ''}).")
        stats = settings.get("stats") or {}
        attack = int(stats.get("baseAttack") or 0)
        defense = int(stats.get("baseDefense") or 0)
        stamina = int(stats.get("baseStamina") or 0)
        if min(attack, defense, stamina) <= 0:
            raise RuntimeError(f"Game Master has incomplete combat stats for {entry.name}.")
        type_1 = str(settings.get("type") or "").removeprefix("POKEMON_TYPE_").lower()
        type_2 = str(settings.get("type2") or "").removeprefix("POKEMON_TYPE_").lower()
        if type_1 not in type_ids or (type_2 and type_2 not in type_ids):
            raise RuntimeError(f"Unknown type metadata for {entry.name}: {type_1}/{type_2}")

        connection.execute(
            """
            INSERT INTO pokemon (
              pokemon_id, name, pokedex_number, image_url, image_url_shiny, sprite_url,
              attack, defense, stamina, type_1_id, type_2_id, gender_rate, rarity,
              form, generation, available, shiny_available, shiny_rarity,
              date_available, date_shiny_available, female_unique
            ) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, NULL, ?, NULL, FALSE)
            ON CONFLICT (pokemon_id) DO UPDATE SET
              name = EXCLUDED.name,
              pokedex_number = EXCLUDED.pokedex_number,
              image_url = COALESCE(pokemon.image_url, EXCLUDED.image_url),
              image_url_shiny = COALESCE(pokemon.image_url_shiny, EXCLUDED.image_url_shiny),
              attack = EXCLUDED.attack,
              defense = EXCLUDED.defense,
              stamina = EXCLUDED.stamina,
              type_1_id = EXCLUDED.type_1_id,
              type_2_id = EXCLUDED.type_2_id,
              gender_rate = EXCLUDED.gender_rate,
              rarity = EXCLUDED.rarity,
              form = EXCLUDED.form,
              generation = EXCLUDED.generation,
              available = CASE WHEN EXCLUDED.available THEN TRUE ELSE pokemon.available END,
              date_available = EXCLUDED.date_available
            """,
            (
                entry.pokemon_id,
                entry.name,
                entry.pokedex_number,
                entry.image_path,
                entry.shiny_image_path,
                attack,
                defense,
                stamina,
                type_ids[type_1],
                type_ids.get(type_2) if type_2 else None,
                genders_by_key.get(entry.pool_key, "0M_0F_100GL"),
                entry.rarity,
                entry.form,
                generation_for_dex(entry.pokedex_number),
                publish,
                f"{entry.released_on}T00:00:00Z",
            ),
        )

        height = float(settings.get("pokedexHeightM") or 0)
        weight = float(settings.get("pokedexWeightKg") or 0)
        if height <= 0 or weight <= 0:
            raise RuntimeError(f"Game Master has incomplete size data for {entry.name}.")
        connection.execute(
            """
            INSERT INTO pokemon_sizes (
              pokemon_id, pokedex_height, pokedex_weight,
              height_standard_deviation, weight_standard_deviation,
              height_xxs_threshold, height_xs_threshold, height_xl_threshold,
              height_xxl_threshold, weight_xxs_threshold, weight_xs_threshold,
              weight_xl_threshold, weight_xxl_threshold
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (pokemon_id) DO UPDATE SET
              pokedex_height = EXCLUDED.pokedex_height,
              pokedex_weight = EXCLUDED.pokedex_weight,
              height_standard_deviation = EXCLUDED.height_standard_deviation,
              weight_standard_deviation = EXCLUDED.weight_standard_deviation,
              height_xxs_threshold = EXCLUDED.height_xxs_threshold,
              height_xs_threshold = EXCLUDED.height_xs_threshold,
              height_xl_threshold = EXCLUDED.height_xl_threshold,
              height_xxl_threshold = EXCLUDED.height_xxl_threshold,
              weight_xxs_threshold = EXCLUDED.weight_xxs_threshold,
              weight_xs_threshold = EXCLUDED.weight_xs_threshold,
              weight_xl_threshold = EXCLUDED.weight_xl_threshold,
              weight_xxl_threshold = EXCLUDED.weight_xxl_threshold
            """,
            (
                entry.pokemon_id,
                height,
                weight,
                float(settings.get("heightStdDev") or height * 0.25),
                float(settings.get("weightStdDev") or weight * 0.25),
                height * 0.5,
                height * 0.75,
                height * 1.25,
                height * 1.5,
                weight * 0.5,
                weight * 0.75,
                weight * 1.25,
                weight * 1.5,
            ),
        )

        connection.execute(
            """
            INSERT INTO pokemon_cp_stats (pokemon_id, level_id, cp, hp)
            SELECT
              ?, cp_multipliers.level_id,
              GREATEST(10, FLOOR(? * SQRT(?) * SQRT(?) * POWER(cp_multipliers.multiplier, 2) / 10)::INTEGER),
              GREATEST(10, FLOOR(? * cp_multipliers.multiplier)::INTEGER)
            FROM cp_multipliers
            ON CONFLICT (pokemon_id, level_id) DO UPDATE SET
              cp = EXCLUDED.cp,
              hp = EXCLUDED.hp
            """,
            (entry.pokemon_id, attack, defense, stamina, stamina),
        )


def sync_roster_moves(
    connection: CatalogConnection,
    game_master: list[dict[str, Any]],
) -> None:
    gm_moves = build_game_master_moves(game_master)
    gm_pools = build_game_master_pools(game_master, gm_moves)
    move_updates, move_inserts = ensure_moves(connection, gm_moves, False)
    if move_updates or move_inserts:
        raise RuntimeError(
            "The catalog move table is not current with the pinned Game Master "
            f"({move_updates} updates, {move_inserts} inserts). Run the dedicated "
            "refresh_game_master_moves.py workflow first."
        )
    move_ids = refresh_move_maps(connection)
    duplicate_ids = duplicate_move_ids_by_base_key(gm_moves, move_ids)
    for entry in BASE_RELEASE_FORMS:
        pool = gm_pools.get(entry.pool_key)
        if pool is None:
            raise RuntimeError(f"Game Master move pool is missing {entry.pool_key}.")
        missing_keys = (pool.current_move_keys | pool.elite_move_keys) - move_ids.keys()
        if missing_keys:
            raise RuntimeError(f"Moves are unresolved for {entry.name}: {sorted(missing_keys)}")
        current_ids = {move_ids[key] for key in pool.current_move_keys}
        elite_ids = {move_ids[key] for key in pool.elite_move_keys}
        base_keys = {key.split(":", 1)[0] for key in pool.current_move_keys | pool.elite_move_keys}
        replaceable = set().union(*(duplicate_ids.get(key, set()) for key in base_keys)) if base_keys else set()
        sync_assignment_table(
            connection,
            "pokemon_moves",
            "pokemon_id",
            entry.pokemon_id,
            current_ids,
            elite_ids,
            replaceable,
            True,
        )


def upsert_evolutions(connection: CatalogConnection) -> None:
    for evolution in EVOLUTIONS:
        existing = connection.execute(
            "SELECT evolution_id FROM pokemon_evolutions WHERE pokemon_id = ? AND evolves_to = ? LIMIT 1",
            (evolution.source_id, evolution.target_id),
        ).fetchone()
        if existing:
            connection.execute(
                """
                UPDATE pokemon_evolutions
                SET candies_needed = ?, other = ?
                WHERE evolution_id = ?
                """,
                (evolution.candy, evolution.other, existing[0]),
            )
            continue
        evolution_id = int(
            connection.execute(
                "SELECT COALESCE(MAX(evolution_id), 0) + 1 FROM pokemon_evolutions"
            ).fetchone()[0]
        )
        connection.execute(
            """
            INSERT INTO pokemon_evolutions (
              evolution_id, pokemon_id, evolves_to, candies_needed,
              trade_discount, item_id, other
            ) VALUES (?, ?, ?, ?, NULL, NULL, ?)
            """,
            (
                evolution_id,
                evolution.source_id,
                evolution.target_id,
                evolution.candy,
                evolution.other,
            ),
        )


def validate_staged_catalog(connection: CatalogConnection, publish: bool) -> None:
    ids = [entry.pokemon_id for entry in BASE_RELEASE_FORMS]
    rows = connection.execute(
        """
        SELECT pokemon_id, available, attack, defense, stamina, date_available
        FROM pokemon
        WHERE pokemon_id = ANY(?)
        """,
        (ids,),
    ).fetchall()
    if len(rows) != len(ids):
        raise RuntimeError(f"Expected {len(ids)} staged forms, found {len(rows)}.")
    for row in rows:
        if min(int(row["attack"] or 0), int(row["defense"] or 0), int(row["stamina"] or 0)) <= 0:
            raise RuntimeError(f"Pokemon {row['pokemon_id']} still has incomplete combat stats.")
        if not row["date_available"]:
            raise RuntimeError(f"Pokemon {row['pokemon_id']} has no release date.")
        if publish and not row["available"]:
            raise RuntimeError(f"Pokemon {row['pokemon_id']} was not published.")
        if connection.execute(
            "SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = ?",
            (row["pokemon_id"],),
        ).fetchone()[0] == 0:
            raise RuntimeError(f"Pokemon {row['pokemon_id']} has no move pool.")


def apply_roster(
    connection: CatalogConnection,
    game_master: list[dict[str, Any]],
    publish: bool,
    write: bool,
) -> None:
    settings = pokemon_settings_by_key(game_master)
    genders = gender_rates_by_key(game_master)
    connection.execute("BEGIN")
    try:
        upsert_forms(connection, settings, genders, publish)
        sync_roster_moves(connection, game_master)
        upsert_evolutions(connection)
        validate_staged_catalog(connection, publish)
        if write:
            connection.commit()
        else:
            connection.rollback()
    except Exception:
        connection.rollback()
        raise


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database-url", help="Explicit PostgreSQL catalog URL")
    parser.add_argument("--game-master-path", type=Path)
    parser.add_argument("--game-master-url", default=DEFAULT_GAME_MASTER_URL)
    parser.add_argument("--asset-root", type=Path, default=ASSET_ROOT)
    parser.add_argument("--apply", action="store_true", help="Write staged catalog data")
    parser.add_argument(
        "--publish",
        action="store_true",
        help="Mark all staged rows available; requires every normal image",
    )
    parser.add_argument("--report-images", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    if args.report_images:
        print_asset_report(args.asset_root)
        if not args.apply and not args.publish:
            return 0
    missing = missing_normal_assets(args.asset_root)
    if args.publish and missing:
        names = ", ".join(f"{entry.name} ({entry.form or 'default'})" for entry in missing)
        raise RuntimeError(f"Cannot publish with missing normal artwork: {names}")

    game_master = load_game_master(args.game_master_path, args.game_master_url)
    load_editor_environment()
    if args.database_url:
        with open_catalog_connection(args.database_url) as connection:
            apply_roster(connection, game_master, args.publish, args.apply or args.publish)
    else:
        with ProductionCatalogSession(
            production_editor_settings(),
            refresh_on_success=args.apply or args.publish,
        ):
            with open_catalog_connection(configured_database_url(os.environ.get("POKEGO_EDITOR_DATABASE_URL"))) as connection:
                apply_roster(connection, game_master, args.publish, args.apply or args.publish)

    mode = "PUBLISHED" if args.publish else "STAGED" if args.apply else "DRY RUN"
    print(
        f"{mode}: {len({entry.pokedex_number for entry in BASE_RELEASE_FORMS})} "
        f"released species across {len(BASE_RELEASE_FORMS)} catalog forms."
    )
    print(f"Pinned Game Master: {GAME_MASTER_REVISION}")
    print(f"Normal images still missing locally: {len(missing)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
