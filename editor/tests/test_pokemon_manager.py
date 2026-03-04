import unittest

from test_base import TempDBTestCase
from database.pokemon_manager import PokemonManager


class PokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = PokemonManager(self.db_connection)

    def test_fetch_all_pokemon_sorted_returns_data(self):
        rows = self.manager.fetch_all_pokemon_sorted("pokemon_id")
        self.assertGreater(len(rows), 0)
        self.assertTrue(rows[0].startswith("1: "))

    def test_fetch_pokemon_details_returns_data_moves_and_evolution_map(self):
        pokemon_data, moves, evolutions = self.manager.fetch_pokemon_details(1)

        self.assertIsInstance(pokemon_data, list)
        self.assertEqual(pokemon_data[0], 1)
        self.assertEqual(len(pokemon_data), 21)

        self.assertIsInstance(moves, list)
        self.assertGreater(len(moves), 0)

        self.assertIsInstance(evolutions, dict)
        self.assertIn("evolves_to", evolutions)
        self.assertIn("evolves_from", evolutions)

    def test_fetch_pokemon_moves_returns_ids(self):
        move_ids = self.manager.fetch_pokemon_moves(1)
        self.assertGreater(len(move_ids), 0)
        self.assertTrue(all(isinstance(mid, int) for mid in move_ids))

    def test_update_pokemon_data_updates_selected_fields(self):
        original = self.row("SELECT * FROM pokemon WHERE pokemon_id = 1")
        self.assertIsNotNone(original)

        updated_data = list(original[1:20])  # columns updated by manager
        updated_data[0] = "Bulbasaur Unit Test"  # name
        updated_data[5] = 222  # attack
        updated_data[6] = 223  # defense
        updated_data[7] = 224  # stamina

        self.manager.update_pokemon_data(1, updated_data)
        row = self.row(
            "SELECT name, attack, defense, stamina FROM pokemon WHERE pokemon_id = 1"
        )
        self.assertEqual(row, ("Bulbasaur Unit Test", 222, 223, 224))

    def test_update_pokemon_moves_replaces_move_set(self):
        move_ids = self.rows(
            """
            SELECT move_id
            FROM moves
            ORDER BY move_id
            LIMIT 2
            """
        )
        self.assertEqual(len(move_ids), 2)

        payload = [(move_ids[0][0], 1), (move_ids[1][0], 0)]
        self.manager.update_pokemon_moves(1, payload)

        updated_rows = self.rows(
            """
            SELECT move_id, legacy
            FROM pokemon_moves
            WHERE pokemon_id = 1
            ORDER BY move_id
            """
        )
        self.assertEqual(updated_rows, sorted(payload, key=lambda x: x[0]))

    def test_build_evolution_map_contains_known_chain(self):
        evo_map = self.manager.build_evolution_map()
        self.assertIn(1, evo_map)
        self.assertIn("evolves_to", evo_map[1])
        self.assertIn(2, evo_map[1]["evolves_to"])


if __name__ == "__main__":
    unittest.main()
