import unittest
from pathlib import Path
from unittest.mock import Mock, patch
import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from pokemon_details_window import PokemonDetailsWindow
from utils.image_cache import LocalImagePreviewCache


class _FakeWidget:
    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs
        self.pack_calls = []
        self.title_value = None
        self.lift_called = False
        self.after_idle_callbacks = []
        self.update_idletasks_called = False

    def pack(self, *args, **kwargs):
        self.pack_calls.append((args, kwargs))

    def title(self, value):
        self.title_value = value

    def lift(self):
        self.lift_called = True

    def after_idle(self, callback):
        self.after_idle_callbacks.append(callback)
        callback()

    def update_idletasks(self):
        self.update_idletasks_called = True


class _FakeCanvas:
    def __init__(self, x_fraction=0.0, y_fraction=0.0):
        self.x_fraction = x_fraction
        self.y_fraction = y_fraction
        self.x_moves = []
        self.y_moves = []

    def xview(self):
        return (self.x_fraction, min(self.x_fraction + 0.1, 1.0))

    def yview(self):
        return (self.y_fraction, min(self.y_fraction + 0.1, 1.0))

    def xview_moveto(self, value):
        self.x_moves.append(value)
        self.x_fraction = value

    def yview_moveto(self, value):
        self.y_moves.append(value)
        self.y_fraction = value


class _FakeFemaleImageFrame:
    calls = []

    def __init__(self, *args, **kwargs):
        type(self).calls.append((args, kwargs))
        self.frame = _FakeWidget()


