import sys
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
    build_background_equivalence_key,
    build_costume_match_tokens,
    collapse_equivalent_background_records,
    collapse_links_to_one_per_pokemon_background,
    crop_solid_black_bottom,
    load_background_records,
    normalize_desired_links,
    parse_backgrounds_from_html,
    parse_start_date,
    resolve_costume_id_for_ref,
)
from scripts.postgres_catalog import CatalogConnection  # noqa: E402
from test_base import TempDBTestCase  # noqa: E402


class SyncBackgroundsFromFandomTests(unittest.TestCase):
    def test_parse_start_date_extracts_first_date(self):
        event = "PokAmon GO Fest 2026: Global July 13th - 14th"
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
            <tr><th>Background</th><th>Pokemon</th><th>Event</th></tr>
            <tr>
              <td rowspan="2">
                <a class="mw-file-description image" href="https://static.wikia.nocookie.net/pokemongo/images/a/a0/Special_Background_Test_BG.png/revision/latest?cb=1">
                  <img data-image-key="Special_Background_Test_BG.png" />
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
        self.assertEqual(background.image_filename, "Special_Background_Test_BG.png")
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
            <tr><th>Background</th><th>Pokemon</th><th>Event</th></tr>
            <tr>
              <td>
                <a class="mw-file-description image" href="https://example.com/Location_Background_A.png">
                  <img data-image-key="Location_Background_A.png" />
                </a>
              </td>
              <td><div class="pogo-icon-link"><a title="Pikachu"><img /></a></div></td>
              <td>Poke Lid Stamp Rally Since November 7th</td>
            </tr>
            <tr>
              <td>
                <a class="mw-file-description image" href="https://example.com/Location_Background_B.png">
                  <img data-image-key="Location_Background_B.png" />
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
        self.assertEqual(by_file["Location_Background_A.png"].date, "2026-11-07")
        self.assertEqual(by_file["Location_Background_B.png"].date, "2026-11-07")

    def test_parse_backgrounds_from_html_splits_nested_pokelid_images_and_backfills_pikachu(self):
        html = """
        <div class="mw-parser-output">
          <h3>2026</h3>
          <table class="pogo-legacy-table centered all-uled widthbp100">
            <tr><th>Background</th><th>Pokemon</th><th>Event</th></tr>
            <tr>
              <td>
                <table><tr>
                  <td>
                    <a class="mw-file-description image" href="https://example.com/Location_Background_Pokelid_Aichi.png">
                      <img data-image-key="Location_Background_Pokelid_Aichi.png" />
                    </a><br />Aichi, Japan
                  </td>
                  <td>
                    <a class="mw-file-description image" href="https://example.com/Location_Background_Pokelid_Akita.png">
                      <img data-image-key="Location_Background_Pokelid_Akita.png" />
                    </a><br />Akita, Japan
                  </td>
                </tr></table>
              </td>
              <td><div class="pogo-icon-link"><a title="Pikachu"><img /></a></div></td>
              <td>Poke Lid Stamp Rally Since January 20th 2026</td>
            </tr>
          </table>
        </div>
        """
        rows = parse_backgrounds_from_html(html)
        self.assertEqual(len(rows), 2)
        by_file = {r.image_filename: r for r in rows}
        self.assertIn("Location_Background_Pokelid_Aichi.png", by_file)
        self.assertIn("Location_Background_Pokelid_Akita.png", by_file)
        self.assertEqual(by_file["Location_Background_Pokelid_Aichi.png"].location, "Aichi, Japan")
        self.assertEqual(by_file["Location_Background_Pokelid_Akita.png"].location, "Akita, Japan")
        self.assertSetEqual(by_file["Location_Background_Pokelid_Akita.png"].pokemon_refs, {("Pikachu", "")})

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

    def test_build_background_equivalence_key_normalizes_mlb_and_location_punctuation(self):
        key_a = build_background_equivalence_key(
            name="Seattle Mariners",
            location="T-Mobile Park - Seattle - Washington - USA",
            date="2024-09-13",
        )
        key_b = build_background_equivalence_key(
            name="MLB Seattle Mariners",
            location="T-Mobile Park, Seattle, Washington, USA",
            date="2024-09-13",
        )
        self.assertEqual(key_a, key_b)

