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


SOURCE_DB = ROOT_DIR / "pokemon" / "data" / "pokego.db"


class TempDBTestCase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_db_path = Path(self.temp_dir.name) / "pokego_test.db"
        shutil.copy2(SOURCE_DB, self.test_db_path)

        self.db_connection = DatabaseConnection(str(self.test_db_path))

    def tearDown(self):
        self.db_connection.close()
        self.temp_dir.cleanup()

    def scalar(self, query, params=()):
        cursor = self.db_connection.get_cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return row[0] if row else None

    def row(self, query, params=()):
        cursor = self.db_connection.get_cursor()
        cursor.execute(query, params)
        return cursor.fetchone()

    def rows(self, query, params=()):
        cursor = self.db_connection.get_cursor()
        cursor.execute(query, params)
        return cursor.fetchall()
