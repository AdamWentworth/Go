import unittest

from test_base import TempDBTestCase
from database.costume_pokemon_manager import CostumePokemonManager


class CostumePokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = CostumePokemonManager(self.db_connection)

    def test_fetch_pokemon_costumes_returns_existing_rows(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM costume_pokemon LIMIT 1")
        self.assertIsNotNone(pokemon_id)

        rows = self.manager.fetch_pokemon_costumes(pokemon_id)
        self.assertGreater(len(rows), 0)
        self.assertTrue(all(row[1] == pokemon_id for row in rows))
        self.assertEqual([row[0] for row in rows], sorted(row[0] for row in rows))

    def test_fetch_pokemon_costumes_orders_rows_by_costume_id(self):
        pokemon_id = 999001
        self.db_connection.get_cursor().executemany(
            """
            INSERT INTO costume_pokemon (
                costume_id,
                pokemon_id,
                costume_name,
                shiny_available,
                date_available,
                date_shiny_available,
                image_url_costume,
                image_url_shiny_costume,
                image_url_costume_female,
                image_url_shiny_costume_female
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (7003, pokemon_id, "third", False, None, None, None, None, None, None),
                (7001, pokemon_id, "first", False, None, None, None, None, None, None),
                (7002, pokemon_id, "second", False, None, None, None, None, None, None),
            ],
        )
        self.db_connection.commit()

        rows = self.manager.fetch_pokemon_costumes(pokemon_id)

        self.assertEqual([row[0] for row in rows], [7001, 7002, 7003])

    def test_add_costume_and_fetch_options(self):
        costume_details = {
            "costume_name": "Unit Test Costume",
            "shiny_available": 1,
            "date_available": "2026-03-04",
            "date_shiny_available": "2026-03-05",
            "image_url_costume": "/images/costume/unit_test.png",
            "image_url_shiny_costume": "/images/costume/unit_test_shiny.png",
            "image_url_costume_female": "/images/costume/unit_test_female.png",
            "image_url_shiny_costume_female": "/images/costume/unit_test_female_shiny.png",
        }
        costume_id = self.manager.add_costume(1, costume_details)

        row = self.row(
            """
            SELECT pokemon_id, costume_name, shiny_available
            FROM costume_pokemon
            WHERE costume_id = ?
            """,
            (costume_id,),
        )
        self.assertEqual(row, (1, "Unit Test Costume", 1))

        options = self.manager.fetch_costume_options(1)
        self.assertTrue(any(opt.startswith(f"{costume_id}: ") for opt in options))

    def test_fetch_costume_options_orders_by_costume_id(self):
        pokemon_id = 999002
        self.db_connection.get_cursor().executemany(
            """
            INSERT INTO costume_pokemon (
                costume_id,
                pokemon_id,
                costume_name,
                shiny_available,
                date_available,
                date_shiny_available,
                image_url_costume,
                image_url_shiny_costume,
                image_url_costume_female,
                image_url_shiny_costume_female
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (7010, pokemon_id, "ten", False, None, None, None, None, None, None),
                (7008, pokemon_id, "eight", False, None, None, None, None, None, None),
                (7009, pokemon_id, "nine", False, None, None, None, None, None, None),
            ],
        )
        self.db_connection.commit()

        options = self.manager.fetch_costume_options(pokemon_id)

        self.assertEqual(options, ["7008: eight", "7009: nine", "7010: ten"])

    def test_update_pokemon_costume_updates_values_and_boolean_normalization(self):
        costume_id = self.scalar("SELECT costume_id FROM costume_pokemon LIMIT 1")
        self.assertIsNotNone(costume_id)

        updated_details = [
            "Updated Costume Name",
            "true",
            "2026-03-10",
            "2026-03-11",
            "/images/costume/updated.png",
            "/images/costume/updated_shiny.png",
            "/images/costume/updated_female.png",
            "/images/costume/updated_female_shiny.png",
        ]
        self.manager.update_pokemon_costume(costume_id, updated_details)

        row = self.row(
            """
            SELECT costume_name, shiny_available, date_available, image_url_costume
            FROM costume_pokemon
            WHERE costume_id = ?
            """,
            (costume_id,),
        )
        self.assertEqual(
            row,
            (
                "Updated Costume Name",
                1,
                "2026-03-10",
                "/images/costume/updated.png",
            ),
        )

    def test_delete_costume_removes_row(self):
        costume_details = {
            "costume_name": "Delete Me Costume",
            "shiny_available": 0,
            "date_available": None,
            "date_shiny_available": None,
            "image_url_costume": None,
            "image_url_shiny_costume": None,
            "image_url_costume_female": None,
            "image_url_shiny_costume_female": None,
        }
        costume_id = self.manager.add_costume(1, costume_details)
        self.manager.delete_costume(costume_id)

        exists = self.scalar(
            "SELECT COUNT(*) FROM costume_pokemon WHERE costume_id = ?",
            (costume_id,),
        )
        self.assertEqual(exists, 0)


if __name__ == "__main__":
    unittest.main()
