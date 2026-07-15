import unittest

from test_base import TempDBTestCase
from database.evolution_manager import EvolutionManager


class EvolutionManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = EvolutionManager(self.db_connection)

    def test_add_and_remove_evolves_to(self):
        pokemon_id = 1
        evolves_to = 2

        evolution_id = self.manager.add_evolves_to(pokemon_id, evolves_to)
        self.assertIsNotNone(evolution_id)

        added = self.row(
            """
            SELECT pokemon_id, evolves_to
            FROM pokemon_evolutions
            WHERE evolution_id = ?
            """,
            (evolution_id,),
        )
        self.assertEqual(added, (pokemon_id, evolves_to))

        self.manager.remove_evolves_to(pokemon_id, evolves_to)
        exists = self.scalar(
            """
            SELECT COUNT(*)
            FROM pokemon_evolutions
            WHERE evolution_id = ?
            """,
            (evolution_id,),
        )
        self.assertEqual(exists, 0)

    def test_fetch_evolution_details_for_pokemon(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM pokemon_evolutions LIMIT 1")
        self.assertIsNotNone(pokemon_id)

        details = self.manager.fetch_evolution_details(pokemon_id)
        self.assertGreater(len(details), 0)
        self.assertEqual(len(details[0]), 6)

    def test_update_evolution_details(self):
        evolution_id = self.manager.add_evolves_to(1, 2)
        self.manager.update_evolution_details(
            evolution_id=evolution_id,
            evolves_to_id=3,
            candies_needed=25,
            trade_discount=1,
            item_id=77,
            other="unit-test",
        )

        updated = self.row(
            """
            SELECT evolves_to, candies_needed, trade_discount, item_id, other
            FROM pokemon_evolutions
            WHERE evolution_id = ?
            """,
            (evolution_id,),
        )
        self.assertEqual(updated, (3, 25, "1", 77, "unit-test"))

    def test_fetch_evolution_details_for_evolves_to_filter(self):
        _ = self.manager.add_evolves_to(10, 11)
        _ = self.manager.add_evolves_to(10, 12)

        filtered = self.manager.fetch_evolution_details_for_evolves_to(10, 11)
        self.assertGreater(len(filtered), 0)
        self.assertTrue(all(row[1] == 11 for row in filtered))


if __name__ == "__main__":
    unittest.main()
