#!/usr/bin/env python3
"""Publish reviewed costume releases and their known background links.

Artwork may be added after these records are published. The image URLs are
stable catalog targets so the media server starts serving each costume as soon
as the corresponding files are deployed.
"""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from config import load_editor_environment, production_editor_settings
from production_session import ProductionCatalogSession
from scripts.postgres_catalog import (
    CatalogConnection,
    configured_database_url,
    open_catalog_connection,
)


SOURCE_REVISION = 4595680
SOURCE_URL = (
    "https://bulbapedia.bulbagarden.net/w/index.php"
    "?title=Event_Pok%C3%A9mon_(GO)"
    f"&oldid={SOURCE_REVISION}"
)


@dataclass(frozen=True)
class CostumeRelease:
    pokemon_id: int
    pokemon_name: str
    costume_name: str
    released_on: str

    @property
    def normal_image_url(self) -> str:
        return (
            f"/images/costumes/pokemon_{self.pokemon_id}_"
            f"{self.costume_name}_default.png"
        )

    @property
    def shiny_image_url(self) -> str:
        return (
            f"/images/costumes_shiny/pokemon_{self.pokemon_id}_"
            f"{self.costume_name}_shiny.png"
        )

    @property
    def female_image_url(self) -> str:
        return (
            f"/images/female/costumes/female_pokemon_{self.pokemon_id}_"
            f"{self.costume_name}_default.png"
        )

    @property
    def shiny_female_image_url(self) -> str:
        return (
            f"/images/female/costumes_shiny/female_pokemon_{self.pokemon_id}_"
            f"{self.costume_name}_shiny.png"
        )


@dataclass(frozen=True)
class EventBackground:
    name: str
    location: str
    image_url: str
    date: str


@dataclass
class ApplyStats:
    costumes_inserted: int = 0
    costumes_updated: int = 0
    backgrounds_inserted: int = 0
    backgrounds_updated: int = 0
    links_inserted: int = 0
    links_updated: int = 0
    links_deleted: int = 0

    @property
    def changed(self) -> int:
        return sum(
            (
                self.costumes_inserted,
                self.costumes_updated,
                self.backgrounds_inserted,
                self.backgrounds_updated,
                self.links_inserted,
                self.links_updated,
                self.links_deleted,
            )
        )


COSTUME_RELEASES = (
    CostumeRelease(132, "Ditto", "pokopia_hat", "2026-03-10"),
    CostumeRelease(132, "Ditto", "pokopia_cap", "2026-03-10"),
    CostumeRelease(25, "Pikachu", "baseball_shirt", "2026-04-03"),
    CostumeRelease(2041, "Corsola", "pink_sunglasses", "2026-04-14"),
    CostumeRelease(25, "Pikachu", "marathon_visor", "2026-05-12"),
    CostumeRelease(25, "Pikachu", "excavator", "2026-05-22"),
    CostumeRelease(10, "Caterpie", "poke_ball_hat", "2026-05-24"),
    CostumeRelease(25, "Pikachu", "team_mystic_hat", "2026-05-24"),
    CostumeRelease(25, "Pikachu", "team_instinct_hat", "2026-06-04"),
    CostumeRelease(25, "Pikachu", "team_valor_hat", "2026-06-11"),
    CostumeRelease(999, "Gimmighoul", "10th_anniversary_coin", "2026-07-04"),
    CostumeRelease(
        25,
        "Pikachu",
        "professor_willows_assistant",
        "2026-07-21",
    ),
)

COSTUME_LEGACY_POKEMON_IDS = {
    (2041, "pink_sunglasses"): (222,),
}

