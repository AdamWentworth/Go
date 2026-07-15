import unittest

from test_base import TempDBTestCase
from database.move_manager import MoveManager


class MoveManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = MoveManager(self.db_connection)

    def test_fetch_all_moves_sorted_returns_formatted_rows(self):
        rows = self.manager.fetch_all_moves_sorted("move_id")
        self.assertGreater(len(rows), 0)
        self.assertTrue(rows[0].split(":", 1)[0].strip().isdigit())

    def test_fetch_move_details_returns_expected_shape(self):
        details = self.manager.fetch_move_details(1)
        self.assertIsNotNone(details)
        self.assertEqual(details[0], 1)
        self.assertEqual(len(details), 14)

    def test_add_update_delete_move_and_usage_counts(self):
        dragon_type_id = self.scalar("SELECT type_id FROM types WHERE name = 'Dragon'")
        self.assertIsNotNone(dragon_type_id)

        move_payload = (
            "Unit Test Move",
            dragon_type_id,
            123,
            45,
            67,
            8,
            900,
            2,
            0,
            None,
            None,
            None,
            None,
        )
        new_move_id = self.manager.add_move(None, move_payload)
        self.assertIsInstance(new_move_id, int)

        row = self.row(
            "SELECT name, type_id, is_fast FROM moves WHERE move_id = ?",
            (new_move_id,),
        )
        self.assertEqual(row, ("Unit Test Move", dragon_type_id, 0))

        updated_payload = (
            "Unit Test Move Updated",
            dragon_type_id,
            200,
            50,
            80,
            10,
            700,
            1,
            1,
            None,
            1,
            0,
            None,
        )
        self.manager.update_move(new_move_id, updated_payload)
        updated_row = self.row(
            "SELECT name, raid_power, is_fast, shadow, purified FROM moves WHERE move_id = ?",
            (new_move_id,),
        )
        self.assertEqual(updated_row, ("Unit Test Move Updated", 200, 1, 1, 0))

        pokemon_id = self.scalar("SELECT pokemon_id FROM pokemon LIMIT 1")
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        self.assertIsNotNone(pokemon_id)
        self.assertIsNotNone(fusion_id)

        cursor = self.db_connection.get_cursor()
        pokemon_move_id = self.db_connection.next_identifier("pokemon_moves", "id")
        cursor.execute(
            "INSERT INTO pokemon_moves (id, move_id, pokemon_id, legacy) VALUES (?, ?, ?, ?)",
            (pokemon_move_id, new_move_id, pokemon_id, False),
        )
        cursor.execute(
            "INSERT INTO fusion_moveset (fusion_id, move_id, legacy) VALUES (?, ?, ?)",
            (fusion_id, new_move_id, False),
        )
        self.db_connection.commit()

        usage = self.manager.count_move_usage(new_move_id)
        self.assertEqual(usage["pokemon_moves"], 1)
        self.assertEqual(usage["fusion_moveset"], 1)
        self.assertEqual(usage["total"], 2)

        self.manager.delete_move(new_move_id)
        self.assertIsNone(self.row("SELECT move_id FROM moves WHERE move_id = ?", (new_move_id,)))
        self.assertEqual(
            self.scalar("SELECT COUNT(*) FROM pokemon_moves WHERE move_id = ?", (new_move_id,)),
            0,
        )
        self.assertEqual(
            self.scalar("SELECT COUNT(*) FROM fusion_moveset WHERE move_id = ?", (new_move_id,)),
            0,
        )


if __name__ == "__main__":
    unittest.main()
