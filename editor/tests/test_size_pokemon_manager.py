import unittest

from test_base import TempDBTestCase
from database.size_pokemon_manager import SizePokemonManager


class SizePokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = SizePokemonManager(self.db_connection)

    def test_fetch_size_data_returns_existing_row_values(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM pokemon_sizes LIMIT 1")
        size_data = self.manager.fetch_size_data(pokemon_id)
        self.assertEqual(len(size_data), 12)
        self.assertTrue(any(value is not None for value in size_data))

    def test_fetch_size_data_returns_nones_for_missing_row(self):
        pokemon_id = 999999
        size_data = self.manager.fetch_size_data(pokemon_id)
        self.assertEqual(size_data, [None] * 12)

    def test_upsert_size_data_updates_existing_row(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM pokemon_sizes LIMIT 1")
        payload = (1.1, 2.2, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 10.1, 10.2, 10.3, 10.4)
        self.manager.upsert_size_data(pokemon_id, payload)

        row = self.row(
            """
            SELECT pokedex_height, pokedex_weight, height_standard_deviation, weight_standard_deviation,
                   height_xxs_threshold, height_xs_threshold, height_xl_threshold, height_xxl_threshold,
                   weight_xxs_threshold, weight_xs_threshold, weight_xl_threshold, weight_xxl_threshold
            FROM pokemon_sizes
            WHERE pokemon_id = ?
            """,
            (pokemon_id,),
        )
        self.assertEqual(row, payload)

    def test_upsert_size_data_inserts_when_missing(self):
        pokemon_id = self.scalar(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN pokemon_sizes s ON s.pokemon_id = p.pokemon_id
            WHERE s.pokemon_id IS NULL
            LIMIT 1
            """
        )
        self.assertIsNotNone(pokemon_id)
        payload = (3.1, 4.2, 0.11, 0.22, 0.33, 0.44, 0.55, 0.66, 20.1, 20.2, 20.3, 20.4)
        self.manager.upsert_size_data(pokemon_id, payload)

        row = self.row(
            "SELECT * FROM pokemon_sizes WHERE pokemon_id = ?",
            (pokemon_id,),
        )
        self.assertIsNotNone(row)
        self.assertEqual(row[0], pokemon_id)
        self.assertEqual(row[1:], payload)


if __name__ == "__main__":
    unittest.main()
