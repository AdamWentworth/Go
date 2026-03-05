import unittest

from test_base import TempDBTestCase
from database.fusion_pokemon_manager import FusionPokemonManager


class FusionPokemonManagerTests(TempDBTestCase):
    def setUp(self):
        super().setUp()
        self.manager = FusionPokemonManager(self.db_connection)

    def test_fetch_all_fusions_sorted_uses_fallback_on_invalid_sort_column(self):
        rows_default = self.manager.fetch_all_fusions_sorted("fusion_id")
        rows_invalid = self.manager.fetch_all_fusions_sorted("not_a_real_column")
        self.assertEqual(rows_invalid, rows_default)
        self.assertGreater(len(rows_default), 0)

    def test_fetch_fusion_details_returns_type_names_and_moves(self):
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        data, moves = self.manager.fetch_fusion_details(fusion_id)

        self.assertIsNotNone(data)
        self.assertEqual(len(data), 19)
        self.assertIsInstance(data[11], str)  # type_1_id converted to name
        self.assertGreater(len(moves), 0)
        self.assertEqual(len(moves[0]), 4)

    def test_fetch_fusion_moves_returns_move_ids(self):
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        move_ids = self.manager.fetch_fusion_moves(fusion_id)
        self.assertGreater(len(move_ids), 0)
        self.assertTrue(all(isinstance(mid, int) for mid in move_ids))

    def test_update_fusion_data_updates_row(self):
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        original = self.row("SELECT * FROM fusion_pokemon WHERE fusion_id = ?", (fusion_id,))
        self.assertIsNotNone(original)

        new_data = list(original[1:])
        new_data[2] = "Fusion Unit Test Name"  # name
        new_data[7] = 999  # attack
        new_data[8] = 998  # defense
        new_data[9] = 997  # stamina

        self.manager.update_fusion_data(fusion_id, new_data)
        updated = self.row(
            "SELECT name, attack, defense, stamina FROM fusion_pokemon WHERE fusion_id = ?",
            (fusion_id,),
        )
        self.assertEqual(updated, ("Fusion Unit Test Name", 999, 998, 997))

    def test_update_fusion_moveset_replaces_with_given_set(self):
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        move_ids = self.rows(
            """
            SELECT move_id
            FROM moves
            WHERE is_fast = 1
            ORDER BY move_id
            LIMIT 2
            """
        )
        selected = [move_ids[0][0], move_ids[1][0]]

        payload = [(selected[0], 1), (selected[1], 0)]
        self.manager.update_fusion_moveset(fusion_id, payload)

        rows = self.rows(
            """
            SELECT move_id, legacy
            FROM fusion_moveset
            WHERE fusion_id = ?
            ORDER BY move_id
            """,
            (fusion_id,),
        )
        self.assertEqual(rows, sorted(payload, key=lambda x: x[0]))

    def test_fetch_fusion_background_rule_rows_returns_expected_shape(self):
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        rule_id = self.manager.add_fusion_background_rule(
            fusion_id,
            13,
            14,
            15,
            1,
            "unit-test-shape",
        )
        self.assertIsNotNone(rule_id)

        rows = self.manager.fetch_fusion_background_rule_rows(fusion_id)
        self.assertGreater(len(rows), 0)
        self.assertGreaterEqual(len(rows[0]), 13)

    def test_add_update_delete_fusion_background_rule_round_trip(self):
        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        rule_id = self.manager.add_fusion_background_rule(
            fusion_id,
            13,
            14,
            15,
            1,
            "created",
        )
        self.assertIsNotNone(rule_id)

        created = self.row(
            """
            SELECT member1_background_id, member2_background_id, combo_background_id, is_active, notes
            FROM fusion_background_combo_rules
            WHERE id = ?
            """,
            (rule_id,),
        )
        self.assertEqual(created, (13, 14, 15, 1, "created"))

        self.manager.update_fusion_background_rule(
            rule_id,
            16,
            17,
            19,
            0,
            "updated",
        )
        updated = self.row(
            """
            SELECT member1_background_id, member2_background_id, combo_background_id, is_active, notes
            FROM fusion_background_combo_rules
            WHERE id = ?
            """,
            (rule_id,),
        )
        self.assertEqual(updated, (16, 17, 19, 0, "updated"))

        self.manager.delete_fusion_background_rule(rule_id)
        remaining = self.scalar(
            "SELECT COUNT(*) FROM fusion_background_combo_rules WHERE id = ?",
            (rule_id,),
        )
        self.assertEqual(remaining, 0)


if __name__ == "__main__":
    unittest.main()
