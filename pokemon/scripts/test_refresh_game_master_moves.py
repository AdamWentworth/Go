from __future__ import annotations

import unittest

from refresh_game_master_moves import (
    build_game_master_moves,
    get_local_move_groups,
    get_local_moves,
    normalize_key,
)


class FakeConnection:
    def __init__(self, rows: list[dict]) -> None:
        self.rows = rows

    def execute(self, query: str):
        if "ORDER BY m.move_id" not in query:
            raise AssertionError("Move lookup must retain deterministic ID ordering.")
        return iter(self.rows)


def move_entry(
    *,
    token: str,
    type_name: str,
    power: int,
    energy_delta: int,
    duration_ms: int,
) -> dict:
    suffix = "_FAST" if energy_delta > 0 else ""
    return {
        "templateId": f"V0001_MOVE_{token}{suffix}",
        "data": {
            "moveSettings": {
                "movementId": token,
                "pokemonType": f"POKEMON_TYPE_{type_name.upper()}",
                "power": power,
                "energyDelta": energy_delta,
                "durationMs": duration_ms,
            }
        },
    }


def combat_entry(
    *,
    token: str,
    type_name: str,
    power: int,
    energy_delta: int,
    duration_turns: int | None = None,
    buffs: dict | None = None,
) -> dict:
    settings: dict = {
        "uniqueId": token,
        "type": f"POKEMON_TYPE_{type_name.upper()}",
        "power": power,
        "energyDelta": energy_delta,
    }
    if duration_turns is not None:
        settings["durationTurns"] = duration_turns
    if buffs is not None:
        settings["buffs"] = buffs
    return {
        "templateId": f"COMBAT_V0001_MOVE_{token}",
        "data": {"combatMove": settings},
    }


class BuildGameMasterMovesTest(unittest.TestCase):
    def test_apex_suffixes_do_not_collapse_onto_base_move_key(self) -> None:
        self.assertEqual(normalize_key("Aeroblast"), "aeroblast")
        self.assertEqual(normalize_key("Aeroblast+"), "aeroblastplus")
        self.assertEqual(normalize_key("Aeroblast++"), "aeroblastplusplus")
        self.assertEqual(normalize_key("Aeroblast Plus"), "aeroblastplus")
        self.assertEqual(
            normalize_key("Aeroblast Plus Plus"),
            "aeroblastplusplus",
        )

    def test_duplicate_typed_moves_keep_all_rows_and_choose_stable_assignment_id(
        self,
    ) -> None:
        connection = FakeConnection(
            [
                {
                    "move_id": 100,
                    "name": "Aeroblast+",
                    "type_name": "flying",
                },
                {
                    "move_id": 101,
                    "name": "Aeroblast+",
                    "type_name": "flying",
                },
            ]
        )

        grouped_by_key, grouped_by_type = get_local_move_groups(connection)
        by_key, by_type = get_local_moves(connection)

        self.assertEqual(
            [row["move_id"] for row in grouped_by_type["aeroblastplus:flying"]],
            [100, 101],
        )
        self.assertEqual(len(grouped_by_key["aeroblastplus"]), 2)
        self.assertNotIn("aeroblastplus", by_key)
        self.assertEqual(by_type["aeroblastplus:flying"]["move_id"], 100)

    def test_reads_pvp_timing_and_all_buff_targets(self) -> None:
        game_master = [
            move_entry(
                token="TEST_STRIKE",
                type_name="fighting",
                power=100,
                energy_delta=-50,
                duration_ms=2400,
            ),
            combat_entry(
                token="TEST_STRIKE",
                type_name="fighting",
                power=65,
                energy_delta=-45,
                buffs={
                    "attackerAttackStatStageChange": 1,
                    "attackerDefenseStatStageChange": -1,
                    "targetAttackStatStageChange": -2,
                    "targetDefenseStatStageChange": 2,
                    "buffActivationChance": 0.5,
                },
            ),
        ]

        move = build_game_master_moves(game_master)["teststrike:fighting"]

        self.assertEqual(move.pvp_power, 65)
        self.assertEqual(move.pvp_energy, -45)
        self.assertEqual(move.pvp_turns, 1)
        self.assertEqual(move.pvp_attacker_attack_stage_change, 1)
        self.assertEqual(move.pvp_attacker_defense_stage_change, -1)
        self.assertEqual(move.pvp_target_attack_stage_change, -2)
        self.assertEqual(move.pvp_target_defense_stage_change, 2)
        self.assertEqual(move.pvp_buff_activation_chance, 0.5)

    def test_fast_move_duration_is_zero_based_in_game_master(self) -> None:
        game_master = [
            move_entry(
                token="TEST_TAP",
                type_name="normal",
                power=5,
                energy_delta=8,
                duration_ms=1000,
            ),
            combat_entry(
                token="TEST_TAP",
                type_name="normal",
                power=3,
                energy_delta=9,
                duration_turns=1,
            ),
        ]

        move = build_game_master_moves(game_master)["testtap:normal"]

        self.assertEqual(move.pvp_turns, 2)
        self.assertEqual(move.pvp_buff_activation_chance, 0)

    def test_missing_fast_duration_is_one_turn(self) -> None:
        game_master = [
            move_entry(
                token="TEST_QUICK",
                type_name="water",
                power=5,
                energy_delta=7,
                duration_ms=500,
            ),
            combat_entry(
                token="TEST_QUICK",
                type_name="water",
                power=3,
                energy_delta=8,
            ),
        ]

        move = build_game_master_moves(game_master)["testquick:water"]

        self.assertEqual(move.pvp_turns, 1)


if __name__ == "__main__":
    unittest.main()
