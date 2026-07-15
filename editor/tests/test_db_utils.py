import unittest
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from database.db_utils import DatabaseConnection
from test_base import POSTGRES_URL, TempDBTestCase


class DatabaseConnectionTests(TempDBTestCase):
    def test_requires_a_postgresql_url(self):
        with self.assertRaisesRegex(ValueError, "PostgreSQL"):
            DatabaseConnection("/tmp/catalog.db")

    def test_qmark_adapter_preserves_legacy_boolean_scalars(self):
        cursor = self.db_connection.get_cursor()
        cursor.execute("SELECT ?::boolean, ?::boolean, ?::text", (True, False, "catalog"))
        self.assertEqual(cursor.fetchone(), (1, 0, "catalog"))

    def test_migration_owned_editor_indexes_exist(self):
        cursor = self.db_connection.get_cursor()
        cursor.execute(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'pokemon_catalog'
              AND indexname IN (
                'idx_costume_pokemon_pokemon_id',
                'idx_pokemon_backgrounds_pokemon_id',
                'idx_pokemon_backgrounds_background_id',
                'idx_pokemon_moves_pokemon_id'
              )
            """
        )
        self.assertEqual(len(cursor.fetchall()), 4)


if __name__ == "__main__":
    unittest.main()
