#!/usr/bin/env python3
"""Apply the dated Max release roster through the guarded editor tunnel."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = EDITOR_DIR.parent
POKEMON_DIR = REPO_ROOT / "pokemon"
ROSTER_SQL = POKEMON_DIR / "scripts" / "sql" / "20260722_max_release_roster.sql"

if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from config import load_editor_environment, production_editor_settings
from production_session import ProductionCatalogSession
from scripts.postgres_catalog import configured_database_url, open_catalog_connection


def _apply_schema_migrations(database_url: str) -> None:
    subprocess.run(
        [
            "go",
            "run",
            "./cmd/catalog-migrate",
            "--database-url",
            database_url,
        ],
        cwd=POKEMON_DIR,
        check=True,
    )


def _apply_release_roster(database_url: str) -> tuple[int, int, list[str]]:
    sql = ROSTER_SQL.read_text(encoding="utf-8")
    with open_catalog_connection(database_url) as connection:
        try:
            connection.execute(sql)

            dynamax_count = connection.execute(
                "SELECT COUNT(*) FROM max_pokemon WHERE dynamax IS TRUE"
            ).fetchone()[0]
            gigantamax_count = connection.execute(
                "SELECT COUNT(*) FROM max_pokemon WHERE gigantamax IS TRUE"
            ).fetchone()[0]
            missing_images = [
                row[0]
                for row in connection.execute(
                    """
                    SELECT pokemon.name
                    FROM max_pokemon
                    JOIN pokemon USING (pokemon_id)
                    WHERE max_pokemon.gigantamax IS TRUE
                      AND max_pokemon.gigantamax_image_url IS NULL
                    ORDER BY pokemon.pokedex_number, pokemon.pokemon_id
                    """
                ).fetchall()
            ]

            if dynamax_count != 134:
                raise RuntimeError(
                    f"Expected 134 released Dynamax catalog forms, found {dynamax_count}."
                )
            if gigantamax_count != 18:
                raise RuntimeError(
                    f"Expected 18 released Gigantamax catalog forms, found {gigantamax_count}."
                )
            if connection.execute(
                """
                SELECT COUNT(*)
                FROM max_pokemon
                WHERE gigantamax IS TRUE
                  AND (
                    gigantamax_move_name IS NULL
                    OR gigantamax_move_type_id IS NULL
                  )
                """
            ).fetchone()[0] != 0:
                raise RuntimeError("One or more Gigantamax forms are missing G-Max move metadata.")
            if connection.execute(
                "SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 884"
            ).fetchone()[0] != 5:
                raise RuntimeError("Duraludon's five-move Pokemon GO pool is incomplete.")
            unpublished_count = connection.execute(
                """
                SELECT COUNT(*)
                FROM max_pokemon
                JOIN pokemon USING (pokemon_id)
                WHERE (max_pokemon.dynamax IS TRUE OR max_pokemon.gigantamax IS TRUE)
                  AND pokemon.available IS NOT TRUE
                """
            ).fetchone()[0]
            if unpublished_count != 0:
                raise RuntimeError(
                    f"{unpublished_count} released Max forms are hidden from the API catalog."
                )

            connection.commit()
            return dynamax_count, gigantamax_count, missing_images
        except Exception:
            connection.rollback()
            raise


def main() -> None:
    if not ROSTER_SQL.is_file():
        raise RuntimeError(f"Release roster is missing: {ROSTER_SQL}")

    load_editor_environment()
    with ProductionCatalogSession(production_editor_settings()):
        database_url = configured_database_url(os.environ.get("POKEGO_EDITOR_DATABASE_URL"))
        _apply_schema_migrations(database_url)
        dynamax_count, gigantamax_count, missing_images = _apply_release_roster(
            database_url
        )

    print(
        f"Max catalog updated: {dynamax_count} Dynamax forms and "
        f"{gigantamax_count} Gigantamax forms."
    )
    if missing_images:
        print("Gigantamax images still required: " + ", ".join(missing_images))


if __name__ == "__main__":
    main()
