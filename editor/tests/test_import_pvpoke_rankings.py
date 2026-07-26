from __future__ import annotations

import sys
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.append(str(REPO_ROOT / "pokemon" / "scripts"))

from import_pvpoke_rankings import (  # noqa: E402
    LocalFusion,
    LocalPokemon,
    RankingFormat,
    build_rows,
    match_local_species,
)


class PvPokeRankingImportTests(unittest.TestCase):
    def setUp(self):
        self.pokemon_by_dex = {
            38: [
                LocalPokemon(38, 38, "Ninetales", "", "/38.png", "/shadow-38.png"),
                LocalPokemon(2017, 38, "Ninetales", "Alolan", "/2017.png", "/shadow-2017.png"),
            ],
            778: [
                LocalPokemon(778, 778, "Mimikyu", "Busted", "/778.png", None),
                LocalPokemon(2269, 778, "Mimikyu", "Disguised", "/2269.png", None),
            ],
            888: [
                LocalPokemon(888, 888, "Zacian", "Crowned_sword", "/888.png", None),
                LocalPokemon(2290, 888, "Zacian", "Hero", "/2290.png", None),
            ],
        }
        self.fusions = [LocalFusion(1, "Black Kyurem", "/black-kyurem.png")]

    def test_matches_regional_and_shadow_forms_to_local_assets(self):
        match = match_local_species(
            {
                "dex": 38,
                "speciesId": "ninetales_alolan_shadow",
                "speciesName": "Ninetales (Alolan) (Shadow)",
            },
            self.pokemon_by_dex,
            self.fusions,
        )
        self.assertEqual(match.variant_kind, "shadow")
        self.assertEqual(match.pokemon_id, 2017)
        self.assertEqual(match.image_url, "/shadow-2017.png")

    def test_matches_parenthetical_default_and_crowned_forms(self):
        mimikyu = match_local_species(
            {"dex": 778, "speciesId": "mimikyu", "speciesName": "Mimikyu (Busted)"},
            self.pokemon_by_dex,
            self.fusions,
        )
        zacian = match_local_species(
            {
                "dex": 888,
                "speciesId": "zacian_crowned_sword",
                "speciesName": "Zacian (Crowned Sword)",
            },
            self.pokemon_by_dex,
            self.fusions,
        )
        self.assertEqual(mimikyu.pokemon_id, 778)
        self.assertEqual(zacian.variant_kind, "crown")
        self.assertEqual(zacian.pokemon_id, 888)

    def test_matches_supported_fusions(self):
        match = match_local_species(
            {"dex": 646, "speciesId": "kyurem_black", "speciesName": "Kyurem (Black)"},
            self.pokemon_by_dex,
            self.fusions,
        )
        self.assertEqual(match.variant_kind, "fusion")
        self.assertEqual(match.fusion_id, 1)

    def test_build_rows_filters_unreleased_and_preserves_recommended_iv_spread(self):
        species = {
            "ninetales_alolan": {
                "dex": 38,
                "speciesId": "ninetales_alolan",
                "speciesName": "Ninetales (Alolan)",
                "released": True,
                "types": ["ice", "fairy"],
                "defaultIVs": {"cp1500": [24, 5, 15, 15]},
            },
            "future": {
                "dex": 9999,
                "speciesId": "future",
                "speciesName": "Future",
                "released": False,
            },
        }
        rankings = [
            {
                "speciesId": "future",
                "moveset": ["TACKLE", "BODY_SLAM"],
                "score": 100,
                "rating": 900,
            },
            {
                "speciesId": "ninetales_alolan",
                "speciesName": "Ninetales (Alolan)",
                "moveset": ["POWDER_SNOW", "WEATHER_BALL_ICE", "DAZZLING_GLEAM"],
                "score": 92.4,
                "rating": 700,
                "scores": [90, 92],
                "stats": {"product": 1900, "atk": 110, "def": 120, "hp": 140},
            },
        ]
        moves = {
            "POWDER_SNOW": {"name": "Powder Snow", "type": "ice"},
            "WEATHER_BALL_ICE": {"name": "Weather Ball", "type": "ice"},
            "DAZZLING_GLEAM": {"name": "Dazzling Gleam", "type": "fairy"},
        }
        rows, skipped = build_rows(
            RankingFormat(
                key="great",
                league="great",
                title="Great League",
                cup="all",
                cp_limit=1500,
                iv_key="cp1500",
                rules=(),
                sort_order=0,
                is_cup=False,
            ),
            rankings,
            species,
            moves,
            self.pokemon_by_dex,
            self.fusions,
        )
        self.assertEqual(skipped, 1)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0][0:4], ("great", "great", 1, 2))
        self.assertEqual(rows[0][18:22], (24.0, 5, 15, 15))


if __name__ == "__main__":
    unittest.main()
