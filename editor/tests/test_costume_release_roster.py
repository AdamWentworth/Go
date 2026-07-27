from __future__ import annotations

import sys
import unittest
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))
TEST_DIR = Path(__file__).resolve().parent
if str(TEST_DIR) not in sys.path:
    sys.path.insert(0, str(TEST_DIR))

from scripts.apply_costume_release_roster import (
    BASEBALL_BACKGROUND_IDS,
    COSTUME_RELEASES,
    PROFESSOR_BACKGROUNDS,
    ApplyStats,
    CostumeRelease,
    apply_release_roster,
    ensure_costume,
    reconcile_background_links,
    validate_roster,
)
from scripts.postgres_catalog import CatalogConnection
from test_base import TempDBTestCase


class CostumeReleaseRosterTests(unittest.TestCase):
    def test_roster_has_all_reviewed_releases_and_stable_asset_targets(self) -> None:
        validate_roster()

        self.assertEqual(len(COSTUME_RELEASES), 12)
        self.assertEqual(
            {
                (release.pokemon_id, release.costume_name)
                for release in COSTUME_RELEASES
            },
            {
                (132, "pokopia_hat"),
                (132, "pokopia_cap"),
                (25, "baseball_shirt"),
                (222, "pink_sunglasses"),
                (25, "marathon_visor"),
                (25, "excavator"),
                (10, "poke_ball_hat"),
                (25, "team_mystic_hat"),
                (25, "team_instinct_hat"),
                (25, "team_valor_hat"),
                (999, "10th_anniversary_coin"),
                (25, "professor_willows_assistant"),
            },
        )
        for release in COSTUME_RELEASES:
            self.assertEqual(
                release.normal_image_url,
                f"/images/costumes/pokemon_{release.pokemon_id}_"
                f"{release.costume_name}_default.png",
            )
            self.assertEqual(
                release.shiny_image_url,
                f"/images/costumes_shiny/pokemon_{release.pokemon_id}_"
                f"{release.costume_name}_shiny.png",
            )
            self.assertEqual(
                release.female_image_url,
                f"/images/female/costumes/female_pokemon_{release.pokemon_id}_"
                f"{release.costume_name}_default.png",
            )
            self.assertEqual(
                release.shiny_female_image_url,
                f"/images/female/costumes_shiny/"
                f"female_pokemon_{release.pokemon_id}_"
                f"{release.costume_name}_shiny.png",
            )

    def test_background_roster_covers_each_known_costume_event(self) -> None:
        self.assertEqual(BASEBALL_BACKGROUND_IDS, tuple(range(202, 211)))
        self.assertEqual(
            {background.name.rsplit(" - ", 1)[-1] for background in PROFESSOR_BACKGROUNDS},
            {"Valor", "Instinct", "Mystic"},
        )
        self.assertTrue(
            all(
                background.date == "2026-07-21"
                and background.location == "Global"
                for background in PROFESSOR_BACKGROUNDS
            )
        )


class CostumeReleaseCatalogTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        if not hasattr(self, "db_connection"):
            return
        cursor = self.db_connection.get_cursor()
        try:
            cursor.execute(
                "UPDATE pokemon SET female_unique = TRUE WHERE pokemon_id = ?",
                (25,),
            )
            cursor.executemany(
                """
                INSERT INTO pokemon (pokemon_id, name, pokedex_number)
                VALUES (?, ?, ?)
                """,
                (
                    (132, "Ditto", 132),
                    (222, "Corsola", 222),
                    (999, "Gimmighoul", 999),
                ),
            )
            cursor.executemany(
                """
                INSERT INTO backgrounds (
                    background_id, name, location, image_url, date
                )
                VALUES (?, ?, ?, ?, ?)
                """,
                tuple(
                    (
                        background_id,
                        f"Reviewed {background_id}",
                        "Reviewed",
                        f"/images/backgrounds/{background_id}.png",
                        "2026-01-01",
                    )
                    for background_id in (
                        *BASEBALL_BACKGROUND_IDS,
                        231,
                        235,
                        239,
                    )
                ),
            )
            cursor.executemany(
                """
                INSERT INTO costume_pokemon (
                    costume_id, pokemon_id, costume_name
                )
                VALUES (?, ?, ?)
                """,
                (
                    (72, 25, "spring_hat"),
                    (302, 999, "9th_anniversary_coin"),
                ),
            )
            cursor.executemany(
                """
                INSERT INTO pokemon_backgrounds (
                    pokemon_id, background_id, costume_id
                )
                VALUES (?, ?, ?)
                """,
                (
                    *((25, background_id, None) for background_id in BASEBALL_BACKGROUND_IDS),
                    (25, 231, None),
                    (999, 235, 302),
                    (132, 239, None),
                    (131, 239, None),
                ),
            )
            self.db_connection.commit()
        finally:
            cursor.close()

    def _catalog_connection(self) -> CatalogConnection:
        return CatalogConnection(self.db_connection.conn)

    def test_costume_upsert_is_idempotent_and_keeps_image_placeholders(self) -> None:
        connection = self._catalog_connection()
        release = CostumeRelease(25, "Pikachu", "test_costume", "2026-07-26")

        first_stats = ApplyStats()
        costume_id = ensure_costume(
            connection,
            release,
            write=True,
            stats=first_stats,
        )
        second_stats = ApplyStats()
        same_costume_id = ensure_costume(
            connection,
            release,
            write=True,
            stats=second_stats,
        )
        connection.commit()

        self.assertEqual(costume_id, same_costume_id)
        self.assertEqual(first_stats.costumes_inserted, 1)
        self.assertEqual(second_stats.changed, 0)
        self.assertEqual(
            self.row(
                """
                SELECT shiny_available, date_available,
                       date_shiny_available, image_url_costume,
                       image_url_shiny_costume, image_url_costume_female,
                       image_url_shiny_costume_female
                FROM costume_pokemon
                WHERE costume_id = ?
                """,
                (costume_id,),
            ),
            (
                1,
                "2026-07-26",
                "2026-07-26",
                "/images/costumes/pokemon_25_test_costume_default.png",
                "/images/costumes_shiny/pokemon_25_test_costume_shiny.png",
                "/images/female/costumes/"
                "female_pokemon_25_test_costume_default.png",
                "/images/female/costumes_shiny/"
                "female_pokemon_25_test_costume_shiny.png",
            ),
        )

    def test_costume_upsert_omits_female_urls_for_species_without_unique_art(self) -> None:
        connection = self._catalog_connection()
        release = CostumeRelease(132, "Ditto", "test_costume", "2026-07-26")

        costume_id = ensure_costume(
            connection,
            release,
            write=True,
            stats=ApplyStats(),
        )
        connection.commit()

        self.assertEqual(
            self.row(
                """
                SELECT image_url_costume_female,
                       image_url_shiny_costume_female
                FROM costume_pokemon
                WHERE costume_id = ?
                """,
                (costume_id,),
            ),
            (None, None),
        )

    def test_link_reconciliation_supports_two_costumes_without_touching_other_pokemon(self) -> None:
        connection = self._catalog_connection()
        cursor = self.db_connection.get_cursor()
        try:
            cursor.executemany(
                """
                INSERT INTO costume_pokemon (
                    costume_id, pokemon_id, costume_name
                )
                VALUES (?, ?, ?)
                """,
                (
                    (401, 132, "first"),
                    (402, 132, "second"),
                ),
            )
            self.db_connection.commit()
        finally:
            cursor.close()

        stats = ApplyStats()
        reconcile_background_links(
            connection,
            pokemon_id=132,
            background_id=239,
            desired_costume_ids=(401, 402),
            write=True,
            stats=stats,
        )
        connection.commit()

        self.assertEqual(
            self.rows(
                """
                SELECT pokemon_id, costume_id
                FROM pokemon_backgrounds
                WHERE background_id = 239
                ORDER BY pokemon_id, costume_id
                """
            ),
            [
                (131, None),
                (132, 401),
                (132, 402),
            ],
        )
        rerun_stats = ApplyStats()
        reconcile_background_links(
            connection,
            pokemon_id=132,
            background_id=239,
            desired_costume_ids=(401, 402),
            write=True,
            stats=rerun_stats,
        )
        connection.commit()
        self.assertEqual(rerun_stats.changed, 0)

    def test_full_roster_reconciles_known_backgrounds_and_is_rerunnable(self) -> None:
        connection = self._catalog_connection()

        first_stats, costume_ids = apply_release_roster(connection, write=True)
        second_stats, second_costume_ids = apply_release_roster(connection, write=True)

        self.assertGreater(first_stats.changed, 0)
        self.assertEqual(second_stats.changed, 0)
        self.assertEqual(costume_ids, second_costume_ids)
        self.assertEqual(
            self.rows(
                """
                SELECT costume_id
                FROM pokemon_backgrounds
                WHERE pokemon_id = 132 AND background_id = 239
                ORDER BY costume_id
                """
            ),
            [
                (costume_ids["pokopia_hat"],),
                (costume_ids["pokopia_cap"],),
            ],
        )
        self.assertEqual(
            self.scalar(
                """
                SELECT costume_id
                FROM pokemon_backgrounds
                WHERE pokemon_id = 999 AND background_id = 235
                """
            ),
            costume_ids["10th_anniversary_coin"],
        )
        self.assertEqual(
            self.scalar(
                """
                SELECT costume_id
                FROM pokemon_backgrounds
                WHERE pokemon_id = 25 AND background_id = 231
                """
            ),
            72,
        )
        self.assertEqual(
            self.scalar(
                """
                SELECT COUNT(*)
                FROM pokemon_backgrounds
                WHERE pokemon_id = 25
                  AND background_id BETWEEN 202 AND 210
                  AND costume_id = ?
                """,
                (costume_ids["baseball_shirt"],),
            ),
            9,
        )
        self.assertEqual(
            self.scalar(
                """
                SELECT COUNT(*)
                FROM backgrounds b
                JOIN pokemon_backgrounds pb
                  ON pb.background_id = b.background_id
                WHERE b.name LIKE 'Professor Willow%%'
                  AND b.date = '2026-07-21'
                  AND pb.pokemon_id = 25
                  AND pb.costume_id = ?
                """,
                (costume_ids["professor_willows_assistant"],),
            ),
            3,
        )
        self.assertEqual(
            self.scalar(
                """
                SELECT COUNT(*)
                FROM pokemon_backgrounds
                WHERE pokemon_id = 131 AND background_id = 239
                """
            ),
            1,
        )


if __name__ == "__main__":
    unittest.main()
