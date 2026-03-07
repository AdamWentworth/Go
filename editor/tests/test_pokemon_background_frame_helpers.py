import unittest
from pathlib import Path
from unittest.mock import Mock
import sys
from types import SimpleNamespace


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from frames.pokemon_background_frame import PokemonBackgroundFrame


class PokemonBackgroundFrameHelperTests(unittest.TestCase):
    def setUp(self):
        self.frame = PokemonBackgroundFrame.__new__(PokemonBackgroundFrame)
        self.frame.details_window = type(
            "DetailsWindowStub",
            (),
            {"pokemon_data": [25, "Pikachu", 25, "/images/default/pokemon_25.png", "/images/shiny/shiny_pokemon_25.png"]},
        )()
        self.frame.costume_by_id = {
            317: (
                317,
                25,
                "leaf",
                1,
                None,
                None,
                "/images/costumes/pokemon_25_leaf_default.png",
                "/images/costumes_shiny/pokemon_25_leaf_shiny.png",
                "/images/female/costumes/female_pokemon_25_leaf_default.png",
                "",
            )
        }
        self.frame.costume_entry_refreshers = {}
        self.frame.active_costume_entry = None
        self.frame.background_order_var = type("Var", (), {"get": lambda self: "Background ID"})()

    def test_parse_selected_background_id_returns_integer_prefix(self):
        self.assertEqual(self.frame._parse_selected_background_id("83: Pokelid Aichi"), 83)

    def test_parse_selected_background_id_rejects_invalid_values(self):
        self.assertIsNone(self.frame._parse_selected_background_id(""))
        self.assertIsNone(self.frame._parse_selected_background_id("Pokelid Aichi"))

    def test_parse_optional_int_returns_none_for_blank_or_invalid_values(self):
        self.assertIsNone(self.frame._parse_optional_int(""))
        self.assertIsNone(self.frame._parse_optional_int("abc"))

    def test_parse_optional_int_accepts_whole_numbers(self):
        self.assertEqual(self.frame._parse_optional_int(" 268 "), 268)

    def test_normalize_rel_path_normalizes_backslashes_and_leading_slashes(self):
        self.assertEqual(
            self.frame._normalize_rel_path("\\images\\backgrounds\\honolulu.png"),
            "/images/backgrounds/honolulu.png",
        )

    def test_filename_from_url_or_name_prefers_sanitized_url_stem(self):
        filename = self.frame._filename_from_url_or_name(
            "https://example.com/media/Location Background (Honolulu).png?rev=1",
            "Ignored Name",
        )
        self.assertEqual(filename, "Location_Background_Honolulu.png")

    def test_filename_from_url_or_name_falls_back_to_background_name(self):
        filename = self.frame._filename_from_url_or_name("", "MLB New York Mets")
        self.assertEqual(filename, "mlb_new_york_mets.png")

    def test_resolve_background_save_relative_path_keeps_existing_local_relative_path(self):
        relative_path = self.frame._resolve_background_save_relative_path(
            "/images/backgrounds/Location_Background_Honolulu.png",
            "https://example.com/ignored.png",
            21,
            "Honolulu",
        )
        self.assertEqual(relative_path, "/images/backgrounds/Location_Background_Honolulu.png")

    def test_resolve_background_save_relative_path_uses_background_id_for_existing_background(self):
        relative_path = self.frame._resolve_background_save_relative_path(
            "https://example.com/remote.png",
            "https://example.com/remote.png",
            21,
            "Honolulu",
        )
        self.assertEqual(relative_path, "/images/backgrounds/background_21.png")

    def test_resolve_background_save_relative_path_uses_sanitized_filename_for_new_background(self):
        relative_path = self.frame._resolve_background_save_relative_path(
            "",
            "https://example.com/media/Pokelid_Fukuoka.png?cb=1",
            None,
            "Pokelid Fukuoka",
        )
        self.assertEqual(relative_path, "/images/backgrounds/Pokelid_Fukuoka.png")

    def test_get_costume_preview_paths_prefers_regular_then_female_then_shiny(self):
        preview_paths = self.frame._get_costume_preview_paths(self.frame.costume_by_id[317])
        self.assertEqual(
            preview_paths,
            [
                "/images/costumes/pokemon_25_leaf_default.png",
                "/images/female/costumes/female_pokemon_25_leaf_default.png",
                "/images/costumes_shiny/pokemon_25_leaf_shiny.png",
            ],
        )

    def test_describe_costume_id_value_returns_label_and_primary_preview_for_known_costume(self):
        description, preview_path = self.frame._describe_costume_id_value("317")
        self.assertEqual(description, "317: leaf")
        self.assertEqual(preview_path, "/images/costumes/pokemon_25_leaf_default.png")

    def test_describe_costume_id_value_handles_blank_invalid_and_missing_ids(self):
        self.assertEqual(
            self.frame._describe_costume_id_value(""),
            ("No costume link", "/images/default/pokemon_25.png"),
        )
        self.assertEqual(self.frame._describe_costume_id_value("abc"), ("Invalid costume ID: abc", None))
        self.assertEqual(self.frame._describe_costume_id_value("999"), ("Costume ID 999 not found", None))

    def test_populate_active_costume_entry_fills_field_and_refreshes_preview(self):
        class FakeEntry:
            def __init__(self):
                self.value = ""
                self.focused = False
                self.cursor = None

            def delete(self, _start, _end):
                self.value = ""

            def insert(self, _index, value):
                self.value = str(value)

            def focus_set(self):
                self.focused = True

            def icursor(self, index):
                self.cursor = index

            def winfo_exists(self):
                return True

        entry = FakeEntry()
        calls = []
        self.frame.active_costume_entry = entry
        self.frame.costume_entry_refreshers[entry] = lambda: calls.append("refreshed")

        self.frame._populate_active_costume_entry(317)

        self.assertEqual(entry.value, "317")
        self.assertTrue(entry.focused)
        self.assertEqual(calls, ["refreshed"])

    def test_is_location_specific_background_uses_location_asset_prefix(self):
        self.assertTrue(
            self.frame._is_location_specific_background(
                {"image_url": "/images/backgrounds/Location_Background_Honolulu.png", "location": ""}
            )
        )

    def test_is_location_specific_background_uses_location_text_as_fallback(self):
        self.assertTrue(
            self.frame._is_location_specific_background(
                {"image_url": "/images/backgrounds/Special_Background_GoFest2025.png", "location": "Osaka, Japan"}
            )
        )
        self.assertFalse(
            self.frame._is_location_specific_background(
                {"image_url": "/images/backgrounds/Special_Background_GoFest2025.png", "location": ""}
            )
        )

    def test_sort_background_records_can_group_location_specific_first(self):
        class Var:
            def get(self):
                return "Location First"

        self.frame.background_order_var = Var()
        rows = [
            (20, "Special", "", "/images/backgrounds/Special_Background_GoFest2025.png", "2025-06-28"),
            (10, "Honolulu", "Honolulu - Hawaii", "/images/backgrounds/Location_Background_Honolulu.png", "2024-08-16"),
            (11, "Jakarta", "Jakarta", "/images/backgrounds/Location_Background_Jakarta.png", "2024-09-21"),
        ]

        ordered = self.frame._sort_background_records(rows)

        self.assertEqual([row[0] for row in ordered], [10, 11, 20])

    def test_sort_background_records_can_sort_by_date(self):
        class Var:
            def get(self):
                return "Date"

        self.frame.background_order_var = Var()
        rows = [
            (20, "Special", "", "/images/backgrounds/Special_Background_GoFest2025.png", "2025-06-28"),
            (10, "Honolulu", "Honolulu - Hawaii", "/images/backgrounds/Location_Background_Honolulu.png", "2024-08-16"),
            (11, "Jakarta", "Jakarta", "/images/backgrounds/Location_Background_Jakarta.png", "2024-09-21"),
            (21, "Undated", "", "/images/backgrounds/Special_Background_Undated.png", ""),
        ]

        ordered = self.frame._sort_background_records(rows)

        self.assertEqual([row[0] for row in ordered], [10, 11, 20, 21])

    def test_sort_background_records_can_group_special_backgrounds_first(self):
        class Var:
            def get(self):
                return "Special First"

        self.frame.background_order_var = Var()
        rows = [
            (20, "Special", "", "/images/backgrounds/Special_Background_GoFest2025.png", "2025-06-28"),
            (10, "Honolulu", "Honolulu - Hawaii", "/images/backgrounds/Location_Background_Honolulu.png", "2024-08-16"),
            (11, "Jakarta", "Jakarta", "/images/backgrounds/Location_Background_Jakarta.png", "2024-09-21"),
        ]

        ordered = self.frame._sort_background_records(rows)

        self.assertEqual([row[0] for row in ordered], [20, 10, 11])

    def test_run_with_preserved_viewport_uses_details_window_helper_when_available(self):
        preserve = Mock(side_effect=lambda callback: callback())
        self.frame.details_window = type("DetailsWindowStub", (), {"preserve_scroll_position": preserve})()

        result = self.frame._run_with_preserved_viewport(lambda: "ok")

        self.assertEqual(result, "ok")
        preserve.assert_called_once()

    def test_run_with_preserved_viewport_falls_back_to_direct_callback(self):
        self.frame.details_window = object()

        self.assertEqual(self.frame._run_with_preserved_viewport(lambda: "ok"), "ok")

    def test_bind_costume_entry_uses_widget_objects_not_string_keys(self):
        class FakeWidget:
            def __init__(self, value=""):
                self.value = value

            def __str__(self):
                return "shared-widget-name"

            def bind(self, *_args, **_kwargs):
                return None

            def get(self):
                return self.value

            def winfo_exists(self):
                return True

        widget_a = FakeWidget("317")
        widget_b = FakeWidget("999")
        preview_label = object()
        description_label = object()
        self.frame._update_costume_entry_preview = Mock()

        self.frame._bind_costume_entry(widget_a, preview_label, description_label)
        self.frame._bind_costume_entry(widget_b, preview_label, description_label)

        self.assertEqual(len(self.frame.costume_entry_refreshers), 2)
        self.assertIn(widget_a, self.frame.costume_entry_refreshers)
        self.assertIn(widget_b, self.frame.costume_entry_refreshers)

    def test_clear_destroyed_link_row_state_removes_stale_widget_entries(self):
        class FakeWidget:
            def __init__(self, exists):
                self.exists = exists

            def winfo_exists(self):
                return self.exists

        stale_widget = FakeWidget(False)
        live_widget = FakeWidget(True)

        self.frame.costume_entry_refreshers = {
            stale_widget: lambda: None,
            live_widget: lambda: None,
        }
        self.frame.preview_after_ids = {
            stale_widget: "after-1",
            live_widget: "after-2",
        }
        self.frame.after_cancel = Mock()
        self.frame.active_costume_entry = stale_widget

        self.frame._clear_destroyed_link_row_state()

        self.assertEqual(list(self.frame.costume_entry_refreshers.keys()), [live_widget])
        self.assertEqual(list(self.frame.preview_after_ids.keys()), [live_widget])
        self.frame.after_cancel.assert_called_once_with("after-1")
        self.assertIsNone(self.frame.active_costume_entry)

    def test_change_link_page_rerenders_current_page_without_full_refresh(self):
        self.frame.all_link_rows = [(row_id, 25, row_id, None, f"BG {row_id}", "", "", "") for row_id in range(1, 30)]
        self.frame.link_filter_var = SimpleNamespace(get=lambda: "")
        self.frame.link_page_index = 0
        self.frame.LINK_PAGE_SIZE = 12
        self.frame._sort_link_rows = Mock(side_effect=lambda rows: list(rows))
        self.frame._run_with_preserved_viewport = Mock(side_effect=lambda callback: callback())
        self.frame._render_link_rows = Mock()

        self.frame._change_link_page(1)

        self.assertEqual(self.frame.link_page_index, 1)
        self.frame._render_link_rows.assert_called_once()

    def test_save_link_row_preserves_current_page_index(self):
        class FakeEntry:
            def __init__(self, value):
                self.value = value

            def get(self):
                return self.value

        self.frame.db_manager = Mock()
        self.frame.details_window = SimpleNamespace(window=object())
        self.frame.link_page_index = 7
        self.frame.refresh = Mock()
        self.frame._parse_selected_background_id = Mock(return_value=83)

        field_entries = {
            "name": FakeEntry("Pokelid Fukuoka"),
            "location": FakeEntry("Fukuoka, Japan"),
            "image_url": FakeEntry("/images/backgrounds/pokelid_fukuoka.png"),
            "date": FakeEntry("2025-11-07"),
        }

        self.frame._save_link_row(218, SimpleNamespace(get=lambda: "83: Pokelid Fukuoka"), FakeEntry(""), field_entries)

        self.frame.db_manager.update_background.assert_called_once_with(
            83,
            "Pokelid Fukuoka",
            "Fukuoka, Japan",
            "/images/backgrounds/pokelid_fukuoka.png",
            "2025-11-07",
        )
        self.frame.db_manager.update_pokemon_background_link.assert_called_once_with(218, 83, None)
        self.frame.refresh.assert_called_once_with(preserve_link_row_id=218, preserve_page_index=7)


if __name__ == "__main__":
    unittest.main()
