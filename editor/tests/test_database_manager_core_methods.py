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


class DatabaseManagerCoreMethodsTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_db_path = Path(self.temp_dir.name) / "pokego_test.db"
        shutil.copy2(SOURCE_DB, self.test_db_path)
        self.db_manager = DatabaseManager(str(self.test_db_path))

    def tearDown(self):
        self.db_manager.conn.close()
        self.temp_dir.cleanup()

    def scalar(self, query, params=()):
        cursor = self.db_manager.conn.get_cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return row[0] if row else None

    def test_fetch_type_ids_and_moves(self):
        type_ids = self.db_manager.fetch_type_ids()
        self.assertIn("Dragon", type_ids)
        self.assertIn("Normal", type_ids)

        fast_moves = self.db_manager.fetch_moves(1)
        charged_moves = self.db_manager.fetch_moves(0)
        self.assertGreater(len(fast_moves), 0)
        self.assertGreater(len(charged_moves), 0)

    def test_fetch_pokemon_and_fusion_details(self):
        pokemon_data, moves, evolutions = self.db_manager.fetch_pokemon_details(1)
        self.assertEqual(pokemon_data[0], 1)
        self.assertIsInstance(moves, list)
        self.assertIsInstance(evolutions, dict)

        fusion_id = self.scalar("SELECT fusion_id FROM fusion_pokemon LIMIT 1")
        fusion_data, fusion_moves = self.db_manager.fetch_fusion_details(fusion_id)
        self.assertIsNotNone(fusion_data)
        self.assertIsInstance(fusion_moves, list)

    def test_evolution_wrappers_add_update_remove(self):
        evolution_id = self.db_manager.add_evolves_to(10, 11)
        self.assertIsNotNone(evolution_id)

        self.db_manager.update_evolution_details(evolution_id, 12, 50, 0, None, "wrapper-test")
        rows = self.db_manager.fetch_evolution_details_for_evolves_to(10, 12)
        self.assertTrue(any(row[0] == evolution_id for row in rows))

        self.db_manager.remove_evolves_to(10, 12)
        exists = self.scalar(
            "SELECT COUNT(*) FROM pokemon_evolutions WHERE evolution_id = ?",
            (evolution_id,),
        )
        self.assertEqual(exists, 0)

    def test_shadow_wrapper_upsert(self):
        pokemon_id = self.scalar(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN shadow_pokemon sp ON sp.pokemon_id = p.pokemon_id
            WHERE sp.pokemon_id IS NULL
            LIMIT 1
            """
        )
        self.db_manager.update_shadow_pokemon_data(
            pokemon_id,
            {
                "Shiny Available": 1,
                "Apex": 0,
                "Date Available": "2026-03-01",
                "Date Shiny Available": "2026-03-02",
                "Image URL Shadow": "/images/shadow/wrapper.png",
                "Image URL Shiny Shadow": "/images/shadow/wrapper_shiny.png",
            },
        )
        row = self.db_manager.fetch_shadow_pokemon_data(pokemon_id)
        self.assertEqual(row[0], 1)
        self.assertEqual(row[4], "/images/shadow/wrapper.png")

    def test_max_and_size_wrappers(self):
        max_missing_id = self.scalar(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN max_pokemon mp ON mp.pokemon_id = p.pokemon_id
            WHERE mp.pokemon_id IS NULL
            LIMIT 1
            """
        )
        self.db_manager.insert_max_pokemon(max_missing_id)
        self.db_manager.update_max_pokemon(
            max_missing_id,
            (1, 1, "2026-03-10", "2026-03-11", "/images/max/a.png", "/images/max/b.png"),
        )
        max_row = self.db_manager.fetch_max_pokemon(max_missing_id)
        self.assertIsNotNone(max_row)
        self.assertEqual(max_row[1], 1)

        size_payload = (1.5, 2.5, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 5.1, 5.2, 5.3, 5.4)
        self.db_manager.update_size_data(max_missing_id, size_payload)
        size_row = self.db_manager.fetch_size_data(max_missing_id)
        self.assertEqual(tuple(size_row), size_payload)

    def test_costume_and_female_wrappers(self):
        pokemon_id = self.scalar("SELECT pokemon_id FROM costume_pokemon LIMIT 1")
        options = self.db_manager.fetch_costume_options(pokemon_id)
        self.assertGreater(len(options), 0)

        female_rows = self.db_manager.fetch_female_pokemon()
        self.assertGreater(len(female_rows), 0)


if __name__ == "__main__":
    unittest.main()
