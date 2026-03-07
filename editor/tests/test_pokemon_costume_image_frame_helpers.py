import unittest
from pathlib import Path
from unittest.mock import Mock, patch
import sys
from types import SimpleNamespace

from PIL import Image


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from frames.pokemon_costume_image_frame import PokemonCostumeImageFrame


class PokemonCostumeImageFrameHelperTests(unittest.TestCase):
    def setUp(self):
        self.frame = PokemonCostumeImageFrame.__new__(PokemonCostumeImageFrame)
        self.frame.img_root = str(ROOT_DIR / "assets")

    def test_entry_label_for_download_returns_regular_field_name(self):
        self.assertEqual(self.frame._entry_label_for_download(False, False), "Image URL")

    def test_entry_label_for_download_returns_shiny_field_name(self):
        self.assertEqual(self.frame._entry_label_for_download(True, False), "Shiny Image URL")

    def test_entry_label_for_download_returns_female_field_name(self):
        self.assertEqual(self.frame._entry_label_for_download(False, True), "Female Image URL")

    def test_entry_label_for_download_returns_shiny_female_field_name(self):
        self.assertEqual(self.frame._entry_label_for_download(True, True), "Shiny Female Image URL")

    def test_overlay_shiny_icon_returns_none_when_icon_cannot_be_loaded(self):
        with patch("frames.pokemon_costume_image_frame.Image.open", side_effect=FileNotFoundError):
            result = self.frame._overlay_shiny_icon(Image.new("RGBA", (24, 24), (255, 0, 0, 255)))
        self.assertIsNone(result)

    def test_run_with_preserved_viewport_uses_details_window_helper_when_available(self):
        preserve = Mock(side_effect=lambda callback: callback())
        self.frame.details_window = type("DetailsWindowStub", (), {"preserve_scroll_position": preserve})()

        result = self.frame._run_with_preserved_viewport(lambda: "ok")

        self.assertEqual(result, "ok")
        preserve.assert_called_once()

    def test_run_with_preserved_viewport_falls_back_to_direct_callback(self):
        self.frame.details_window = object()

        self.assertEqual(self.frame._run_with_preserved_viewport(lambda: "ok"), "ok")

    def test_save_existing_costume_preserves_current_page_index(self):
        class FakeEntry:
            def __init__(self, value):
                self.value = value

            def get(self):
                return self.value

        self.frame.db_manager = Mock()
        self.frame.details_window = SimpleNamespace(window=object())
        self.frame.page_index = 6
        self.frame.refresh = Mock()
        self.frame.costume_entries = {
            (317, "Costume Name"): FakeEntry("leaf"),
            (317, "Shiny Available"): FakeEntry("1"),
            (317, "Date Available"): FakeEntry("2024-01-01"),
            (317, "Date Shiny Available"): FakeEntry("2024-01-02"),
            (317, "Image URL"): FakeEntry("/images/costumes/pokemon_25_leaf_default.png"),
            (317, "Shiny Image URL"): FakeEntry("/images/costumes_shiny/pokemon_25_leaf_shiny.png"),
            (317, "Female Image URL"): FakeEntry("/images/female/costumes/female_pokemon_25_leaf_default.png"),
            (317, "Shiny Female Image URL"): FakeEntry("/images/female/costumes_shiny/female_pokemon_25_leaf_shiny.png"),
        }

        with patch("frames.pokemon_costume_image_frame.messagebox.showinfo"):
            self.frame._save_costume(317)

        self.frame.db_manager.update_pokemon_costume.assert_called_once()
        self.frame.refresh.assert_called_once_with(preserve_costume_id=317, preserve_page_index=6)


if __name__ == "__main__":
    unittest.main()
