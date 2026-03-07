import unittest
from pathlib import Path
import tempfile
import sqlite3
import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from database.db_utils import DatabaseConnection


class DatabaseConnectionTests(unittest.TestCase):
    def test_open_commit_and_close(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "temp.db"
            conn = DatabaseConnection(str(db_path))
            cur = conn.get_cursor()
            cur.execute("CREATE TABLE sample (id INTEGER PRIMARY KEY, name TEXT)")
            cur.execute("INSERT INTO sample (name) VALUES (?)", ("unit-test",))
            conn.commit()
            conn.close()

            check = sqlite3.connect(db_path)
            row = check.execute("SELECT name FROM sample WHERE id = 1").fetchone()
            check.close()

            self.assertEqual(row, ("unit-test",))

    def test_initializes_performance_indexes_for_editor_hot_paths(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "temp.db"
            raw = sqlite3.connect(db_path)
            raw.execute("CREATE TABLE costume_pokemon (pokemon_id INTEGER)")
            raw.execute("CREATE TABLE pokemon_backgrounds (pokemon_id INTEGER, background_id INTEGER, costume_id INTEGER)")
            raw.execute("CREATE TABLE pokemon_moves (pokemon_id INTEGER)")
            raw.execute("CREATE TABLE female_pokemon (pokemon_id INTEGER)")
            raw.commit()
            raw.close()

            conn = DatabaseConnection(str(db_path))
            cur = conn.get_cursor()

            costume_indexes = cur.execute("PRAGMA index_list('costume_pokemon')").fetchall()
            background_indexes = cur.execute("PRAGMA index_list('pokemon_backgrounds')").fetchall()
            pokemon_move_indexes = cur.execute("PRAGMA index_list('pokemon_moves')").fetchall()
            female_indexes = cur.execute("PRAGMA index_list('female_pokemon')").fetchall()

            conn.close()

            self.assertTrue(any("pokemon_id" in row[1] for row in costume_indexes))
            self.assertTrue(any("pokemon_id" in row[1] for row in background_indexes))
            self.assertTrue(any("background_id" in row[1] for row in background_indexes))
            self.assertTrue(any("pokemon_id" in row[1] for row in pokemon_move_indexes))
            self.assertTrue(any("pokemon_id" in row[1] for row in female_indexes))


if __name__ == "__main__":
    unittest.main()
