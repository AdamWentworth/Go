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


if __name__ == "__main__":
    unittest.main()
