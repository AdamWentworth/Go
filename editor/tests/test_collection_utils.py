import unittest
from pathlib import Path
import sys


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from utils.collection_utils import (
    filter_background_rows,
    filter_costume_rows,
    format_background_row_label,
    format_costume_row_label,
    normalize_query,
    paginate_items,
)


class CollectionUtilsTests(unittest.TestCase):
    def test_normalize_query_trims_and_collapses_whitespace(self):
        self.assertEqual(normalize_query("  Pikachu   Libre "), "pikachu libre")

    def test_paginate_items_returns_first_page(self):
        page_items, page_index, total_pages = paginate_items(list(range(10)), 0, 4)
        self.assertEqual(page_items, [0, 1, 2, 3])
        self.assertEqual(page_index, 0)
        self.assertEqual(total_pages, 3)

    def test_paginate_items_clamps_page_index(self):
        page_items, page_index, total_pages = paginate_items(list(range(6)), 99, 4)
        self.assertEqual(page_items, [4, 5])
        self.assertEqual(page_index, 1)
        self.assertEqual(total_pages, 2)

    def test_paginate_items_handles_empty_collections(self):
        page_items, page_index, total_pages = paginate_items([], 0, 8)
        self.assertEqual(page_items, [])
        self.assertEqual(page_index, 0)
        self.assertEqual(total_pages, 1)

    def test_paginate_items_rejects_invalid_page_size(self):
        with self.assertRaises(ValueError):
            paginate_items([1, 2, 3], 0, 0)

    def test_format_costume_row_label_includes_id_and_name(self):
        row = (317, 25, "leaf", 1, None, None, "/a.png", "/b.png", None, None)
        self.assertEqual(format_costume_row_label(row), "317: leaf")

    def test_filter_costume_rows_matches_id(self):
        rows = [
            (317, 25, "leaf", 1, None, None, "/images/costumes/pokemon_25_leaf_hat_default.png", "", None, None),
            (318, 25, "red", 1, None, None, "/images/costumes/pokemon_25_red_hat_default.png", "", None, None),
        ]
        filtered = filter_costume_rows(rows, "318")
        self.assertEqual(filtered, [rows[1]])

    def test_filter_costume_rows_matches_name_case_insensitive(self):
        rows = [
            (317, 25, "leaf", 1, None, None, "/images/costumes/pokemon_25_leaf_hat_default.png", "", None, None),
            (318, 25, "red", 1, None, None, "/images/costumes/pokemon_25_red_hat_default.png", "", None, None),
        ]
        filtered = filter_costume_rows(rows, "LEAF")
        self.assertEqual(filtered, [rows[0]])

    def test_filter_costume_rows_matches_image_tokens(self):
        rows = [
            (317, 25, "leaf", 1, None, None, "/images/costumes/pokemon_25_leaf_hat_default.png", "", None, None),
            (318, 25, "red", 1, None, None, "/images/costumes/pokemon_25_red_hat_default.png", "", None, None),
        ]
        filtered = filter_costume_rows(rows, "red_hat")
        self.assertEqual(filtered, [rows[1]])

    def test_format_background_row_label_includes_link_background_and_costume(self):
        row = (540, 25, 21, 268, "Honolulu", "Hawaii", "/images/backgrounds/honolulu.png", "2024-08-16")
        self.assertEqual(
            format_background_row_label(row),
            "Link 540 | Background 21: Honolulu [costume 268]",
        )

    def test_filter_background_rows_matches_background_name(self):
        rows = [
            (540, 25, 21, None, "Honolulu", "Honolulu - Hawaii", "/images/backgrounds/honolulu.png", "2024-08-16"),
            (541, 25, 22, None, "Vancouver", "Vancouver, Canada", "/images/backgrounds/vancouver.png", "2024-08-17"),
        ]
        filtered = filter_background_rows(rows, "honolulu")
        self.assertEqual(filtered, [rows[0]])

    def test_filter_background_rows_matches_location_and_costume_id(self):
        rows = [
            (540, 25, 21, 268, "Honolulu", "Honolulu - Hawaii - United States", "/images/backgrounds/honolulu.png", "2024-08-16"),
            (541, 25, 22, None, "Vancouver", "Vancouver, Canada", "/images/backgrounds/vancouver.png", "2024-08-17"),
        ]
        filtered = filter_background_rows(rows, "268 hawaii")
        self.assertEqual(filtered, [rows[0]])

    def test_filter_background_rows_returns_all_for_empty_query(self):
        rows = [
            (540, 25, 21, None, "Honolulu", "Honolulu - Hawaii", "/images/backgrounds/honolulu.png", "2024-08-16"),
            (541, 25, 22, None, "Vancouver", "Vancouver, Canada", "/images/backgrounds/vancouver.png", "2024-08-17"),
        ]
        self.assertEqual(filter_background_rows(rows, " "), rows)


if __name__ == "__main__":
    unittest.main()
