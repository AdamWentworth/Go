import sqlite3
import sys
import unittest
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from scripts.reorder_background_ids import (  # noqa: E402
    BackgroundRow,
    apply_background_id_remap,
    build_background_id_remap,
    count_background_id_order_violations,
    fetch_background_rows,
    find_background_reference_violations,
    normalize_background_date,
    summarize_background_id_changes,
)


class ReorderBackgroundIDsTests(unittest.TestCase):
    def test_normalize_background_date_accepts_iso_dates_only(self):
        self.assertEqual(normalize_background_date("2025-07-18"), "2025-07-18")
        self.assertIsNone(normalize_background_date(""))
        self.assertIsNone(normalize_background_date(None))
        self.assertIsNone(normalize_background_date("July 18 2025"))

    def test_build_background_id_remap_orders_by_date_then_old_id(self):
        rows = [
            BackgroundRow(10, "Latest", None, None, "2025-01-02"),
            BackgroundRow(4, "Oldest", None, None, "2024-01-01"),
            BackgroundRow(7, "Same Day B", None, None, "2024-06-01"),
            BackgroundRow(6, "Same Day A", None, None, "2024-06-01"),
            BackgroundRow(12, "Missing Date", None, None, ""),
        ]

        remap = build_background_id_remap(rows)

        self.assertEqual(remap[4], 1)
        self.assertEqual(remap[6], 2)
        self.assertEqual(remap[7], 3)
        self.assertEqual(remap[10], 4)
        self.assertEqual(remap[12], 5)

    def test_summarize_background_id_changes_returns_only_changed_rows(self):
        rows = [
            BackgroundRow(1, "Already First", None, None, "2024-01-01"),
            BackgroundRow(5, "Moves Earlier", None, None, "2024-01-02"),
            BackgroundRow(2, "Moves Later", None, None, "2024-02-01"),
        ]

        remap = build_background_id_remap(rows)
        changes = summarize_background_id_changes(rows, remap)

        self.assertEqual(
            changes,
            [
                (2, 3, "Moves Later", "2024-02-01"),
                (5, 2, "Moves Earlier", "2024-01-02"),
            ],
        )

    def test_apply_background_id_remap_updates_background_links_and_combo_rules(self):
        conn = sqlite3.connect(":memory:")
        conn.execute("PRAGMA foreign_keys = ON")
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE backgrounds (
                background_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT,
                image_url TEXT,
                date TEXT
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE pokemon_backgrounds (
                pokemon_id INTEGER,
                background_id INTEGER,
                costume_id INTEGER
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE fusion_background_combo_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fusion_id INTEGER NOT NULL,
                member1_background_id INTEGER NOT NULL,
                member2_background_id INTEGER NOT NULL,
                combo_background_id INTEGER NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                FOREIGN KEY (member1_background_id) REFERENCES backgrounds(background_id),
                FOREIGN KEY (member2_background_id) REFERENCES backgrounds(background_id),
                FOREIGN KEY (combo_background_id) REFERENCES backgrounds(background_id)
            )
            """
        )

        cur.executemany(
            "INSERT INTO backgrounds (background_id, name, location, image_url, date) VALUES (?, ?, ?, ?, ?)",
            [
                (10, "Latest", None, "/images/backgrounds/latest.png", "2025-01-02"),
                (4, "Oldest", None, "/images/backgrounds/oldest.png", "2024-01-01"),
                (7, "Same Day B", None, "/images/backgrounds/same_day_b.png", "2024-06-01"),
                (6, "Same Day A", None, "/images/backgrounds/same_day_a.png", "2024-06-01"),
                (12, "Missing Date", None, "/images/backgrounds/missing.png", ""),
            ],
        )
        cur.executemany(
            "INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id) VALUES (?, ?, ?)",
            [
                (25, 10, None),
                (25, 6, 999),
                (133, 12, None),
            ],
        )
        cur.execute(
            """
            INSERT INTO fusion_background_combo_rules (
                fusion_id, member1_background_id, member2_background_id, combo_background_id, is_active, notes
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (1, 6, 7, 10, 1, "combo"),
        )
        conn.commit()

        remap = build_background_id_remap(fetch_background_rows(conn))
        changed_count = apply_background_id_remap(conn, remap)

        self.assertEqual(changed_count, 5)

        backgrounds = conn.execute(
            "SELECT background_id, name, date FROM backgrounds ORDER BY background_id"
        ).fetchall()
        self.assertEqual(
            backgrounds,
            [
                (1, "Oldest", "2024-01-01"),
                (2, "Same Day A", "2024-06-01"),
                (3, "Same Day B", "2024-06-01"),
                (4, "Latest", "2025-01-02"),
                (5, "Missing Date", ""),
            ],
        )

        pokemon_links = conn.execute(
            "SELECT pokemon_id, background_id, costume_id FROM pokemon_backgrounds ORDER BY pokemon_id, background_id"
        ).fetchall()
        self.assertEqual(
            pokemon_links,
            [
                (25, 2, 999),
                (25, 4, None),
                (133, 5, None),
            ],
        )

        combo_rule = conn.execute(
            """
            SELECT fusion_id, member1_background_id, member2_background_id, combo_background_id
            FROM fusion_background_combo_rules
            """
        ).fetchone()
        self.assertEqual(combo_rule, (1, 2, 3, 4))

        self.assertEqual(find_background_reference_violations(conn), [])

        conn.close()

    def test_apply_background_id_remap_is_noop_when_ids_already_ordered(self):
        conn = sqlite3.connect(":memory:")
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE backgrounds (
                background_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT,
                image_url TEXT,
                date TEXT
            )
            """
        )
        cur.execute("CREATE TABLE pokemon_backgrounds (pokemon_id INTEGER, background_id INTEGER, costume_id INTEGER)")
        cur.execute(
            """
            CREATE TABLE fusion_background_combo_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fusion_id INTEGER NOT NULL,
                member1_background_id INTEGER NOT NULL,
                member2_background_id INTEGER NOT NULL,
                combo_background_id INTEGER NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1,
                notes TEXT
            )
            """
        )
        cur.executemany(
            "INSERT INTO backgrounds (background_id, name, location, image_url, date) VALUES (?, ?, ?, ?, ?)",
            [
                (1, "Oldest", None, None, "2024-01-01"),
                (2, "Newer", None, None, "2024-02-01"),
                (3, "Missing Date", None, None, ""),
            ],
        )
        conn.commit()

        rows = fetch_background_rows(conn)
        remap = build_background_id_remap(rows)
        self.assertEqual(count_background_id_order_violations(rows), 0)
        self.assertEqual(apply_background_id_remap(conn, remap), 0)
        self.assertEqual(fetch_background_rows(conn), rows)
        conn.close()


if __name__ == "__main__":
    unittest.main()
