from __future__ import annotations

import unittest

import json

from import_pvpoke_rankings import (
    LocalPokemon,
    build_rows,
    structured_matchups,
    structured_move_usage,
)


class ImportPvPokeRankingsTest(unittest.TestCase):
    def test_structures_matchups_without_copying_editorial_content(self) -> None:
        ranking = {
            "matchups": [
                {"opponent": "azumarill", "rating": 731},
                {"opponent": "", "rating": 500},
            ],
            "editorNotes": "Source commentary is deliberately not imported.",
        }

        self.assertEqual(
            structured_matchups(ranking, "matchups"),
            [{"speciesId": "azumarill", "rating": 731.0}],
        )

    def test_structures_fast_and_charged_move_usage(self) -> None:
        ranking = {
            "moves": {
                "fastMoves": [{"moveId": "COUNTER", "uses": 120}],
                "chargedMoves": [{"moveId": "CLOSE_COMBAT", "uses": 84}],
            }
        }
        moves = {
            "COUNTER": {"name": "Counter", "type": "fighting"},
            "CLOSE_COMBAT": {"name": "Close Combat", "type": "fighting"},
        }

        self.assertEqual(
            structured_move_usage(ranking, moves),
            [
                {
                    "id": "COUNTER",
                    "name": "Counter",
                    "type": "fighting",
                    "kind": "fast",
                    "uses": 120,
                },
                {
                    "id": "CLOSE_COMBAT",
                    "name": "Close Combat",
                    "type": "fighting",
                    "kind": "charged",
                    "uses": 84,
                },
            ],
        )

    def test_build_rows_keeps_ranking_evidence_with_catalog_match(self) -> None:
        ranking = {
            "speciesId": "bulbasaur",
            "speciesName": "Bulbasaur",
            "score": 91.2,
            "rating": 704,
            "scores": [90, 91, 92, 93, 94, 95],
            "moveset": ["VINE_WHIP", "POWER_WHIP"],
            "matchups": [{"opponent": "lanturn", "rating": 722}],
            "counters": [{"opponent": "talonflame", "rating": 280}],
            "moves": {
                "fastMoves": [{"moveId": "VINE_WHIP", "uses": 50}],
                "chargedMoves": [{"moveId": "POWER_WHIP", "uses": 40}],
            },
            "stats": {"product": 1800, "atk": 110.1, "def": 120.2, "hp": 130},
        }
        species = {
            "speciesId": "bulbasaur",
            "speciesName": "Bulbasaur",
            "dex": 1,
            "released": True,
            "types": ["grass", "poison"],
            "defaultIVs": {"cp1500": [20, 0, 15, 15]},
        }
        moves = {
            "VINE_WHIP": {"name": "Vine Whip", "type": "grass"},
            "POWER_WHIP": {"name": "Power Whip", "type": "grass"},
        }
        pokemon = LocalPokemon(1, 1, "Bulbasaur", "", "/bulbasaur.png", None)

        rows, skipped = build_rows(
            "great",
            [ranking],
            {"bulbasaur": species},
            moves,
            {1: [pokemon]},
            [],
        )

        self.assertEqual(skipped, 0)
        self.assertEqual(len(rows[0]), 25)
        self.assertEqual(json.loads(rows[0][14]), [{"speciesId": "lanturn", "rating": 722.0}])
        self.assertEqual(json.loads(rows[0][15]), [{"speciesId": "talonflame", "rating": 280.0}])
        self.assertEqual(json.loads(rows[0][16])[0]["name"], "Vine Whip")


if __name__ == "__main__":
    unittest.main()
