import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from frames.pokemon_image_frame import PokemonImageFrame
from frames.pokemon_shiny_image_frame import PokemonShinyImageFrame


class _FakeWidget:
    def __init__(self, *args, **kwargs):
        self.config = {}

    def pack(self, *args, **kwargs):
        return None

    def configure(self, **kwargs):
        self.config.update(kwargs)


class PokemonImageFrameTests(unittest.TestCase):
    @patch("frames.pokemon_image_frame.ImageTk.PhotoImage", return_value=object())
    @patch("frames.pokemon_image_frame.Image.open", side_effect=FileNotFoundError)
    @patch("frames.pokemon_image_frame.tk.Button", _FakeWidget)
    @patch("frames.pokemon_image_frame.tk.Label", _FakeWidget)
    @patch("frames.pokemon_image_frame.tk.Frame", _FakeWidget)
    def test_default_frame_accepts_null_url_and_prepares_canonical_destination(
        self, _image_open, _photo_image
    ):
        frame = PokemonImageFrame(object(), None, 890, Mock())

        self.assertEqual(frame.catalog_image_url, "/images/default/pokemon_890.png")
        self.assertTrue(frame.full_image_path.endswith("/assets/images/default/pokemon_890.png"))

    @patch("frames.pokemon_image_frame.messagebox.showinfo")
    @patch("frames.pokemon_image_frame.ImageTk.PhotoImage", return_value=object())
    @patch("frames.pokemon_image_frame.Image.open", side_effect=FileNotFoundError)
    @patch("frames.pokemon_image_frame.tk.Button", _FakeWidget)
    @patch("frames.pokemon_image_frame.tk.Label", _FakeWidget)
    @patch("frames.pokemon_image_frame.tk.Frame", _FakeWidget)
    def test_saving_new_default_image_populates_pending_catalog_url(
        self, _image_open, _photo_image, _showinfo
    ):
        details_window = Mock()
        details_window.window = object()
        frame = PokemonImageFrame(object(), None, 890, details_window)
        image = Mock()

        with tempfile.TemporaryDirectory() as temp_dir:
            frame.full_image_path = str(Path(temp_dir) / "images" / "default" / "pokemon_890.png")
            frame.save_and_update_image(image)

        image.save.assert_called_once_with(frame.full_image_path)
        details_window.set_catalog_image_url.assert_called_once_with(
            "Image URL", "/images/default/pokemon_890.png"
        )

    @patch("frames.pokemon_shiny_image_frame.ImageTk.PhotoImage", return_value=object())
    @patch("frames.pokemon_shiny_image_frame.Image.open", side_effect=FileNotFoundError)
    @patch("frames.pokemon_shiny_image_frame.tk.Button", _FakeWidget)
    @patch("frames.pokemon_shiny_image_frame.tk.Label", _FakeWidget)
    @patch("frames.pokemon_shiny_image_frame.tk.Frame", _FakeWidget)
    def test_shiny_frame_accepts_null_url_without_reusing_default_destination(
        self, _image_open, _photo_image
    ):
        frame = PokemonShinyImageFrame(object(), None, 890, Mock())

        self.assertEqual(frame.catalog_image_url, "/images/shiny/shiny_pokemon_890.png")
        self.assertTrue(frame.full_image_path.endswith("/assets/images/shiny/shiny_pokemon_890.png"))

    @patch("frames.pokemon_shiny_image_frame.messagebox.showinfo")
    @patch("frames.pokemon_shiny_image_frame.ImageTk.PhotoImage", return_value=object())
    @patch("frames.pokemon_shiny_image_frame.Image.open", side_effect=FileNotFoundError)
    @patch("frames.pokemon_shiny_image_frame.tk.Button", _FakeWidget)
    @patch("frames.pokemon_shiny_image_frame.tk.Label", _FakeWidget)
    @patch("frames.pokemon_shiny_image_frame.tk.Frame", _FakeWidget)
    def test_saving_new_shiny_image_populates_shiny_catalog_url(
        self, _image_open, _photo_image, _showinfo
    ):
        details_window = Mock()
        details_window.window = object()
        frame = PokemonShinyImageFrame(object(), None, 890, details_window)
        combined_image = Mock()
        frame.combine_images = Mock(return_value=combined_image)

        with tempfile.TemporaryDirectory() as temp_dir:
            frame.full_image_path = str(Path(temp_dir) / "images" / "shiny" / "shiny_pokemon_890.png")
            frame.save_and_update_image(Mock())

        combined_image.save.assert_called_once_with(frame.full_image_path, "PNG")
        details_window.set_catalog_image_url.assert_called_once_with(
            "Image URL Shiny", "/images/shiny/shiny_pokemon_890.png"
        )


if __name__ == "__main__":
    unittest.main()
