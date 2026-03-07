#!/usr/bin/env python3
"""
Reassign background IDs so they increase with release date.

Default behavior is DRY-RUN. Use --apply to persist changes.
"""

from __future__ import annotations

import argparse
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Sequence, Tuple


@dataclass(frozen=True)
class BackgroundRow:
    background_id: int
    name: str
    location: str | None
    image_url: str | None
    date: str | None


def normalize_background_date(date_value: str | None) -> str | None:
    normalized = (date_value or "").strip()
    if len(normalized) != 10:
        return None
    parts = normalized.split("-")
    if len(parts) != 3:
        return None
    year, month, day = parts
    if not (year.isdigit() and month.isdigit() and day.isdigit()):
        return None
    return normalized


def fetch_background_rows(conn: sqlite3.Connection) -> List[BackgroundRow]:
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT background_id, name, location, image_url, date
        FROM backgrounds
        ORDER BY background_id
        """
    )
    return [BackgroundRow(*row) for row in cursor.fetchall()]


def background_sort_key(row: BackgroundRow) -> Tuple[int, str, int]:
    normalized_date = normalize_background_date(row.date)
    if normalized_date is None:
        return (1, "9999-12-31", row.background_id)
    return (0, normalized_date, row.background_id)


def build_background_id_remap(rows: Sequence[BackgroundRow]) -> Dict[int, int]:
    ordered_rows = sorted(rows, key=background_sort_key)
    return {
        row.background_id: new_id
        for new_id, row in enumerate(ordered_rows, start=1)
    }


def summarize_background_id_changes(rows: Sequence[BackgroundRow], remap: Dict[int, int]) -> List[Tuple[int, int, str, str | None]]:
    changes = []
    for row in sorted(rows, key=lambda item: item.background_id):
        new_id = remap[row.background_id]
        if new_id != row.background_id:
            changes.append((row.background_id, new_id, row.name, normalize_background_date(row.date)))
    return changes


def _validate_bijection(remap: Dict[int, int]) -> None:
    old_ids = sorted(remap.keys())
    new_ids = sorted(remap.values())
    if new_ids != list(range(1, len(new_ids) + 1)):
        raise ValueError("New background IDs must be contiguous starting at 1")
    if len(set(old_ids)) != len(old_ids) or len(set(new_ids)) != len(new_ids):
        raise ValueError("Background ID remap must be one-to-one")


def _update_background_refs_to_temp(cursor: sqlite3.Cursor, old_id: int, temp_id: int) -> None:
    cursor.execute(
        "UPDATE pokemon_backgrounds SET background_id = ? WHERE background_id = ?",
        (temp_id, old_id),
    )
    cursor.execute(
        "UPDATE fusion_background_combo_rules SET member1_background_id = ? WHERE member1_background_id = ?",
        (temp_id, old_id),
    )
    cursor.execute(
        "UPDATE fusion_background_combo_rules SET member2_background_id = ? WHERE member2_background_id = ?",
        (temp_id, old_id),
    )
    cursor.execute(
        "UPDATE fusion_background_combo_rules SET combo_background_id = ? WHERE combo_background_id = ?",
        (temp_id, old_id),
    )


def _update_background_refs_to_final(cursor: sqlite3.Cursor, temp_id: int, new_id: int) -> None:
    cursor.execute(
        "UPDATE pokemon_backgrounds SET background_id = ? WHERE background_id = ?",
        (new_id, temp_id),
    )
    cursor.execute(
        "UPDATE fusion_background_combo_rules SET member1_background_id = ? WHERE member1_background_id = ?",
        (new_id, temp_id),
    )
    cursor.execute(
        "UPDATE fusion_background_combo_rules SET member2_background_id = ? WHERE member2_background_id = ?",
        (new_id, temp_id),
    )
    cursor.execute(
        "UPDATE fusion_background_combo_rules SET combo_background_id = ? WHERE combo_background_id = ?",
        (new_id, temp_id),
    )


def find_background_reference_violations(conn: sqlite3.Connection) -> List[Tuple[str, int, int]]:
    cursor = conn.cursor()
    violations: List[Tuple[str, int, int]] = []

    for row_id, background_id in cursor.execute(
        """
        SELECT pb.rowid, pb.background_id
        FROM pokemon_backgrounds pb
        LEFT JOIN backgrounds b
            ON b.background_id = pb.background_id
        WHERE b.background_id IS NULL
        ORDER BY pb.rowid
        """
    ).fetchall():
        violations.append(("pokemon_backgrounds.background_id", row_id, background_id))

    for rule_id, background_id in cursor.execute(
        """
        SELECT r.id, r.member1_background_id
        FROM fusion_background_combo_rules r
        LEFT JOIN backgrounds b
            ON b.background_id = r.member1_background_id
        WHERE b.background_id IS NULL
        ORDER BY r.id
        """
    ).fetchall():
        violations.append(("fusion_background_combo_rules.member1_background_id", rule_id, background_id))

    for rule_id, background_id in cursor.execute(
        """
        SELECT r.id, r.member2_background_id
        FROM fusion_background_combo_rules r
        LEFT JOIN backgrounds b
            ON b.background_id = r.member2_background_id
        WHERE b.background_id IS NULL
        ORDER BY r.id
        """
    ).fetchall():
        violations.append(("fusion_background_combo_rules.member2_background_id", rule_id, background_id))

    for rule_id, background_id in cursor.execute(
        """
        SELECT r.id, r.combo_background_id
        FROM fusion_background_combo_rules r
        LEFT JOIN backgrounds b
            ON b.background_id = r.combo_background_id
        WHERE b.background_id IS NULL
        ORDER BY r.id
        """
    ).fetchall():
        violations.append(("fusion_background_combo_rules.combo_background_id", rule_id, background_id))

    return violations


def apply_background_id_remap(conn: sqlite3.Connection, remap: Dict[int, int]) -> int:
    _validate_bijection(remap)
    changed_pairs = [(old_id, new_id) for old_id, new_id in remap.items() if old_id != new_id]
    if not changed_pairs:
        return 0

    max_existing_id = max(max(remap.keys(), default=0), max(remap.values(), default=0))
    temp_offset = max_existing_id + len(remap) + 1000
    foreign_keys_enabled = conn.execute("PRAGMA foreign_keys").fetchone()[0]
    conn.execute("PRAGMA foreign_keys = OFF")

    try:
        cursor = conn.cursor()
        cursor.execute("BEGIN IMMEDIATE")

        for old_id, new_id in changed_pairs:
            temp_id = new_id + temp_offset
            cursor.execute(
                "UPDATE backgrounds SET background_id = ? WHERE background_id = ?",
                (temp_id, old_id),
            )
            _update_background_refs_to_temp(cursor, old_id, temp_id)

        for old_id, new_id in changed_pairs:
            temp_id = new_id + temp_offset
            cursor.execute(
                "UPDATE backgrounds SET background_id = ? WHERE background_id = ?",
                (new_id, temp_id),
            )
            _update_background_refs_to_final(cursor, temp_id, new_id)

        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.execute(f"PRAGMA foreign_keys = {int(foreign_keys_enabled)}")

    violations = find_background_reference_violations(conn)
    if violations:
        raise RuntimeError(f"Background reference violations after background reorder: {violations}")

    return len(changed_pairs)


def count_background_id_order_violations(rows: Iterable[BackgroundRow]) -> int:
    ordered = list(rows)
    violations = 0
    for previous, current in zip(ordered, ordered[1:]):
        if background_sort_key(previous) > background_sort_key(current):
            violations += 1
    return violations


def run(db_path: Path, apply: bool, show_limit: int) -> int:
    conn = sqlite3.connect(str(db_path))
    try:
        rows = fetch_background_rows(conn)
        remap = build_background_id_remap(rows)
        changes = summarize_background_id_changes(rows, remap)

        print(f"Database: {db_path}")
        print(f"Background rows: {len(rows)}")
        print(f"Rows that would change ID: {len(changes)}")
        print(f"Ordering violations before: {count_background_id_order_violations(rows)}")

        if changes:
            print("Sample ID changes:")
            for old_id, new_id, name, date_value in changes[:show_limit]:
                print(f"  {old_id} -> {new_id} | {name} | {date_value or '(missing date)'}")

        if not apply:
            print("Dry run only. Use --apply to persist.")
            return 0

        changed_count = apply_background_id_remap(conn, remap)
        updated_rows = fetch_background_rows(conn)
        print(f"Applied ID changes: {changed_count}")
        print(f"Ordering violations after: {count_background_id_order_violations(updated_rows)}")
        return 0
    finally:
        conn.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--db-path",
        default=str(Path("pokemon/data/pokego.db")),
        help="Path to pokego.db",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Persist the background ID reorder",
    )
    parser.add_argument(
        "--show-limit",
        type=int,
        default=25,
        help="How many ID changes to print",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    return run(Path(args.db_path), apply=args.apply, show_limit=args.show_limit)


if __name__ == "__main__":
    raise SystemExit(main())
