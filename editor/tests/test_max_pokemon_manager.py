import unittest

from test_base import TempDBTestCase
from database.max_pokemon_manager import MaxPokemonManager


class MaxPokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = MaxPokemonManager(self.db_connection)

    def test_fetch_max_pokemon_returns_row_for_known_id(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM max_pokemon LIMIT 1")
        row = self.manager.fetch_max_pokemon(pokemon_id)
        self.assertIsNotNone(row)
        self.assertEqual(row[0], pokemon_id)

    def test_insert_max_pokemon_creates_row_if_missing(self):
        pokemon_id = self.scalar(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN max_pokemon mp ON mp.pokemon_id = p.pokemon_id
            WHERE mp.pokemon_id IS NULL
            LIMIT 1
            """
        )
        self.assertIsNotNone(pokemon_id)

        self.manager.insert_max_pokemon(pokemon_id)
        row = self.manager.fetch_max_pokemon(pokemon_id)
        self.assertIsNotNone(row)
        self.assertEqual(row[0], pokemon_id)

    def test_insert_max_pokemon_is_idempotent_when_row_exists(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM max_pokemon LIMIT 1")
        before = self.scalar("SELECT COUNT(*) FROM max_pokemon WHERE pokemon_id = ?", (pokemon_id,))
        self.manager.insert_max_pokemon(pokemon_id)
        after = self.scalar("SELECT COUNT(*) FROM max_pokemon WHERE pokemon_id = ?", (pokemon_id,))
        self.assertEqual(before, 1)
        self.assertEqual(after, 1)

    def test_update_max_pokemon_updates_columns(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM max_pokemon LIMIT 1")
        self.manager.update_max_pokemon(
            pokemon_id,
            1,
            1,
            "2026-03-10",
            "2026-03-11",
            "/images/max/gmax_unit_test.png",
            "/images/max/gmax_unit_test_shiny.png",
            "G-Max Vine Lash",
            self.scalar("SELECT type_id FROM types WHERE name = 'Grass'"),
        )
        row = self.row(
            """
            SELECT dynamax, gigantamax, dynamax_release_date, gigantamax_release_date,
                   gigantamax_image_url, shiny_gigantamax_image_url,
                   gigantamax_move_name, gigantamax_move_type_id
            FROM max_pokemon
            WHERE pokemon_id = ?
            """,
            (pokemon_id,),
        )
        self.assertEqual(
            row,
            (
                1,
                1,
                "2026-03-10",
                "2026-03-11",
                "/images/max/gmax_unit_test.png",
                "/images/max/gmax_unit_test_shiny.png",
                "G-Max Vine Lash",
                self.scalar("SELECT type_id FROM types WHERE name = 'Grass'"),
            ),
        )

    def test_disabling_gigantamax_clears_its_move_metadata(self):
        pokemon_id = self.scalar(
            "SELECT pokemon_id FROM max_pokemon WHERE gigantamax = ? LIMIT 1",
            (self.db_connection.bool_value(1),),
        )
        self.manager.update_max_pokemon(
            pokemon_id,
            1,
            0,
            "2026-03-10",
            None,
            None,
            None,
            "G-Max Vine Lash",
            self.scalar("SELECT type_id FROM types WHERE name = 'Grass'"),
        )

        row = self.row(
            """
            SELECT gigantamax, gigantamax_move_name, gigantamax_move_type_id
            FROM max_pokemon
            WHERE pokemon_id = ?
            """,
            (pokemon_id,),
        )
        self.assertEqual(row, (0, None, None))


if __name__ == "__main__":
    unittest.main()
