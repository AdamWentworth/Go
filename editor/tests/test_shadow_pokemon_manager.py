import unittest

from test_base import TempDBTestCase
from database.shadow_pokemon_manager import ShadowPokemonManager


class ShadowPokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = ShadowPokemonManager(self.db_connection)

    def test_fetch_shadow_pokemon_data_returns_nones_for_missing_id(self):
        data = self.manager.fetch_shadow_pokemon_data(999999)
        self.assertEqual(data, [None] * 6)

    def test_update_shadow_pokemon_data_inserts_then_updates(self):
        pokemon_id = self.scalar(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN shadow_pokemon sp ON sp.pokemon_id = p.pokemon_id
            WHERE sp.pokemon_id IS NULL
            LIMIT 1
            """
        )
        self.assertIsNotNone(pokemon_id)

        payload_insert = {
            "Shiny Available": 1,
            "Apex": 0,
            "Date Available": "2026-03-01",
            "Date Shiny Available": "2026-03-02",
            "Image URL Shadow": "/images/shadow/unit_test.png",
            "Image URL Shiny Shadow": "/images/shadow/unit_test_shiny.png",
        }
        self.manager.update_shadow_pokemon_data(pokemon_id, payload_insert)
        inserted = self.manager.fetch_shadow_pokemon_data(pokemon_id)
        self.assertEqual(
            inserted,
            (
                1,
                0,
                "2026-03-01",
                "2026-03-02",
                "/images/shadow/unit_test.png",
                "/images/shadow/unit_test_shiny.png",
            ),
        )

        payload_update = dict(payload_insert)
        payload_update["Apex"] = 1
        payload_update["Image URL Shadow"] = "/images/shadow/unit_test_updated.png"
        self.manager.update_shadow_pokemon_data(pokemon_id, payload_update)

        updated = self.manager.fetch_shadow_pokemon_data(pokemon_id)
        self.assertEqual(updated[1], 1)
        self.assertEqual(updated[4], "/images/shadow/unit_test_updated.png")

    def test_save_shadow_costume_inserts_and_updates(self):
        self.manager.update_shadow_pokemon_data(
            1,
            {
                "Shiny Available": 1,
                "Apex": 0,
                "Date Available": "2026-03-10",
                "Date Shiny Available": "2026-03-11",
                "Image URL Shadow": "/images/shadow/a.png",
                "Image URL Shiny Shadow": "/images/shadow/b.png",
            },
        )
        shadow_id = self.scalar("SELECT id FROM shadow_pokemon WHERE pokemon_id = 1")
        self.assertIsNotNone(shadow_id)

        self.db_connection.get_cursor().execute(
            """
            INSERT INTO costume_pokemon (
                pokemon_id, costume_name, shiny_available, date_available,
                date_shiny_available, image_url_costume, image_url_shiny_costume,
                image_url_costume_female, image_url_shiny_costume_female
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                1,
                "Shadow Costume Unit Test",
                1,
                "2026-03-12",
                "2026-03-13",
                "/images/costume/shadow_unit.png",
                "/images/costume/shadow_unit_shiny.png",
                None,
                None,
            ),
        )
        self.db_connection.commit()
        costume_id = self.scalar("SELECT MAX(costume_id) FROM costume_pokemon")

        self.manager.save_shadow_costume(
            shadow_id,
            costume_id,
            "2026-03-14",
            "2026-03-15",
            "/images/shadow_costume/a.png",
            "/images/shadow_costume/b.png",
        )
        inserted = self.row(
            """
            SELECT date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume
            FROM shadow_costume_pokemon
            WHERE shadow_id = ? AND costume_id = ?
            """,
            (shadow_id, costume_id),
        )
        self.assertEqual(
            inserted,
            (
                "2026-03-14",
                "2026-03-15",
                "/images/shadow_costume/a.png",
                "/images/shadow_costume/b.png",
            ),
        )

        self.manager.save_shadow_costume(
            shadow_id,
            costume_id,
            "2026-03-16",
            "2026-03-17",
            "/images/shadow_costume/a2.png",
            "/images/shadow_costume/b2.png",
        )
        updated = self.row(
            """
            SELECT date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume
            FROM shadow_costume_pokemon
            WHERE shadow_id = ? AND costume_id = ?
            """,
            (shadow_id, costume_id),
        )
        self.assertEqual(
            updated,
            (
                "2026-03-16",
                "2026-03-17",
                "/images/shadow_costume/a2.png",
                "/images/shadow_costume/b2.png",
            ),
        )

    def test_fetch_shadow_options_returns_ids_as_strings(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM shadow_pokemon LIMIT 1")
        options = self.manager.fetch_shadow_options(pokemon_id)
        self.assertGreater(len(options), 0)
        self.assertTrue(all(isinstance(value, str) for value in options))

    def test_fetch_shadow_costume_data_returns_join_rows(self):
        self.manager.update_shadow_pokemon_data(
            25,
            {
                "Shiny Available": 1,
                "Apex": 0,
                "Date Available": "2026-03-18",
                "Date Shiny Available": "2026-03-19",
                "Image URL Shadow": "/images/shadow/c.png",
                "Image URL Shiny Shadow": "/images/shadow/d.png",
            },
        )
        shadow_id = self.scalar("SELECT id FROM shadow_pokemon WHERE pokemon_id = 25")
        self.db_connection.get_cursor().execute(
            """
            INSERT INTO costume_pokemon (
                pokemon_id, costume_name, shiny_available, date_available,
                date_shiny_available, image_url_costume, image_url_shiny_costume,
                image_url_costume_female, image_url_shiny_costume_female
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                25,
                "Shadow Join Costume",
                0,
                None,
                None,
                None,
                None,
                None,
                None,
            ),
        )
        self.db_connection.commit()
        costume_id = self.scalar("SELECT MAX(costume_id) FROM costume_pokemon")
        self.manager.save_shadow_costume(
            shadow_id,
            costume_id,
            "2026-03-20",
            "2026-03-21",
            "/images/shadow_costume/join_a.png",
            "/images/shadow_costume/join_b.png",
        )

        rows = self.manager.fetch_shadow_costume_data(25)
        self.assertGreater(len(rows), 0)
        self.assertEqual(len(rows[0]), 7)


if __name__ == "__main__":
    unittest.main()