BASEBALL_BACKGROUND_IDS = tuple(range(202, 211))
PROFESSOR_BACKGROUNDS = (
    EventBackground(
        "Professor Willow's Assistant - Valor",
        "Global",
        "/images/backgrounds/Special_Background_Valor.png",
        "2026-07-21",
    ),
    EventBackground(
        "Professor Willow's Assistant - Instinct",
        "Global",
        "/images/backgrounds/Special_Background_Instinct.png",
        "2026-07-21",
    ),
    EventBackground(
        "Professor Willow's Assistant - Mystic",
        "Global",
        "/images/backgrounds/Special_Background_Mystic.png",
        "2026-07-21",
    ),
)


def validate_roster() -> None:
    keys = [
        (release.pokemon_id, release.costume_name)
        for release in COSTUME_RELEASES
    ]
    if len(keys) != 12 or len(keys) != len(set(keys)):
        raise RuntimeError("The costume release roster must contain 12 unique rows.")

    for release in COSTUME_RELEASES:
        if not release.costume_name or release.costume_name != release.costume_name.lower():
            raise RuntimeError(
                f"Costume names must be normalized: {release.costume_name!r}"
            )
        if " " in release.costume_name:
            raise RuntimeError(
                f"Costume names must use underscores: {release.costume_name!r}"
            )
        if not release.normal_image_url.startswith("/images/costumes/"):
            raise RuntimeError(f"Invalid normal image target for {release.costume_name}.")
        if not release.shiny_image_url.startswith("/images/costumes_shiny/"):
            raise RuntimeError(f"Invalid Shiny image target for {release.costume_name}.")
        if not release.female_image_url.startswith("/images/female/costumes/"):
            raise RuntimeError(f"Invalid female image target for {release.costume_name}.")
        if not release.shiny_female_image_url.startswith(
            "/images/female/costumes_shiny/"
        ):
            raise RuntimeError(
                f"Invalid Shiny female image target for {release.costume_name}."
            )

    if BASEBALL_BACKGROUND_IDS != tuple(range(202, 211)):
        raise RuntimeError("The reviewed NPB background range has changed.")
    if len(PROFESSOR_BACKGROUNDS) != 3:
        raise RuntimeError("Professor Willow's Assistant requires three team backgrounds.")


def _normalized_date(value) -> str | None:
    return str(value)[:10] if value else None


def ensure_costume(
    connection: CatalogConnection,
    release: CostumeRelease,
    *,
    write: bool,
    stats: ApplyStats,
) -> int | None:
    pokemon = connection.execute(
        "SELECT name, female_unique FROM pokemon WHERE pokemon_id = ?",
        (release.pokemon_id,),
    ).fetchone()
    if pokemon is None:
        raise RuntimeError(
            f"Missing Pokemon {release.pokemon_id} {release.pokemon_name}."
        )
    if str(pokemon[0]).lower() != release.pokemon_name.lower():
        raise RuntimeError(
            f"Pokemon {release.pokemon_id} is {pokemon[0]}, "
            f"expected {release.pokemon_name}."
        )

    female_unique = bool(pokemon[1])
    def find_existing_costume(pokemon_id: int):
        return connection.execute(
            """
            SELECT costume_id, shiny_available, date_available,
                   date_shiny_available, image_url_costume,
                   image_url_shiny_costume, image_url_costume_female,
                   image_url_shiny_costume_female
            FROM costume_pokemon
            WHERE pokemon_id = ? AND lower(costume_name) = ?
            ORDER BY costume_id
            """,
            (pokemon_id, release.costume_name.lower()),
        ).fetchone()

    row = find_existing_costume(release.pokemon_id)
    needs_rehome = False
    if row is None:
        for legacy_pokemon_id in COSTUME_LEGACY_POKEMON_IDS.get(
            (release.pokemon_id, release.costume_name),
            (),
        ):
            row = find_existing_costume(legacy_pokemon_id)
            if row is not None:
                needs_rehome = True
                break
    desired = (
        True,
        release.released_on,
        release.released_on,
        release.normal_image_url,
        release.shiny_image_url,
        release.female_image_url if female_unique else None,
        release.shiny_female_image_url if female_unique else None,
    )

    if row is None:
        stats.costumes_inserted += 1
        if not write:
            return None
        inserted = connection.execute(
            """
            INSERT INTO costume_pokemon (
                pokemon_id, costume_name, shiny_available, date_available,
                date_shiny_available, image_url_costume,
                image_url_shiny_costume, image_url_costume_female,
                image_url_shiny_costume_female
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING costume_id
            """,
            (
                release.pokemon_id,
                release.costume_name,
                *desired,
            ),
        ).fetchone()
        return int(inserted[0])

    costume_id = int(row[0])
    current = (
        bool(row[1]),
        _normalized_date(row[2]),
        _normalized_date(row[3]),
        row[4],
        row[5],
        row[6],
        row[7],
    )
    if current != desired or needs_rehome:
        stats.costumes_updated += 1
        if write:
            connection.execute(
                """
                UPDATE costume_pokemon
                SET pokemon_id = ?,
                    shiny_available = ?,
                    date_available = ?,
                    date_shiny_available = ?,
                    image_url_costume = ?,
                    image_url_shiny_costume = ?,
                    image_url_costume_female = ?,
                    image_url_shiny_costume_female = ?
                WHERE costume_id = ?
                """,
                (release.pokemon_id, *desired, costume_id),
            )
    return costume_id


