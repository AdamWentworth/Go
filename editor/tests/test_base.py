import unittest
from pathlib import Path
import sys
import os


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from database.db_utils import DatabaseConnection


POSTGRES_URL = os.environ.get("EDITOR_POSTGRES_TEST_URL", "")
FIXTURE_PATH = EDITOR_DIR / "tests" / "postgres_catalog_fixture.sql"


def reset_postgres_fixture(connection):
    """Reset the isolated PostgreSQL catalog to the small public test fixture."""
    cursor = connection.get_cursor()
    try:
        cursor.execute(
            """
            TRUNCATE TABLE
              pokemon_catalog.catalog_releases,
              pokemon_catalog.raid_bosses,
              pokemon_catalog.fusion_background_combo_rules,
              pokemon_catalog.crown_forms,
              pokemon_catalog.fusion_moveset,
              pokemon_catalog.fusion_cp_stats,
              pokemon_catalog.mega_cp_stats,
              pokemon_catalog.shadow_costume_pokemon,
              pokemon_catalog.pokemon_cp_stats,
              pokemon_catalog.pokemon_moves,
              pokemon_catalog.pokemon_evolutions,
              pokemon_catalog.pokemon_backgrounds,
              pokemon_catalog.pokemon_sizes,
              pokemon_catalog.max_pokemon,
              pokemon_catalog.mega_evolution,
              pokemon_catalog.fusion_pokemon,
              pokemon_catalog.shadow_pokemon,
              pokemon_catalog.female_pokemon,
              pokemon_catalog.costume_pokemon,
              pokemon_catalog.moves,
              pokemon_catalog.backgrounds,
              pokemon_catalog.pokemon,
              pokemon_catalog.cp_multipliers,
              pokemon_catalog.evolution_items,
              pokemon_catalog.types
            RESTART IDENTITY CASCADE
            """
        )
        for statement in FIXTURE_PATH.read_text(encoding="utf-8").split(";"):
            if statement.strip():
                cursor.execute(statement)
        connection.commit()
    finally:
        cursor.close()


class TempDBTestCase(unittest.TestCase):
    def setUp(self):
        if not POSTGRES_URL:
            self.skipTest("EDITOR_POSTGRES_TEST_URL is required for catalog editor tests")
        self.db_connection = DatabaseConnection(POSTGRES_URL)
        reset_postgres_fixture(self.db_connection)

    def tearDown(self):
        self.db_connection.close()

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
