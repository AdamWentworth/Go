from __future__ import annotations

import unittest

from scripts.apply_shiny_release_roster import (
    EXPECTED_TARGETS,
    SOURCE_REVISION,
    TARGETS,
    validate_roster,
)


class ShinyReleaseRosterTest(unittest.TestCase):
    def test_roster_is_unique_complete_and_asset_backed(self) -> None:
        validate_roster()
        self.assertEqual(len(TARGETS), EXPECTED_TARGETS)
        self.assertEqual(len({target.pokemon_id for target in TARGETS}), EXPECTED_TARGETS)

    def test_reviewed_cutoff_excludes_announced_future_releases(self) -> None:
        target_ids = {target.pokemon_id for target in TARGETS}
        self.assertNotIn(792, target_ids)  # Lunala: 2026-08-19
        self.assertNotIn(872, target_ids)  # Snom: 2026-08-04
        self.assertNotIn(827, target_ids)  # Nickit: 2026-08-16
        self.assertEqual(SOURCE_REVISION, 4594301)

    def test_form_specific_paldean_tauros_dates_are_preserved(self) -> None:
        dates = {
            target.pokemon_id: target.released_on
            for target in TARGETS
            if target.pokemon_id in {2342, 2343, 2344}
        }
        self.assertEqual(
            dates,
            {
                2342: "2026-06-11",
                2343: "2026-06-04",
                2344: "2026-05-24",
            },
        )


if __name__ == "__main__":
    unittest.main()