class BackgroundCatalogSyncTests(TempDBTestCase):
    def reset_background_tables(self):
        connection = CatalogConnection(self.db_connection.conn)
        cursor = connection.cursor()
        cursor.execute(
            "TRUNCATE TABLE fusion_background_combo_rules, pokemon_backgrounds, backgrounds RESTART IDENTITY CASCADE"
        )
        connection.commit()
        return connection, cursor

    def add_costumes(self, rows):
        cursor = self.db_connection.get_cursor()
        cursor.executemany(
            "INSERT INTO costume_pokemon (costume_id, pokemon_id, costume_name) VALUES (?, ?, ?)",
            rows,
        )
        self.db_connection.commit()

    def test_collapse_equivalent_background_records_merges_seattle_style_duplicates(self):
        conn, cur = self.reset_background_tables()
        cur.executemany(
            "INSERT INTO backgrounds (background_id, name, location, image_url, date) VALUES (?, ?, ?, ?, ?)",
            [
                (
                    24,
                    "Seattle Mariners",
                    "T-Mobile Park - Seattle - Washington - USA",
                    "/images/backgrounds/Location_Background_MLB_Mariners.png",
                    "2024-09-13",
                ),
                (
                    62,
                    "MLB Seattle Mariners",
                    "T-Mobile Park, Seattle, Washington, USA",
                    "/images/backgrounds/Location_Background_MLB_Seattle_Mariners.png",
                    "2024-09-13",
                ),
            ],
        )
        cur.executemany(
            "INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id) VALUES (?, ?, ?)",
            [
                (25, 24, None),
                (25, 62, None),
            ],
        )
        cur.execute(
            "INSERT INTO fusion_background_combo_rules (fusion_id, member1_background_id, member2_background_id, combo_background_id) VALUES (?, ?, ?, ?)",
            (1, 62, 24, 62),
        )
        conn.commit()

        stats = SyncStats()
        collapse_equivalent_background_records(conn=conn, dry_run=False, verbose=False, stats=stats)

        remaining_background_ids = cur.execute(
            "SELECT background_id FROM backgrounds ORDER BY background_id"
        ).fetchall()
        pokemon_links = cur.execute(
            "SELECT pokemon_id, background_id, costume_id FROM pokemon_backgrounds ORDER BY pokemon_id, background_id"
        ).fetchall()
        fusion_refs = cur.execute(
            "SELECT member1_background_id, member2_background_id, combo_background_id FROM fusion_background_combo_rules"
        ).fetchone()

        self.assertEqual(remaining_background_ids, [(24,)])
        self.assertEqual(pokemon_links, [(25, 24, None), (25, 24, None)])
        self.assertEqual(fusion_refs, (24, 24, 24))
        self.assertEqual(stats.backgrounds_merged, 1)

    def test_load_background_records_exposes_equivalent_background_lookup(self):
        conn, cur = self.reset_background_tables()
        cur.execute(
            "INSERT INTO backgrounds (background_id, name, location, image_url, date) VALUES (?, ?, ?, ?, ?)",
            (
                24,
                "Seattle Mariners",
                "T-Mobile Park - Seattle - Washington - USA",
                "/images/backgrounds/Location_Background_MLB_Mariners.png",
                "2024-09-13",
            ),
        )
        conn.commit()

        by_filename, by_equivalence, links = load_background_records(conn)

        self.assertIn("location_background_mlb_mariners.png", by_filename)
        seattle_key = build_background_equivalence_key(
            name="MLB Seattle Mariners",
            location="T-Mobile Park, Seattle, Washington, USA",
            date="2024-09-13",
        )
        self.assertEqual(by_equivalence[seattle_key].background_id, 24)
        self.assertEqual(links, {})

    def test_collapse_links_to_one_per_pokemon_background_prefers_costume(self):
        conn, cur = self.reset_background_tables()
        cur.executemany(
            "INSERT INTO backgrounds (background_id, name, image_url) VALUES (?, ?, ?)",
            [
                (100, "Location A", "/images/backgrounds/Location_Background_A.png"),
                (200, "Location B", "/images/backgrounds/Location_Background_B.png"),
                (300, "Location C", "/images/backgrounds/Location_Background_C.png"),
            ],
        )
        self.add_costumes([(78, 25, "Costume A"), (102, 133, "Costume B")])
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

    def test_collapse_links_keeps_multiple_costumes_for_team_backgrounds(self):
        conn, cur = self.reset_background_tables()
        cur.execute(
            "INSERT INTO backgrounds (background_id, name, image_url) VALUES (?, ?, ?)",
            (500, "Triumph Together - Valor", "/images/backgrounds/Special_Background_Valor.png"),
        )
        self.add_costumes([(317, 25, "Valor A"), (318, 25, "Valor B")])
        cur.executemany(
            "INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id) VALUES (?, ?, ?)",
            [
                (25, 500, None),
                (25, 500, 317),
                (25, 500, 318),
                (25, 500, 317),
            ],
        )
        conn.commit()

        stats = SyncStats()
        collapse_links_to_one_per_pokemon_background(conn=conn, dry_run=False, verbose=False, stats=stats)

        rows = cur.execute(
            """
            SELECT pokemon_id, background_id, costume_id
            FROM pokemon_backgrounds
            ORDER BY pokemon_id, background_id, COALESCE(costume_id, -1), costume_id
            """
        ).fetchall()
        self.assertEqual(
            rows,
            [
                (25, 500, 317),
                (25, 500, 318),
            ],
        )
        self.assertEqual(stats.links_collapsed_pair, 2)

    def test_add_missing_links_skips_when_pair_already_exists_with_any_costume(self):
        conn, cur = self.reset_background_tables()
        cur.execute(
            "INSERT INTO backgrounds (background_id, name) VALUES (?, ?)",
            (100, "Location A"),
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
            allow_multiple_costumes_per_pair=False,
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

    def test_add_missing_links_allows_second_costume_for_team_backgrounds(self):
        conn, cur = self.reset_background_tables()
        cur.execute(
            "INSERT INTO backgrounds (background_id, name) VALUES (?, ?)",
            (500, "Triumph Together - Valor"),
        )
        self.add_costumes([(317, 25, "Valor A"), (318, 25, "Valor B")])
        cur.execute(
            "INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id) VALUES (?, ?, ?)",
            (25, 500, 317),
        )
        conn.commit()

        stats = SyncStats()
        add_missing_links(
            conn=conn,
            background_id=500,
            desired_links={(25, 318)},
            existing_links={(25, 317)},
            allow_multiple_costumes_per_pair=True,
            dry_run=False,
            verbose=False,
            stats=stats,
        )

        rows = cur.execute(
            """
            SELECT pokemon_id, background_id, costume_id
            FROM pokemon_backgrounds
            ORDER BY pokemon_id, background_id, costume_id
            """
        ).fetchall()
        self.assertEqual(rows, [(25, 500, 317), (25, 500, 318)])
        self.assertEqual(stats.links_added, 1)


if __name__ == "__main__":
    unittest.main()
