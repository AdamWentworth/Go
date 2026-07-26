#!/usr/bin/env python3
"""Apply ordinary Shiny releases through 2026-07-26.

The release roster is deliberately explicit and pinned to a reviewed source
revision. It only changes ordinary Shiny availability; Shadow, costume, Mega,
Max, and base-species availability remain owned by their dedicated updaters.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = EDITOR_DIR.parent
ASSET_ROOT = REPO_ROOT / "assets" / "images" / "shiny"

if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from config import load_editor_environment, production_editor_settings
from production_session import ProductionCatalogSession
from scripts.postgres_catalog import (
    configured_database_url,
    open_catalog_authoring_connection,
)


SOURCE_REVISION = 4594301
SOURCE_URL = (
    "https://bulbapedia.bulbagarden.net/w/index.php"
    "?title=List_of_Shiny_Pok%C3%A9mon_in_Pok%C3%A9mon_GO"
    f"&oldid={SOURCE_REVISION}"
)
EXPECTED_TARGETS = 31
EXPECTED_RELEASED_SHINY_FORMS = 1055


@dataclass(frozen=True)
class ShinyTarget:
    pokemon_id: int
    name: str
    released_on: str

    @property
    def image_url(self) -> str:
        return f"/images/shiny/shiny_pokemon_{self.pokemon_id}.png"

    @property
    def image_path(self) -> Path:
        return ASSET_ROOT / f"shiny_pokemon_{self.pokemon_id}.png"


TARGETS = (
    ShinyTarget(781, "Dhelmise", "2026-01-06"),
    ShinyTarget(938, "Tadbulb", "2026-01-13"),
    ShinyTarget(939, "Bellibolt", "2026-01-13"),
    ShinyTarget(810, "Grookey", "2026-01-18"),
    ShinyTarget(811, "Thwackey", "2026-01-18"),
    ShinyTarget(812, "Rillaboom", "2026-01-18"),
    ShinyTarget(926, "Fidough", "2026-01-20"),
    ShinyTarget(927, "Dachsbun", "2026-01-20"),
    ShinyTarget(679, "Honedge", "2026-02-20"),
    ShinyTarget(680, "Doublade", "2026-02-20"),
    ShinyTarget(681, "Aegislash", "2026-02-20"),
    ShinyTarget(701, "Hawlucha", "2026-02-20"),
    ShinyTarget(707, "Klefki", "2026-02-20"),
    ShinyTarget(719, "Diancie", "2026-02-20"),
    ShinyTarget(813, "Scorbunny", "2026-03-14"),
    ShinyTarget(814, "Raboot", "2026-03-14"),
    ShinyTarget(815, "Cinderace", "2026-03-14"),
    ShinyTarget(850, "Sizzlipede", "2026-03-17"),
    ShinyTarget(851, "Centiskorch", "2026-03-17"),
    ShinyTarget(948, "Toedscool", "2026-04-14"),
    ShinyTarget(949, "Toedscruel", "2026-04-14"),
    ShinyTarget(968, "Orthworm", "2026-04-28"),
    ShinyTarget(965, "Varoom", "2026-04-30"),
    ShinyTarget(966, "Revavroom", "2026-04-30"),
    ShinyTarget(2344, "Tauros", "2026-05-24"),
    ShinyTarget(2343, "Tauros", "2026-06-04"),
    ShinyTarget(2342, "Tauros", "2026-06-11"),
    ShinyTarget(816, "Sobble", "2026-07-04"),
    ShinyTarget(817, "Drizzile", "2026-07-04"),
    ShinyTarget(818, "Inteleon", "2026-07-04"),
    ShinyTarget(791, "Solgaleo", "2026-07-22"),
)


def validate_roster() -> None:
    if len(TARGETS) != EXPECTED_TARGETS:
        raise RuntimeError(
            f"Expected {EXPECTED_TARGETS} Shiny targets, found {len(TARGETS)}."
        )
    ids = [target.pokemon_id for target in TARGETS]
    if len(ids) != len(set(ids)):
        raise RuntimeError("The Shiny release roster contains duplicate Pokemon IDs.")

    missing_assets = [
        str(target.image_path.relative_to(REPO_ROOT))
        for target in TARGETS
        if not target.image_path.is_file()
    ]
    if missing_assets:
        raise RuntimeError(
            "Released Shiny artwork is missing:\n- " + "\n- ".join(missing_assets)
        )


def apply_roster(database_url: str | None, write: bool) -> tuple[int, int]:
    with open_catalog_authoring_connection(database_url) as connection:
        try:
            connection.execute("BEGIN")
            changed = 0
            for target in TARGETS:
                row = connection.execute(
                    """
                    SELECT name, shiny_available, date_shiny_available,
                           image_url_shiny
                    FROM pokemon
                    WHERE pokemon_id = ?
                    """,
                    (target.pokemon_id,),
                ).fetchone()
                if row is None:
                    raise RuntimeError(
                        f"Missing Shiny target {target.pokemon_id} {target.name}."
                    )
                if str(row[0]).lower() != target.name.lower():
                    raise RuntimeError(
                        f"Pokemon {target.pokemon_id} is {row[0]}, expected {target.name}."
                    )

                desired = (True, target.released_on, target.image_url)
                current = (
                    bool(row[1]),
                    str(row[2])[:10] if row[2] else None,
                    row[3],
                )
                if current == desired:
                    continue
                changed += 1
                if write:
                    connection.execute(
                        """
                        UPDATE pokemon
                        SET shiny_available = TRUE,
                            date_shiny_available = ?,
                            image_url_shiny = ?
                        WHERE pokemon_id = ?
                        """,
                        (
                            target.released_on,
                            target.image_url,
                            target.pokemon_id,
                        ),
                    )

            released_count = int(
                connection.execute(
                    "SELECT COUNT(*) FROM pokemon WHERE shiny_available IS TRUE"
                ).fetchone()[0]
            )
            expected_count = (
                EXPECTED_RELEASED_SHINY_FORMS
                if write
                else released_count + changed
            )
            if expected_count != EXPECTED_RELEASED_SHINY_FORMS:
                raise RuntimeError(
                    "Expected "
                    f"{EXPECTED_RELEASED_SHINY_FORMS} released Shiny forms after "
                    f"the update, found {expected_count}."
                )

            if write:
                connection.commit()
            else:
                connection.rollback()
            return changed, EXPECTED_RELEASED_SHINY_FORMS
        except Exception:
            connection.rollback()
            raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write the roster")
    parser.add_argument(
        "--database-url",
        help="Catalog URL. Defaults to the guarded production editor session.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    validate_roster()
    load_editor_environment()

    if args.database_url:
        changed, total = apply_roster(args.database_url, args.apply)
    else:
        with ProductionCatalogSession(production_editor_settings()):
            database_url = configured_database_url(
                os.environ.get("POKEGO_EDITOR_DATABASE_URL")
            )
            changed, total = apply_roster(database_url, args.apply)

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(f"{mode}: ordinary Shiny release roster")
    print(f"Pinned source revision: {SOURCE_REVISION}")
    print(f"Source: {SOURCE_URL}")
    print(f"Rows changed: {changed}")
    print(f"Released Shiny Pokemon/forms after update: {total}")


if __name__ == "__main__":
    main()
