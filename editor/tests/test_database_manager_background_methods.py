import shutil
import tempfile
import unittest
from pathlib import Path

import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from database_manager import DatabaseManager


SOURCE_DB = ROOT_DIR / "pokemon" / "data" / "pokego.db"


class DatabaseManagerBackgroundMethodsTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_db_path = Path(self.temp_dir.name) / "pokego_test.db"
        shutil.copy2(SOURCE_DB, self.test_db_path)
        self.db_manager = DatabaseManager(str(self.test_db_path))

    def tearDown(self):
        self.db_manager.conn.close()
        self.temp_dir.cleanup()

    def _scalar(self, query, params=()):
        cursor = self.db_manager.conn.get_cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return row[0] if row else None

    def test_fetch_all_backgrounds_returns_data(self):
        rows = self.db_manager.fetch_all_backgrounds()
        self.assertGreater(len(rows), 0)
        self.assertEqual(len(rows[0]), 5)

    def test_fetch_pokemon_background_rows_returns_data(self):
        pokemon_id = self._scalar("SELECT pokemon_id FROM pokemon_backgrounds LIMIT 1")
        rows = self.db_manager.fetch_pokemon_background_rows(pokemon_id)
        self.assertGreater(len(rows), 0)
        self.assertEqual(rows[0][1], pokemon_id)

    def test_wrapper_round_trip_create_link_update_and_delete(self):
        background_id = self.db_manager.add_background(
            "Wrapper BG",
            "Wrapper Loc",
            "/images/backgrounds/wrapper_bg.png",
            "2026-03-04",
        )

        link_row_id = self.db_manager.add_pokemon_background_link(1, background_id, None)
        self.db_manager.update_background(
            background_id,
            "Wrapper BG Updated",
            "Wrapper Loc Updated",
            "/images/backgrounds/wrapper_bg_updated.png",
            "2026-03-05",
        )
        self.db_manager.update_pokemon_background_link(link_row_id, background_id, 123)

        usage_count = self.db_manager.count_background_usage(background_id)
        self.assertEqual(usage_count, 1)

        self.db_manager.delete_pokemon_background_link(link_row_id)
        usage_after_unlink = self.db_manager.count_background_usage(background_id)
        self.assertEqual(usage_after_unlink, 0)

        self.db_manager.delete_background(background_id)
        bg_exists = self._scalar(
            "SELECT COUNT(*) FROM backgrounds WHERE background_id = ?",
            (background_id,),
        )
        self.assertEqual(bg_exists, 0)


if __name__ == "__main__":
    unittest.main()
