import os
import sys
import unittest
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from database_manager import DatabaseManager


POSTGRES_URL = os.environ.get("EDITOR_POSTGRES_TEST_URL", "")


@unittest.skipUnless(POSTGRES_URL, "EDITOR_POSTGRES_TEST_URL is not configured")
class PostgresDatabaseManagerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db_manager = DatabaseManager(POSTGRES_URL)
        if not cls.db_manager.conn.is_postgres:
            raise AssertionError("expected PostgreSQL editor target")

    @classmethod
    def tearDownClass(cls):
        cls.db_manager.conn.close()

    def scalar(self, query, params=()):
        cursor = self.db_manager.conn.get_cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        cursor.close()
        return row[0] if row else None

    def test_move_picker_accepts_integer_fast_flags_from_the_editor_ui(self):
        fast_moves = self.db_manager.fetch_moves(1)
        charged_moves = self.db_manager.fetch_moves(0)

        self.assertGreater(len(fast_moves), 0)
        self.assertGreater(len(charged_moves), 0)
        self.assertNotEqual(fast_moves, charged_moves)

    def test_reads_catalog_and_edits_generated_and_legacy_identifiers(self):
        self.assertEqual(self.db_manager.fetch_pokemon_name(1), "Bulbasaur")
        self.assertGreater(len(self.db_manager.fetch_all_pokemon_sorted("pokemon_id")), 0)
        self.assertGreater(len(self.db_manager.fetch_all_moves_sorted("move_id")), 0)

        dragon_type_id = self.scalar("SELECT type_id FROM types WHERE name = ?", ("Dragon",))
        move_id = None
        background_id = None
        link_id = None
        costume_id = None
        max_pokemon_id = None

        try:
            move_id = self.db_manager.add_move(
                None,
                (
                    "Editor PostgreSQL Test Move",
                    dragon_type_id,
                    10,
                    10,
                    10,
                    10,
                    1000,
                    1,
                    1,
                    None,
                    0,
                    0,
                    0,
                ),
            )
            self.assertEqual(self.db_manager.fetch_move_details(move_id)[1], "Editor PostgreSQL Test Move")
            self.db_manager.update_move(
                move_id,
                (
                    "Editor PostgreSQL Test Move Updated",
                    dragon_type_id,
                    11,
                    11,
                    11,
                    11,
                    900,
                    1,
                    0,
                    None,
                    0,
                    0,
                    0,
                ),
            )
            self.assertEqual(self.db_manager.fetch_move_details(move_id)[1], "Editor PostgreSQL Test Move Updated")

            background_id = self.db_manager.add_background(
                "Editor PostgreSQL Test Background",
                "Test",
                "/images/backgrounds/editor-postgres-test.png",
                "2026-07-14",
            )
            link_id = self.db_manager.add_pokemon_background_link(1, background_id, None)
            self.assertEqual(
                self.scalar("SELECT background_id FROM pokemon_backgrounds WHERE id = ?", (link_id,)),
                background_id,
            )
            self.db_manager.update_pokemon_background_link(link_id, background_id, None)

            costume_id = self.db_manager.add_costume(
                1,
                {
                    "costume_name": "Editor PostgreSQL Test Costume",
                    "shiny_available": 1,
                    "date_available": "2026-07-14",
                    "date_shiny_available": None,
                    "image_url_costume": "/images/costumes/editor-postgres-test.png",
                    "image_url_shiny_costume": None,
                    "image_url_costume_female": None,
                    "image_url_shiny_costume_female": None,
                },
            )
            self.assertTrue(
                self.scalar("SELECT shiny_available FROM costume_pokemon WHERE costume_id = ?", (costume_id,))
            )

            max_pokemon_id = self.scalar(
                """
                SELECT p.pokemon_id
                FROM pokemon p
                LEFT JOIN max_pokemon m ON m.pokemon_id = p.pokemon_id
                WHERE m.pokemon_id IS NULL
                LIMIT 1
                """
            )
            self.assertIsNotNone(max_pokemon_id)
            self.db_manager.insert_max_pokemon(max_pokemon_id)
            self.db_manager.update_max_pokemon(
                max_pokemon_id,
                (1, 0, "2026-07-14", "", "", ""),
            )
            self.assertTrue(self.db_manager.fetch_max_pokemon(max_pokemon_id)[1])
        finally:
            cursor = self.db_manager.conn.get_cursor()
            if link_id is not None:
                cursor.execute("DELETE FROM pokemon_backgrounds WHERE id = ?", (link_id,))
            if background_id is not None:
                cursor.execute("DELETE FROM backgrounds WHERE background_id = ?", (background_id,))
            if costume_id is not None:
                cursor.execute("DELETE FROM costume_pokemon WHERE costume_id = ?", (costume_id,))
            if move_id is not None:
                cursor.execute("DELETE FROM moves WHERE move_id = ?", (move_id,))
            if max_pokemon_id is not None:
                cursor.execute("DELETE FROM max_pokemon WHERE pokemon_id = ?", (max_pokemon_id,))
            self.db_manager.conn.commit()
            cursor.close()

    def test_updates_existing_catalog_records_and_movesets(self):
        pokemon_id = 1
        cursor = self.db_manager.conn.get_cursor()

        cursor.execute(
            """
            SELECT name, pokedex_number, image_url, image_url_shiny, sprite_url,
                   attack, defense, stamina, type_1_id, type_2_id, gender_rate,
                   rarity, form, generation, available, shiny_available,
                   shiny_rarity, date_available, date_shiny_available
            FROM pokemon
            WHERE pokemon_id = ?
            """,
            (pokemon_id,),
        )
        original_pokemon = list(cursor.fetchone())

        cursor.execute(
            """
            SELECT base_pokemon_id1, base_pokemon_id2, name, pokedex_number,
                   image_url, image_url_shiny, sprite_url, attack, defense,
                   stamina, type_1_id, type_2_id, generation, available,
                   shiny_available, shiny_rarity, date_available, date_shiny_available
            FROM fusion_pokemon
            ORDER BY fusion_id
            LIMIT 1
            """
        )
        fusion_data = cursor.fetchone()
        cursor.execute("SELECT fusion_id FROM fusion_pokemon ORDER BY fusion_id LIMIT 1")
        fusion_id = cursor.fetchone()[0]

        cursor.execute(
            "SELECT move_id, legacy FROM pokemon_moves WHERE pokemon_id = ? ORDER BY id",
            (pokemon_id,),
        )
        original_pokemon_moves = cursor.fetchall()
        cursor.execute(
            "SELECT move_id, legacy FROM fusion_moveset WHERE fusion_id = ? ORDER BY move_id",
            (fusion_id,),
        )
        original_fusion_moves = cursor.fetchall()

        cursor.execute("SELECT pokemon_id FROM pokemon_sizes ORDER BY pokemon_id LIMIT 1")
        sized_pokemon_id = cursor.fetchone()[0]
        original_size = tuple(self.db_manager.fetch_size_data(sized_pokemon_id))

        cursor.execute("SELECT pokemon_id FROM female_pokemon ORDER BY pokemon_id LIMIT 1")
        female_pokemon_id = cursor.fetchone()[0]
        original_female = self.db_manager.fetch_female_pokemon_image_data(female_pokemon_id)
        cursor.close()

        try:
            updated_pokemon = list(original_pokemon)
            updated_pokemon[0] = "Bulbasaur PostgreSQL Editor Test"
            self.db_manager.update_pokemon_data(pokemon_id, updated_pokemon)
            self.assertEqual(self.db_manager.fetch_pokemon_name(pokemon_id), updated_pokemon[0])

            self.assertGreater(len(original_pokemon_moves), 0)
            updated_pokemon_moves = list(original_pokemon_moves)
            updated_pokemon_moves[0] = (
                updated_pokemon_moves[0][0],
                not bool(updated_pokemon_moves[0][1]),
            )
            self.db_manager.update_pokemon_moves(pokemon_id, updated_pokemon_moves)
            self.assertEqual(
                self.scalar(
                    "SELECT legacy FROM pokemon_moves WHERE pokemon_id = ? AND move_id = ?",
                    (pokemon_id, updated_pokemon_moves[0][0]),
                ),
                updated_pokemon_moves[0][1],
            )

            self.assertGreater(len(original_fusion_moves), 0)
            updated_fusion = list(fusion_data)
            updated_fusion[2] = f"{updated_fusion[2]} PostgreSQL Editor Test"
            self.db_manager.update_fusion_data(fusion_id, updated_fusion)
            self.assertEqual(
                self.scalar("SELECT name FROM fusion_pokemon WHERE fusion_id = ?", (fusion_id,)),
                updated_fusion[2],
            )

            updated_fusion_moves = list(original_fusion_moves)
            updated_fusion_moves[0] = (
                updated_fusion_moves[0][0],
                not bool(updated_fusion_moves[0][1]),
            )
            self.db_manager.update_fusion_moveset(fusion_id, updated_fusion_moves)
            self.assertEqual(
                self.scalar(
                    "SELECT legacy FROM fusion_moveset WHERE fusion_id = ? AND move_id = ?",
                    (fusion_id, updated_fusion_moves[0][0]),
                ),
                updated_fusion_moves[0][1],
            )

            updated_size = tuple(float(value) + 0.001 for value in original_size)
            self.db_manager.update_size_data(sized_pokemon_id, updated_size)
            self.assertEqual(tuple(self.db_manager.fetch_size_data(sized_pokemon_id)), updated_size)

            self.db_manager.update_female_pokemon_images(
                female_pokemon_id,
                {"image_url": "/images/female/editor-postgres-test.png"},
            )
            self.assertEqual(
                self.db_manager.fetch_female_pokemon_image_data(female_pokemon_id)["image_url"],
                "/images/female/editor-postgres-test.png",
            )
        finally:
            self.db_manager.update_pokemon_data(pokemon_id, original_pokemon)
            self.db_manager.update_pokemon_moves(pokemon_id, original_pokemon_moves)
            self.db_manager.update_fusion_data(fusion_id, fusion_data)
            self.db_manager.update_fusion_moveset(fusion_id, original_fusion_moves)
            self.db_manager.update_size_data(sized_pokemon_id, original_size)
            self.db_manager.update_female_pokemon_images(female_pokemon_id, original_female)

    def test_creates_and_deletes_editor_relationship_records(self):
        cursor = self.db_manager.conn.get_cursor()
        cursor.execute(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN shadow_pokemon sp ON sp.pokemon_id = p.pokemon_id
            WHERE sp.pokemon_id IS NULL
            ORDER BY p.pokemon_id
            LIMIT 1
            """
        )
        shadow_pokemon_id = cursor.fetchone()[0]
        cursor.execute(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN max_pokemon mp ON mp.pokemon_id = p.pokemon_id
            WHERE mp.pokemon_id IS NULL
            ORDER BY p.pokemon_id
            LIMIT 1
            """
        )
        max_pokemon_id = cursor.fetchone()[0]
        cursor.execute(
            """
            SELECT p.pokemon_id
            FROM pokemon p
            LEFT JOIN mega_evolution m ON m.pokemon_id = p.pokemon_id
            WHERE m.pokemon_id IS NULL
            ORDER BY p.pokemon_id
            LIMIT 1
            """
        )
        mega_pokemon_id = cursor.fetchone()[0]
        cursor.execute("SELECT fusion_id FROM fusion_pokemon ORDER BY fusion_id LIMIT 1")
        fusion_id = cursor.fetchone()[0]
        cursor.close()

        shadow_id = None
        costume_id = None
        rule_id = None
        background_ids = []
        mega_id = None
        evolution_id = None
        try:
            evolution_id = self.db_manager.add_evolves_to(10, 11)
            self.db_manager.update_evolution_details(evolution_id, 12, 50, 1, None, "postgres editor test")
            self.assertEqual(
                self.scalar(
                    "SELECT trade_discount FROM pokemon_evolutions WHERE evolution_id = ?",
                    (evolution_id,),
                ),
                "1",
            )

            self.db_manager.update_shadow_pokemon_data(
                shadow_pokemon_id,
                {
                    "Shiny Available": 1,
                    "Apex": 0,
                    "Date Available": "2026-07-14",
                    "Date Shiny Available": "2026-07-14",
                    "Image URL Shadow": "/images/shadow/editor-postgres-test.png",
                    "Image URL Shiny Shadow": "/images/shadow/editor-postgres-test-shiny.png",
                },
            )
            shadow_id = self.scalar(
                "SELECT id FROM shadow_pokemon WHERE pokemon_id = ?",
                (shadow_pokemon_id,),
            )
            self.assertIsNotNone(shadow_id)

            costume_id = self.db_manager.add_costume(
                shadow_pokemon_id,
                {
                    "costume_name": "Editor PostgreSQL Shadow Costume",
                    "shiny_available": 1,
                    "date_available": "2026-07-14",
                    "date_shiny_available": "2026-07-14",
                    "image_url_costume": "/images/costumes/editor-postgres-shadow.png",
                    "image_url_shiny_costume": "/images/costumes/editor-postgres-shadow-shiny.png",
                    "image_url_costume_female": None,
                    "image_url_shiny_costume_female": None,
                },
            )
            self.db_manager.save_shadow_costume(
                shadow_id,
                costume_id,
                "2026-07-14",
                "2026-07-14",
                "/images/shadow-costumes/editor-postgres.png",
                "/images/shadow-costumes/editor-postgres-shiny.png",
            )
            self.assertEqual(
                self.scalar(
                    "SELECT COUNT(*) FROM shadow_costume_pokemon WHERE shadow_id = ? AND costume_id = ?",
                    (shadow_id, costume_id),
                ),
                1,
            )

            self.db_manager.insert_max_pokemon(max_pokemon_id)
            self.db_manager.update_max_pokemon(
                max_pokemon_id,
                (1, 0, "2026-07-14", "", "", ""),
            )
            self.assertTrue(self.db_manager.fetch_max_pokemon(max_pokemon_id)[1])

            mega_id = self.db_manager.add_mega_evolution(mega_pokemon_id)
            self.assertEqual(
                self.scalar("SELECT pokemon_id FROM mega_evolution WHERE id = ?", (mega_id,)),
                mega_pokemon_id,
            )

            for suffix in ("A", "B", "C"):
                background_ids.append(
                    self.db_manager.add_background(
                        f"Editor PostgreSQL Rule Background {suffix}",
                        "Test",
                        f"/images/backgrounds/editor-postgres-rule-{suffix}.png",
                        "2026-07-14",
                    )
                )
            rule_id = self.db_manager.add_fusion_background_rule(
                fusion_id,
                background_ids[0],
                background_ids[1],
                background_ids[2],
                1,
                "postgres editor test",
            )
            self.assertIsNotNone(rule_id)
        finally:
            cursor = self.db_manager.conn.get_cursor()
            if rule_id is not None:
                cursor.execute("DELETE FROM fusion_background_combo_rules WHERE id = ?", (rule_id,))
            if mega_id is not None:
                cursor.execute("DELETE FROM mega_evolution WHERE id = ?", (mega_id,))
            cursor.execute("DELETE FROM max_pokemon WHERE pokemon_id = ?", (max_pokemon_id,))
            if costume_id is not None:
                cursor.execute("DELETE FROM shadow_costume_pokemon WHERE costume_id = ?", (costume_id,))
                cursor.execute("DELETE FROM costume_pokemon WHERE costume_id = ?", (costume_id,))
            if shadow_id is not None:
                cursor.execute("DELETE FROM shadow_pokemon WHERE id = ?", (shadow_id,))
            if evolution_id is not None:
                cursor.execute("DELETE FROM pokemon_evolutions WHERE evolution_id = ?", (evolution_id,))
            for background_id in background_ids:
                cursor.execute("DELETE FROM backgrounds WHERE background_id = ?", (background_id,))
            self.db_manager.conn.commit()
            cursor.close()


if __name__ == "__main__":
    unittest.main()
