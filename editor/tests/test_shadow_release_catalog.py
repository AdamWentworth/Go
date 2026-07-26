import sys
import unittest
from datetime import date
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from utils.shadow_release_catalog import (
    SHINY_SHADOW_RULE_DATE,
    catalog_asset_path,
    parse_shadow_source_wikitext,
    shiny_shadow_release_date,
)


class ShadowReleaseCatalogTests(unittest.TestCase):
    def test_legacy_windows_image_urls_resolve_under_assets(self):
        result = catalog_asset_path(
            Path("/repo"),
            r"\images\costumes_shiny\pokemon_54_holiday_shiny.png",
        )

        self.assertEqual(
            result,
            Path("/repo/assets/images/costumes_shiny/pokemon_54_holiday_shiny.png"),
        )

    def test_parser_handles_named_fields_before_stats_and_tooltip_dates(self):
        source = "\n".join(
            (
                "{{lop/shadow/GO|0443|Gible|shiny=yes|151|124|84|5|"
                "June 21, 2023|candy=Gible|catch=Cliff}}",
                "{{lop/shadow/GO|0150|Mewtwo|214|300|182|20|"
                "{{tt|June 26, 2020|Ticket holders}}|candy=Mewtwo}}",
                "{{lop/shadow/GO|0115|Kangaskhan|233|181|165|3|"
                "Unobtainable|candy=Kangaskhan}}",
            )
        )

        entries, excluded = parse_shadow_source_wikitext(source)

        self.assertEqual(
            [(entry.token, entry.released_on) for entry in entries],
            [
                ("0443", date(2023, 6, 21)),
                ("0150", date(2020, 6, 26)),
            ],
        )
        self.assertTrue(entries[0].source_marks_shiny)
        self.assertFalse(entries[1].source_marks_shiny)
        self.assertEqual(excluded, [("0115", "Kangaskhan", "Unobtainable")])

    def test_universal_rule_unlocks_existing_shiny_shadow_on_march_third(self):
        result = shiny_shadow_release_date(
            shadow_released_on=date(2024, 1, 1),
            shiny_released_on=date(2020, 1, 1),
            existing_shiny_shadow_date=None,
        )

        self.assertEqual(result, SHINY_SHADOW_RULE_DATE)

    def test_later_shadow_or_shiny_release_delays_eligibility(self):
        shadow_later = shiny_shadow_release_date(
            shadow_released_on=date(2026, 6, 25),
            shiny_released_on=date(2020, 1, 1),
            existing_shiny_shadow_date=None,
        )
        shiny_later = shiny_shadow_release_date(
            shadow_released_on=date(2025, 1, 1),
            shiny_released_on=date(2026, 7, 1),
            existing_shiny_shadow_date=None,
        )

        self.assertEqual(shadow_later, date(2026, 6, 25))
        self.assertEqual(shiny_later, date(2026, 7, 1))

    def test_valid_historical_shiny_shadow_date_is_preserved(self):
        result = shiny_shadow_release_date(
            shadow_released_on=date(2020, 1, 1),
            shiny_released_on=date(2019, 1, 1),
            existing_shiny_shadow_date=date(2021, 5, 18),
        )

        self.assertEqual(result, date(2021, 5, 18))

    def test_impossible_historical_date_is_repaired(self):
        result = shiny_shadow_release_date(
            shadow_released_on=date(2024, 1, 1),
            shiny_released_on=date(2025, 1, 1),
            existing_shiny_shadow_date=date(2023, 1, 1),
        )

        self.assertEqual(result, SHINY_SHADOW_RULE_DATE)


if __name__ == "__main__":
    unittest.main()
