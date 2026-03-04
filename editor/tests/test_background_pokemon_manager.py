import shutil
import tempfile
import unittest
from pathlib import Path

import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from database.db_utils import DatabaseConnection
from database.background_pokemon_manager import BackgroundPokemonManager


SOURCE_DB = ROOT_DIR / "pokemon" / "data" / "pokego.db"


class BackgroundPokemonManagerTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_db_path = Path(self.temp_dir.name) / "pokego_test.db"
        shutil.copy2(SOURCE_DB, self.test_db_path)

        self.db_connection = DatabaseConnection(str(self.test_db_path))
        self.manager = BackgroundPokemonManager(self.db_connection)

    def tearDown(self):
        self.db_connection.close()
        self.temp_dir.cleanup()

    def _scalar(self, query, params=()):
        cursor = self.db_connection.get_cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return row[0] if row else None

    def _row(self, query, params=()):
        cursor = self.db_connection.get_cursor()
        cursor.execute(query, params)
        return cursor.fetchone()

    def test_fetch_all_backgrounds_returns_sorted_rows(self):
        rows = self.manager.fetch_all_backgrounds()
        self.assertGreater(len(rows), 0)

        ids = [row[0] for row in rows]
        self.assertEqual(ids, sorted(ids))

    def test_fetch_pokemon_background_rows_returns_rows_for_known_pokemon(self):
        pokemon_id = self._scalar("SELECT pokemon_id FROM pokemon_backgrounds LIMIT 1")
        self.assertIsNotNone(pokemon_id)

        rows = self.manager.fetch_pokemon_background_rows(pokemon_id)
        self.assertGreater(len(rows), 0)

        first = rows[0]
        self.assertEqual(len(first), 8)
        self.assertEqual(first[1], pokemon_id)

    def test_add_background_persists_values(self):
        new_id = self.manager.add_background(
            "Unit Test Background",
            "Test Location",
            "/images/backgrounds/unit_test_background.png",
            "2026-03-04",
        )
        row = self._row(
            """
            SELECT name, location, image_url, date
            FROM backgrounds
            WHERE background_id = ?
            """,
            (new_id,),
        )
        self.assertEqual(
            row,
            (
                "Unit Test Background",
                "Test Location",
                "/images/backgrounds/unit_test_background.png",
                "2026-03-04",
            ),
        )

    def test_update_background_overwrites_values(self):
        new_id = self.manager.add_background(
            "Old Name",
            "Old Location",
            "/images/backgrounds/old.png",
            "2026-01-01",
        )

        self.manager.update_background(
            new_id,
            "New Name",
            "New Location",
            "/images/backgrounds/new.png",
            "2026-02-02",
        )

        row = self._row(
            """
            SELECT name, location, image_url, date
            FROM backgrounds
            WHERE background_id = ?
            """,
            (new_id,),
        )
        self.assertEqual(
            row,
            (
                "New Name",
                "New Location",
                "/images/backgrounds/new.png",
                "2026-02-02",
            ),
        )

    def test_add_update_delete_pokemon_background_link_round_trip(self):
        background_id_1 = self.manager.add_background(
            "Link A",
            "Loc A",
            "/images/backgrounds/link_a.png",
            "2026-03-01",
        )
        background_id_2 = self.manager.add_background(
            "Link B",
            "Loc B",
            "/images/backgrounds/link_b.png",
            "2026-03-02",
        )

        link_row_id = self.manager.add_pokemon_background_link(1, background_id_1, None)

        row = self._row(
            "SELECT pokemon_id, background_id, costume_id FROM pokemon_backgrounds WHERE rowid = ?",
            (link_row_id,),
        )
        self.assertEqual(row, (1, background_id_1, None))

        self.manager.update_pokemon_background_link(link_row_id, background_id_2, 25)
        updated_row = self._row(
            "SELECT pokemon_id, background_id, costume_id FROM pokemon_backgrounds WHERE rowid = ?",
            (link_row_id,),
        )
        self.assertEqual(updated_row, (1, background_id_2, 25))

        self.manager.delete_pokemon_background_link(link_row_id)
        deleted_row = self._row(
            "SELECT rowid FROM pokemon_backgrounds WHERE rowid = ?",
            (link_row_id,),
        )
        self.assertIsNone(deleted_row)

    def test_delete_background_removes_all_links(self):
        background_id = self.manager.add_background(
            "Delete Me",
            "Delete Location",
            "/images/backgrounds/delete_me.png",
            "2026-03-03",
        )
        self.manager.add_pokemon_background_link(1, background_id, None)
        self.manager.add_pokemon_background_link(2, background_id, 99)

        usage_before = self.manager.count_background_usage(background_id)
        self.assertEqual(usage_before, 2)

        self.manager.delete_background(background_id)

        usage_after = self.manager.count_background_usage(background_id)
        self.assertEqual(usage_after, 0)

        bg_row = self._row(
            "SELECT background_id FROM backgrounds WHERE background_id = ?",
            (background_id,),
        )
        self.assertIsNone(bg_row)


if __name__ == "__main__":
    unittest.main()
