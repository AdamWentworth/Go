from __future__ import annotations

import unittest

from generate_pvpoke_parity_fixture import (
    first_by_species_id,
    stratified_candidates,
)


class GeneratePvPokeParityFixtureTest(unittest.TestCase):
    def test_stratified_candidates_cover_top_middle_and_bottom(self) -> None:
        rankings = [{"speciesId": f"fighter-{index}"} for index in range(100)]

        sampled = stratified_candidates(rankings, 10)
        sampled_ids = [row["speciesId"] for row in sampled]

        self.assertEqual(sampled_ids[:5], [f"fighter-{index}" for index in range(5)])
        self.assertIn("fighter-59", sampled_ids)
        self.assertEqual(sampled_ids[-1], "fighter-99")

    def test_duplicate_overrides_follow_pvpoke_first_match_semantics(self) -> None:
        rows = [
            {"speciesId": "moltres_galarian", "editorScore": 90},
            {"speciesId": "moltres_galarian", "weight": 1},
        ]

        indexed = first_by_species_id(rows)

        self.assertEqual(indexed["moltres_galarian"]["editorScore"], 90)
        self.assertNotIn("weight", indexed["moltres_galarian"])


if __name__ == "__main__":
    unittest.main()
