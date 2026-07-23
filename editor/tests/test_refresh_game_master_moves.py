import importlib.util
import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = REPO_ROOT / "pokemon" / "scripts" / "refresh_game_master_moves.py"
spec = importlib.util.spec_from_file_location("refresh_game_master_moves", SCRIPT_PATH)
assert spec and spec.loader
refresh = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = refresh
spec.loader.exec_module(refresh)


def pve(template_id, move_type, power, energy, duration_ms, movement_id=None):
    settings = {
        "pokemonType": move_type,
        "power": power,
        "energyDelta": energy,
        "durationMs": duration_ms,
    }
    if movement_id is not None:
        settings["movementId"] = movement_id
    return {
        "templateId": template_id,
        "data": {"moveSettings": settings},
    }


def pvp(template_id, unique_id, move_type, power, energy, duration_turns=None):
    settings = {
        "uniqueId": unique_id,
        "type": move_type,
        "power": power,
        "energyDelta": energy,
    }
    if duration_turns is not None:
        settings["durationTurns"] = duration_turns
    return {"templateId": template_id, "data": {"combatMove": settings}}


class GameMasterPvPMoveTests(unittest.TestCase):
    def test_pairs_fast_and_charged_pvp_stats_with_pve_moves(self):
        game_master = [
            pve("V0214_MOVE_VINE_WHIP_FAST", "POKEMON_TYPE_GRASS", 7, 7, 600),
            pvp(
                "COMBAT_V0214_MOVE_VINE_WHIP_FAST",
                "VINE_WHIP_FAST",
                "POKEMON_TYPE_GRASS",
                5,
                8,
                1,
            ),
            pve("V0090_MOVE_SLUDGE_BOMB", "POKEMON_TYPE_POISON", 80, -50, 2300),
            pvp(
                "COMBAT_V0090_MOVE_SLUDGE_BOMB",
                "SLUDGE_BOMB",
                "POKEMON_TYPE_POISON",
                80,
                -50,
            ),
        ]

        moves = refresh.build_game_master_moves(game_master)

        vine_whip = moves["vinewhip:grass"]
        self.assertEqual((vine_whip.pvp_power, vine_whip.pvp_energy, vine_whip.pvp_turns), (5, 8, 2))

        sludge_bomb = moves["sludgebomb:poison"]
        self.assertEqual(
            (sludge_bomb.pvp_power, sludge_bomb.pvp_energy, sludge_bomb.pvp_turns),
            (80, -50, 1),
        )

    def test_missing_fast_duration_is_one_turn(self):
        game_master = [
            pve("V0200_MOVE_FURY_CUTTER_FAST", "POKEMON_TYPE_BUG", 3, 6, 300),
            pvp(
                "COMBAT_V0200_MOVE_FURY_CUTTER_FAST",
                "FURY_CUTTER_FAST",
                "POKEMON_TYPE_BUG",
                3,
                4,
            ),
        ]

        move = refresh.build_game_master_moves(game_master)["furycutter:bug"]
        self.assertEqual(move.pvp_turns, 1)

    def test_numeric_unique_id_falls_back_to_combat_template_token(self):
        game_master = [
            pve("V0482_MOVE_DYNAMAX_CANNON", "POKEMON_TYPE_DRAGON", 215, -100, 3600),
            pvp(
                "COMBAT_V0482_MOVE_DYNAMAX_CANNON",
                482,
                "POKEMON_TYPE_DRAGON",
                80,
                -45,
            ),
        ]

        move = refresh.build_game_master_moves(game_master)["dynamaxcannon:dragon"]
        self.assertEqual((move.pvp_power, move.pvp_energy, move.pvp_turns), (80, -45, 1))

    def test_preserves_null_pvp_stats_when_no_combat_move_exists(self):
        moves = refresh.build_game_master_moves(
            [pve("V0328_MOVE_HORN_DRILL", "POKEMON_TYPE_NORMAL", 9000, -100, 3500)]
        )

        move = moves["horndrill:normal"]
        self.assertIsNone(move.pvp_power)
        self.assertIsNone(move.pvp_energy)
        self.assertIsNone(move.pvp_turns)

    def test_builds_current_and_elite_move_pools_from_typed_moves(self):
        game_master = [
            pve(
                "V0214_MOVE_VINE_WHIP_FAST",
                "POKEMON_TYPE_GRASS",
                7,
                7,
                600,
                "214",
            ),
            pvp(
                "COMBAT_V0214_MOVE_VINE_WHIP_FAST",
                "VINE_WHIP_FAST",
                "POKEMON_TYPE_GRASS",
                5,
                8,
                1,
            ),
            pve("V0090_MOVE_SLUDGE_BOMB", "POKEMON_TYPE_POISON", 80, -50, 2300),
            pvp(
                "COMBAT_V0090_MOVE_SLUDGE_BOMB",
                "SLUDGE_BOMB",
                "POKEMON_TYPE_POISON",
                80,
                -50,
            ),
            pve("V0131_MOVE_FRENZY_PLANT", "POKEMON_TYPE_GRASS", 100, -50, 2600),
            pvp(
                "COMBAT_V0131_MOVE_FRENZY_PLANT",
                "FRENZY_PLANT",
                "POKEMON_TYPE_GRASS",
                100,
                -45,
            ),
            {
                "templateId": "V0003_POKEMON_VENUSAUR",
                "data": {
                    "pokemonSettings": {
                        "pokemonId": "VENUSAUR",
                        "quickMoves": [214],
                        "cinematicMoves": ["SLUDGE_BOMB"],
                        "eliteCinematicMove": ["FRENZY_PLANT"],
                    }
                },
            },
        ]

        moves = refresh.build_game_master_moves(game_master)
        pools = refresh.build_game_master_pools(game_master, moves)
        pool = pools["3:"]

        self.assertEqual(
            pool.current_move_keys,
            frozenset({"vinewhip:grass", "sludgebomb:poison"}),
        )
        self.assertEqual(pool.elite_move_keys, frozenset({"frenzyplant:grass"}))

    def test_normalizes_regional_form_pool_keys(self):
        game_master = [
            pve("V0200_MOVE_FURY_CUTTER_FAST", "POKEMON_TYPE_BUG", 3, 6, 300),
            {
                "templateId": "V0027_POKEMON_SANDSHREW_ALOLA",
                "data": {
                    "pokemonSettings": {
                        "pokemonId": "SANDSHREW",
                        "form": "SANDSHREW_ALOLAN",
                        "quickMoves": ["FURY_CUTTER_FAST"],
                    }
                },
            },
        ]

        moves = refresh.build_game_master_moves(game_master)
        pools = refresh.build_game_master_pools(game_master, moves)

        self.assertIn("27:alola", pools)


if __name__ == "__main__":
    unittest.main()
