import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import date
from io import StringIO
from pathlib import Path
from unittest.mock import patch


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from scripts.apply_base_release_roster import (  # noqa: E402
    BASE_RELEASE_FORMS,
    GAME_MASTER_REVISION,
    gender_rates_by_key,
    generation_for_dex,
    missing_normal_assets,
    main,
    pokemon_settings_by_key,
)


class BaseReleaseRosterTests(unittest.TestCase):
    def test_roster_covers_expected_species_and_unique_catalog_ids(self):
        dex_numbers = {entry.pokedex_number for entry in BASE_RELEASE_FORMS}
        pokemon_ids = [entry.pokemon_id for entry in BASE_RELEASE_FORMS]

        self.assertEqual(len(dex_numbers), 44)
        self.assertEqual(len(BASE_RELEASE_FORMS), 55)
        self.assertEqual(len(pokemon_ids), len(set(pokemon_ids)))
        self.assertSetEqual(
            dex_numbers,
            {
                679, 680, 681, 778, 807, 824, 825, 826, 837, 838, 839,
                843, 844, 852, 853, 859, 860, 872, 873, 876, 917, 918,
                931, 932, 933, 934, 940, 941, 948, 949, 950, 955, 956,
                968, 969, 970, 973, 977, 978, 982, 1011, 1012, 1013, 1019,
            },
        )

    def test_roster_uses_pinned_game_master_and_expected_generation_mapping(self):
        self.assertEqual(len(GAME_MASTER_REVISION), 40)
        self.assertEqual(generation_for_dex(807), 7)
        self.assertEqual(generation_for_dex(876), 8)
        self.assertEqual(generation_for_dex(931), 10)

    def test_roster_preserves_confirmed_honedge_line_release_date(self):
        release_dates = {
            entry.pokedex_number: entry.released_on
            for entry in BASE_RELEASE_FORMS
            if entry.pokedex_number in {679, 680, 681}
        }

        self.assertEqual(
            release_dates,
            {
                679: "2025-07-22",
                680: "2025-07-22",
                681: "2025-07-22",
            },
        )

    def test_roster_contains_no_future_release_dates_at_audit_cutoff(self):
        cutoff = date.fromisoformat("2026-07-26")

        self.assertTrue(
            all(date.fromisoformat(entry.released_on) <= cutoff for entry in BASE_RELEASE_FORMS)
        )
        self.assertEqual(max(entry.released_on for entry in BASE_RELEASE_FORMS), "2026-06-23")

    def test_game_master_indexes_default_and_explicit_forms(self):
        game_master = [
            {
                "templateId": "V0931_POKEMON_SQUAWKABILLY",
                "data": {"pokemonSettings": {"pokemonId": "SQUAWKABILLY", "stats": {"baseAttack": 1}}},
            },
            {
                "templateId": "V0931_POKEMON_SQUAWKABILLY_GREEN",
                "data": {
                    "pokemonSettings": {
                        "pokemonId": "SQUAWKABILLY",
                        "form": "SQUAWKABILLY_GREEN",
                        "stats": {"baseAttack": 2},
                    }
                },
            },
        ]

        indexed = pokemon_settings_by_key(game_master)

        self.assertEqual(indexed["931:"]["stats"]["baseAttack"], 1)
        self.assertEqual(indexed["931:green"]["stats"]["baseAttack"], 2)

    def test_gender_index_uses_catalog_gender_format(self):
        game_master = [
            {
                "templateId": "SPAWN_V0931_POKEMON_SQUAWKABILLY_GREEN",
                "data": {
                    "genderSettings": {
                        "pokemon": "SQUAWKABILLY",
                        "gender": {"malePercent": 0.5, "femalePercent": 0.5},
                    }
                },
            },
            {
                "templateId": "SPAWN_V1012_POKEMON_POLTCHAGEIST_ARTISAN",
                "data": {
                    "genderSettings": {
                        "pokemon": "POLTCHAGEIST",
                        "gender": {"genderlessPercent": 1.0},
                    }
                },
            },
        ]

        indexed = gender_rates_by_key(game_master)

        self.assertEqual(indexed["931:green"], "50M_50F_0GL")
        self.assertEqual(indexed["1012:artisan"], "0M_0F_100GL")

    def test_missing_asset_report_checks_every_authored_form(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            (root / "default").mkdir()
            first = BASE_RELEASE_FORMS[0]
            (root / "default" / f"pokemon_{first.pokemon_id}.png").write_bytes(b"png")

            missing = missing_normal_assets(root)

        self.assertEqual(len(missing), len(BASE_RELEASE_FORMS) - 1)
        self.assertNotIn(first, missing)

    def test_image_report_does_not_open_a_database_session(self):
        with tempfile.TemporaryDirectory() as temp_dir, patch(
            "scripts.apply_base_release_roster.load_game_master"
        ) as load_game_master:
            with redirect_stdout(StringIO()):
                result = main(["--report-images", "--asset-root", temp_dir])

        self.assertEqual(result, 0)
        load_game_master.assert_not_called()

    def test_publish_reports_missing_artwork_without_blocking_release_metadata(self):
        with tempfile.TemporaryDirectory() as temp_dir, patch(
            "scripts.apply_base_release_roster.load_game_master",
            return_value=[],
        ), patch(
            "scripts.apply_base_release_roster.open_catalog_connection",
        ) as open_connection, patch(
            "scripts.apply_base_release_roster.apply_roster",
        ) as apply_roster:
            open_connection.return_value.__enter__.return_value = object()
            output = StringIO()

            with redirect_stdout(output):
                result = main(
                    [
                        "--publish",
                        "--asset-root",
                        temp_dir,
                        "--database-url",
                        "postgresql://catalog.invalid/pokemon",
                    ]
                )

        self.assertEqual(result, 0)
        self.assertIn("frontend will use its standard Pokemon fallback image", output.getvalue())
        apply_roster.assert_called_once()


if __name__ == "__main__":
    unittest.main()
