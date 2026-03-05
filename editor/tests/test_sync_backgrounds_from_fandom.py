import sys
import sqlite3
import unittest
from pathlib import Path

from PIL import Image


ROOT_DIR = Path(__file__).resolve().parents[2]
EDITOR_DIR = ROOT_DIR / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from scripts.sync_backgrounds_from_fandom import (  # noqa: E402
    CostumeRecord,
    SyncStats,
    add_missing_links,
    build_costume_match_tokens,
    collapse_links_to_one_per_pokemon_background,
    crop_solid_black_bottom,
    normalize_desired_links,
    parse_backgrounds_from_html,
    parse_start_date,
    resolve_costume_id_for_ref,
)


class SyncBackgroundsFromFandomTests(unittest.TestCase):
    def test_parse_start_date_extracts_first_date(self):
        event = "Pokémon GO Fest 2026: Global July 13th - 14th"
        self.assertEqual(parse_start_date(event), "2026-07-13")

    def test_parse_start_date_returns_none_without_year(self):
        event = "July 13th - 14th"
        self.assertIsNone(parse_start_date(event))

    def test_parse_start_date_uses_default_year_when_missing_in_event(self):
        event = "March 29th - 30th"
        self.assertEqual(parse_start_date(event, default_year=2025), "2025-03-29")

    def test_crop_solid_black_bottom_removes_black_footer(self):
        image = Image.new("RGBA", (4, 6), (255, 0, 0, 255))
        for y in (4, 5):
            for x in range(4):
                image.putpixel((x, y), (0, 0, 0, 255))

        cropped, removed = crop_solid_black_bottom(image, threshold=2)
        self.assertEqual(removed, 2)
        self.assertEqual(cropped.size, (4, 4))

    def test_parse_backgrounds_from_html_handles_rowspan_and_pokemon_union(self):
        html = """
        <div class="mw-parser-output">
          <h3>2026</h3>
          <table class="pogo-legacy-table centered all-uled widthbp100">
            <tr><th>Background</th><th>Pokémon</th><th>Event</th></tr>
            <tr>
              <td rowspan="2">
                <a class="mw-file-description image" href="https://static.wikia.nocookie.net/pokemongo/images/a/a0/Test_BG.png/revision/latest?cb=1">
                  <img data-image-key="Test_BG.png" />
                </a>
                Las Vegas, US
              </td>
              <td>
                <div class="pogo-icon-link"><a title="Pikachu"><img /></a></div>
              </td>
              <td rowspan="2">Test Event 2026 July 4th - 5th</td>
            </tr>
            <tr>
              <td>
                <div class="pogo-icon-link"><a title="Eevee"><img /></a></div>
              </td>
            </tr>
          </table>
        </div>
        """
        rows = parse_backgrounds_from_html(html)
        self.assertEqual(len(rows), 1)

        background = rows[0]
        self.assertEqual(background.image_filename, "Test_BG.png")
        self.assertEqual(background.date, "2026-07-04")
        self.assertEqual(background.location, "Las Vegas, US")
        self.assertSetEqual(
            background.pokemon_refs,
            {
                ("Pikachu", ""),
                ("Eevee", ""),
            },
        )

    def test_parse_backgrounds_from_html_inherits_table_date_for_location_label_rows(self):
        html = """
        <div class="mw-parser-output">
          <h3>2026</h3>
          <table class="pogo-legacy-table centered all-uled widthbp100">
            <tr><th>Background</th><th>Pokémon</th><th>Event</th></tr>
            <tr>
              <td>
                <a class="mw-file-description image" href="https://example.com/A.png">
                  <img data-image-key="A.png" />
                </a>
              </td>
              <td><div class="pogo-icon-link"><a title="Pikachu"><img /></a></div></td>
              <td>Poké Lid Stamp Rally Since November 7th</td>
            </tr>
            <tr>
              <td>
                <a class="mw-file-description image" href="https://example.com/B.png">
                  <img data-image-key="B.png" />
                </a>
              </td>
              <td><div class="pogo-icon-link"><a title="Eevee"><img /></a></div></td>
              <td>Gifu, Japan</td>
            </tr>
          </table>
        </div>
        """
        rows = parse_backgrounds_from_html(html)
        self.assertEqual(len(rows), 2)
        by_file = {r.image_filename: r for r in rows}
        self.assertEqual(by_file["A.png"].date, "2026-11-07")
        self.assertEqual(by_file["B.png"].date, "2026-11-07")

    def test_resolve_costume_id_for_ref_matches_using_image_url_tokens(self):
        record = CostumeRecord(
            costume_id=999,
            pokemon_id=25,
            costume_name="beanie",
            image_urls=("/images/costumes/pokemon_25_winter_default.png",),
            match_tokens=build_costume_match_tokens(
                "beanie",
                ["/images/costumes/pokemon_25_winter_default.png"],
            ),
        )
        costume_id, suspected, reason, candidates, hints = resolve_costume_id_for_ref(
            pokemon_id=25,
            title="Pikachu",
            image_key="Pikachu_winter.png",
            costume_lookup={25: [record]},
        )
        self.assertEqual(costume_id, 999)
        self.assertTrue(suspected)
        self.assertEqual(reason, "matched")
        self.assertEqual(candidates, [])
        self.assertIn("winter", hints)

    def test_normalize_desired_links_drops_generic_when_costume_present(self):
        links = {(25, None), (25, 78), (133, None)}
        normalized = normalize_desired_links(links)
        self.assertSetEqual(normalized, {(25, 78), (133, None)})

    def test_collapse_links_to_one_per_pokemon_background_prefers_costume(self):
        conn = sqlite3.connect(":memory:")
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE pokemon_backgrounds (
                rowid INTEGER PRIMARY KEY AUTOINCREMENT,
                pokemon_id INTEGER,
                background_id INTEGER,
                costume_id INTEGER
            )
            """
        )
        cur.executemany(
            "INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id) VALUES (?, ?, ?)",
            [
                (25, 100, None),
                (25, 100, 78),
                (133, 200, None),
                (133, 200, 102),
                (54, 300, None),
                (54, 300, None),
            ],
        )
        conn.commit()

        stats = SyncStats()
        collapse_links_to_one_per_pokemon_background(
            conn=conn,
            dry_run=False,
            verbose=False,
            stats=stats,
        )

        rows = cur.execute(
            """
            SELECT pokemon_id, background_id, costume_id
            FROM pokemon_backgrounds
            ORDER BY pokemon_id, background_id, COALESCE(costume_id, -1)
            """
        ).fetchall()
        self.assertEqual(
            rows,
            [
                (25, 100, 78),
                (54, 300, None),
                (133, 200, 102),
            ],
        )
        self.assertEqual(stats.links_collapsed_pair, 3)
        conn.close()

    def test_add_missing_links_skips_when_pair_already_exists_with_any_costume(self):
        conn = sqlite3.connect(":memory:")
        cur = conn.cursor()
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
            "INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id) VALUES (?, ?, ?)",
            (25, 100, None),
        )
        conn.commit()

        stats = SyncStats()
        add_missing_links(
            conn=conn,
            background_id=100,
            desired_links={(25, 78)},
            existing_links={(25, None)},
            dry_run=False,
            verbose=False,
            stats=stats,
        )

        rows = cur.execute(
            """
            SELECT pokemon_id, background_id, costume_id
            FROM pokemon_backgrounds
            ORDER BY pokemon_id, background_id, COALESCE(costume_id, -1)
            """
        ).fetchall()
        self.assertEqual(rows, [(25, 100, None)])
        self.assertEqual(stats.links_added, 0)
        conn.close()


if __name__ == "__main__":
    unittest.main()