def find_costume_id(
    connection: CatalogConnection,
    pokemon_id: int,
    costume_name: str,
) -> int:
    rows = connection.execute(
        """
        SELECT costume_id
        FROM costume_pokemon
        WHERE pokemon_id = ? AND lower(costume_name) = ?
        ORDER BY costume_id
        """,
        (pokemon_id, costume_name.lower()),
    ).fetchall()
    if len(rows) != 1:
        raise RuntimeError(
            f"Expected one {costume_name} costume for Pokemon {pokemon_id}, "
            f"found {len(rows)}."
        )
    return int(rows[0][0])


def ensure_background(
    connection: CatalogConnection,
    background: EventBackground,
    *,
    write: bool,
    stats: ApplyStats,
) -> int | None:
    rows = connection.execute(
        """
        SELECT background_id, location, image_url, date
        FROM backgrounds
        WHERE lower(name) = ? AND date = ?
        ORDER BY background_id
        """,
        (background.name.lower(), background.date),
    ).fetchall()
    if len(rows) > 1:
        raise RuntimeError(
            f"Duplicate background identity for {background.name} on {background.date}."
        )

    desired = (background.location, background.image_url, background.date)
    if rows:
        background_id = int(rows[0][0])
        current = (rows[0][1], rows[0][2], _normalized_date(rows[0][3]))
        if current != desired:
            stats.backgrounds_updated += 1
            if write:
                connection.execute(
                    """
                    UPDATE backgrounds
                    SET location = ?, image_url = ?, date = ?
                    WHERE background_id = ?
                    """,
                    (*desired, background_id),
                )
        return background_id

    stats.backgrounds_inserted += 1
    if not write:
        return None
    connection.execute(
        "SELECT pg_advisory_xact_lock(hashtext(?))",
        ("pokemon_catalog:backgrounds:background_id",),
    )
    background_id = int(
        connection.execute(
            "SELECT COALESCE(MAX(background_id), 0) + 1 FROM backgrounds"
        ).fetchone()[0]
    )
    connection.execute(
        """
        INSERT INTO backgrounds (background_id, name, location, image_url, date)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            background_id,
            background.name,
            background.location,
            background.image_url,
            background.date,
        ),
    )
    return background_id


def reconcile_background_links(
    connection: CatalogConnection,
    *,
    pokemon_id: int,
    background_id: int,
    desired_costume_ids: Iterable[int],
    write: bool,
    stats: ApplyStats,
) -> None:
    """Make one Pokemon/background pair contain exactly the desired costumes."""
    desired = list(dict.fromkeys(int(value) for value in desired_costume_ids))
    if not desired:
        raise ValueError("At least one desired costume ID is required.")

    background = connection.execute(
        "SELECT 1 FROM backgrounds WHERE background_id = ?",
        (background_id,),
    ).fetchone()
    if background is None:
        raise RuntimeError(f"Missing reviewed background {background_id}.")

    rows = connection.execute(
        """
        SELECT id, costume_id
        FROM pokemon_backgrounds
        WHERE pokemon_id = ? AND background_id = ?
        ORDER BY id
        """,
        (pokemon_id, background_id),
    ).fetchall()
    desired_remaining = desired.copy()
    keep_ids: set[int] = set()
    reusable_ids: list[int] = []

    for link_id_value, costume_id_value in rows:
        link_id = int(link_id_value)
        costume_id = int(costume_id_value) if costume_id_value is not None else None
        if costume_id in desired_remaining:
            keep_ids.add(link_id)
            desired_remaining.remove(costume_id)
        else:
            reusable_ids.append(link_id)

    while desired_remaining and reusable_ids:
        costume_id = desired_remaining.pop(0)
        link_id = reusable_ids.pop(0)
        stats.links_updated += 1
        if write:
            connection.execute(
                "UPDATE pokemon_backgrounds SET costume_id = ? WHERE id = ?",
                (costume_id, link_id),
            )

    for link_id in reusable_ids:
        stats.links_deleted += 1
        if write:
            connection.execute(
                "DELETE FROM pokemon_backgrounds WHERE id = ?",
                (link_id,),
            )

    for costume_id in desired_remaining:
        stats.links_inserted += 1
        if write:
            connection.execute(
                """
                INSERT INTO pokemon_backgrounds (
                    pokemon_id, background_id, costume_id
                )
                VALUES (?, ?, ?)
                """,
                (pokemon_id, background_id, costume_id),
            )


def apply_release_roster(
    connection: CatalogConnection,
    *,
    write: bool,
) -> tuple[ApplyStats, dict[str, int | None]]:
    validate_roster()
    stats = ApplyStats()
    costume_ids: dict[str, int | None] = {}
    connection.execute("BEGIN")
    try:
        for release in COSTUME_RELEASES:
            costume_ids[release.costume_name] = ensure_costume(
                connection,
                release,
                write=write,
                stats=stats,
            )

        spring_hat_id = find_costume_id(connection, 25, "spring_hat")
        if write:
            red_hat_id = find_costume_id(connection, 25, "red_hat")
            leaf_hat_id = find_costume_id(connection, 25, "leaf_hat")
            pokopia_ids = [
                int(costume_ids["pokopia_hat"]),
                int(costume_ids["pokopia_cap"]),
            ]
            baseball_id = int(costume_ids["baseball_shirt"])
            anniversary_id = int(costume_ids["10th_anniversary_coin"])
            professor_id = int(costume_ids["professor_willows_assistant"])

            reconcile_background_links(
                connection,
                pokemon_id=132,
                background_id=239,
                desired_costume_ids=pokopia_ids,
                write=True,
                stats=stats,
            )
            for background_id in BASEBALL_BACKGROUND_IDS:
                reconcile_background_links(
                    connection,
                    pokemon_id=25,
                    background_id=background_id,
                    desired_costume_ids=[baseball_id],
                    write=True,
                    stats=stats,
                )
            reconcile_background_links(
                connection,
                pokemon_id=25,
                background_id=231,
                desired_costume_ids=[spring_hat_id],
                write=True,
                stats=stats,
            )
            reconcile_background_links(
                connection,
                pokemon_id=999,
                background_id=235,
                desired_costume_ids=[anniversary_id],
                write=True,
                stats=stats,
            )
            for background in PROFESSOR_BACKGROUNDS:
                background_id = ensure_background(
                    connection,
                    background,
                    write=True,
                    stats=stats,
                )
                reconcile_background_links(
                    connection,
                    pokemon_id=25,
                    background_id=int(background_id),
                    desired_costume_ids=[red_hat_id, leaf_hat_id, professor_id],
                    write=True,
                    stats=stats,
                )

            validate_applied_catalog(connection, costume_ids)
            connection.commit()
        else:
            connection.rollback()
        return stats, costume_ids
    except Exception:
        connection.rollback()
        raise


def validate_applied_catalog(
    connection: CatalogConnection,
    costume_ids: dict[str, int | None],
) -> None:
    if any(costume_id is None for costume_id in costume_ids.values()):
        raise RuntimeError("Applied costume roster has unresolved costume IDs.")

    expected_links = {
        (132, 239): {
            int(costume_ids["pokopia_hat"]),
            int(costume_ids["pokopia_cap"]),
        },
        (25, 231): {find_costume_id(connection, 25, "spring_hat")},
        (999, 235): {int(costume_ids["10th_anniversary_coin"])},
    }
    expected_links.update(
        {
            (25, background_id): {int(costume_ids["baseball_shirt"])}
            for background_id in BASEBALL_BACKGROUND_IDS
        }
    )
    for background in PROFESSOR_BACKGROUNDS:
        row = connection.execute(
            """
            SELECT background_id
            FROM backgrounds
            WHERE lower(name) = ? AND date = ?
            """,
            (background.name.lower(), background.date),
        ).fetchone()
        if row is None:
            raise RuntimeError(f"Missing applied background {background.name}.")
        expected_links[(25, int(row[0]))] = {
            find_costume_id(connection, 25, "red_hat"),
            find_costume_id(connection, 25, "leaf_hat"),
            int(costume_ids["professor_willows_assistant"]),
        }

    for (pokemon_id, background_id), expected_costumes in expected_links.items():
        actual = {
            int(row[0])
            for row in connection.execute(
                """
                SELECT costume_id
                FROM pokemon_backgrounds
                WHERE pokemon_id = ? AND background_id = ?
                """,
                (pokemon_id, background_id),
            ).fetchall()
            if row[0] is not None
        }
        if actual != expected_costumes:
            raise RuntimeError(
                f"Background {background_id} for Pokemon {pokemon_id} has "
                f"costumes {sorted(actual)}, expected {sorted(expected_costumes)}."
            )


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write catalog changes")
    parser.add_argument("--database-url", help="Explicit PostgreSQL catalog URL")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    validate_roster()
    load_editor_environment()

    if args.database_url:
        with open_catalog_connection(args.database_url) as connection:
            stats, costume_ids = apply_release_roster(
                connection,
                write=args.apply,
            )
    else:
        with ProductionCatalogSession(
            production_editor_settings(),
            refresh_on_success=args.apply,
        ):
            database_url = configured_database_url(
                os.environ.get("POKEGO_EDITOR_DATABASE_URL")
            )
            with open_catalog_connection(database_url) as connection:
                stats, costume_ids = apply_release_roster(
                    connection,
                    write=args.apply,
                )

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(f"{mode}: reviewed costume release roster")
    print(f"Pinned source revision: {SOURCE_REVISION}")
    print(f"Source: {SOURCE_URL}")
    print(f"Catalog changes: {stats.changed}")
    print(
        "Costumes: "
        f"{stats.costumes_inserted} inserted, {stats.costumes_updated} updated"
    )
    print(
        "Backgrounds: "
        f"{stats.backgrounds_inserted} inserted, {stats.backgrounds_updated} updated"
    )
    print(
        "Links: "
        f"{stats.links_inserted} inserted, {stats.links_updated} updated, "
        f"{stats.links_deleted} deleted"
    )
    if args.apply:
        for release in COSTUME_RELEASES:
            print(
                f"costume_id={costume_ids[release.costume_name]} "
                f"pokemon_id={release.pokemon_id} {release.costume_name}"
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