class PokemonDetailsWindowTests(unittest.TestCase):
    def setUp(self):
        _FakeFemaleImageFrame.calls = []

    def _build_db_manager(self, female_data):
        db_manager = Mock()
        db_manager.fetch_shadow_pokemon_data.return_value = [None, None, None, None, None, None]
        db_manager.fetch_max_pokemon.return_value = None
        db_manager.fetch_size_data.return_value = None
        db_manager.fetch_type_ids.return_value = {}
        db_manager.fetch_pokemon_moves.return_value = []
        db_manager.fetch_female_pokemon_image_data.return_value = female_data
        db_manager.fetch_female_pokemon = Mock(side_effect=AssertionError("fetch_female_pokemon should not be called"))
        return db_manager

    def _details_tuple(self):
        pokemon_data = [25, "Pikachu", 25, "/images/default/pokemon_25.png", "/images/shiny/shiny_pokemon_25.png"]
        return pokemon_data, [], []

    def test_uses_targeted_female_lookup_and_skips_bulk_fetch(self):
        db_manager = self._build_db_manager(
            {
                "image_url": None,
                "shiny_image_url": None,
                "shadow_image_url": None,
                "shiny_shadow_image_url": None,
            }
        )

        with (
            patch("pokemon_details_window.create_scrollable_window", return_value=(_FakeWidget(), object(), _FakeWidget())),
            patch("pokemon_details_window.bind_scroll_events"),
            patch("pokemon_details_window.tk.Frame", _FakeWidget),
            patch("pokemon_details_window.tk.Button", _FakeWidget),
            patch.object(PokemonDetailsWindow, "create_info_and_moves_frames"),
            patch.object(PokemonDetailsWindow, "create_evolution_and_images_row"),
            patch.object(PokemonDetailsWindow, "create_size_frame"),
            patch.object(PokemonDetailsWindow, "create_shadow_row"),
            patch.object(PokemonDetailsWindow, "create_max_frame"),
            patch.object(PokemonDetailsWindow, "create_mega_frames"),
            patch.object(PokemonDetailsWindow, "create_costume_frame"),
            patch.object(PokemonDetailsWindow, "create_background_frame"),
            patch.object(PokemonDetailsWindow, "create_shadow_costume_frames"),
            patch("pokemon_details_window.PokemonFemaleImageFrame", _FakeFemaleImageFrame),
        ):
            window = PokemonDetailsWindow(object(), 25, self._details_tuple(), db_manager=db_manager)

        db_manager.fetch_female_pokemon_image_data.assert_called_once_with(25)
        db_manager.fetch_female_pokemon.assert_not_called()
        self.assertIsInstance(window.preview_cache, LocalImagePreviewCache)
        self.assertEqual(_FakeFemaleImageFrame.calls, [])

    def test_creates_female_frame_when_targeted_lookup_has_any_image(self):
        db_manager = self._build_db_manager(
            {
                "image_url": "/images/female/pokemon_25.png",
                "shiny_image_url": None,
                "shadow_image_url": None,
                "shiny_shadow_image_url": None,
            }
        )

        with (
            patch("pokemon_details_window.create_scrollable_window", return_value=(_FakeWidget(), object(), _FakeWidget())),
            patch("pokemon_details_window.bind_scroll_events"),
            patch("pokemon_details_window.tk.Frame", _FakeWidget),
            patch("pokemon_details_window.tk.Button", _FakeWidget),
            patch.object(PokemonDetailsWindow, "create_info_and_moves_frames"),
            patch.object(PokemonDetailsWindow, "create_evolution_and_images_row"),
            patch.object(PokemonDetailsWindow, "create_size_frame"),
            patch.object(PokemonDetailsWindow, "create_shadow_row"),
            patch.object(PokemonDetailsWindow, "create_max_frame"),
            patch.object(PokemonDetailsWindow, "create_mega_frames"),
            patch.object(PokemonDetailsWindow, "create_costume_frame"),
            patch.object(PokemonDetailsWindow, "create_background_frame"),
            patch.object(PokemonDetailsWindow, "create_shadow_costume_frames"),
            patch("pokemon_details_window.PokemonFemaleImageFrame", _FakeFemaleImageFrame),
        ):
            PokemonDetailsWindow(object(), 25, self._details_tuple(), db_manager=db_manager)

        self.assertEqual(len(_FakeFemaleImageFrame.calls), 1)
        args, _kwargs = _FakeFemaleImageFrame.calls[0]
        self.assertEqual(args[1], "/images/female/pokemon_25.png")
        self.assertEqual(args[2], "placeholder.png")
        self.assertEqual(args[3], "placeholder.png")
        self.assertEqual(args[4], "placeholder.png")
        self.assertEqual(args[5], 25)

    def test_capture_scroll_position_reads_canvas_view_fractions(self):
        window = PokemonDetailsWindow.__new__(PokemonDetailsWindow)
        window.canvas = _FakeCanvas(0.25, 0.6)

        self.assertEqual(window.capture_scroll_position(), (0.25, 0.6))

    def test_restore_scroll_position_moves_canvas_after_idle(self):
        window = PokemonDetailsWindow.__new__(PokemonDetailsWindow)
        window.window = _FakeWidget()
        window.canvas = _FakeCanvas()

        window.restore_scroll_position((0.4, 0.7))

        self.assertEqual(window.canvas.x_moves, [0.4])
        self.assertEqual(window.canvas.y_moves, [0.7])
        self.assertTrue(window.window.update_idletasks_called)

    def test_preserve_scroll_position_restores_after_callback(self):
        window = PokemonDetailsWindow.__new__(PokemonDetailsWindow)
        window.window = _FakeWidget()
        window.canvas = _FakeCanvas(0.15, 0.45)
        call_order = []

        def callback():
            call_order.append("callback")
            window.canvas.x_fraction = 0.9
            window.canvas.y_fraction = 0.95
            return "ok"

        result = window.preserve_scroll_position(callback)

        self.assertEqual(result, "ok")
        self.assertEqual(call_order, ["callback"])
        self.assertEqual(window.canvas.x_fraction, 0.15)
        self.assertEqual(window.canvas.y_fraction, 0.45)


if __name__ == "__main__":
    unittest.main()
