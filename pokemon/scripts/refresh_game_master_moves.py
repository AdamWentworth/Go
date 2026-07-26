#!/usr/bin/env python3
"""Refresh raid/PvP move stats and current move pools from PokeMiners Game Master.

The updater is intentionally conservative:
- Pairs PVE move settings with current combatMove PvP settings.
- Updates/inserts raid and PvP move stat rows.
- Syncs non-legacy pokemon_moves rows to current Game Master pools.
- Adds elite move rows as legacy rows.
- Preserves existing legacy/special rows that are not in current pools.
- Syncs fusion_moveset for known fusion forms while preserving legacy signature rows.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


EDITOR_DIR = Path(__file__).resolve().parents[2] / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from scripts.postgres_catalog import CatalogConnection, open_catalog_authoring_connection


DEFAULT_GAME_MASTER_URL = (
    "https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json"
)


@dataclass(frozen=True)
class GameMasterMove:
    key: str
    typed_key: str
    token: str
    movement_id: str
    name: str
    type_name: str
    raid_power: int
    raid_energy: int
    raid_cooldown: int
    pvp_power: int | None
    pvp_energy: int | None
    pvp_turns: int | None
    pvp_attacker_attack_stage_change: int
    pvp_attacker_defense_stage_change: int
    pvp_target_attack_stage_change: int
    pvp_target_defense_stage_change: int
    pvp_buff_activation_chance: float
    is_fast: int


@dataclass(frozen=True)
class GameMasterPool:
    key: str
    current_move_keys: frozenset[str]
    elite_move_keys: frozenset[str]


def normalize_key(value: Any) -> str:
    # Preserve Apex move suffixes. Treating "+" as punctuation collapses
    # Aeroblast, Aeroblast+, and Aeroblast++ onto the same catalog key.
    expanded = str(value or "").lower().replace("+", " plus ")
    return re.sub(r"[^a-z0-9]+", "", expanded)


def normalize_type(value: Any) -> str:
    return str(value or "").removeprefix("POKEMON_TYPE_").strip().lower()


def title_from_move_token(token: str) -> str:
    special_names = {
        "FUTURESIGHT": "Future Sight",
        "V_CREATE": "V-create",
        "LOCK_ON": "Lock-On",
        "X_SCISSOR": "X-Scissor",
        "TECHNO_BLAST_NORMAL": "Techno Blast",
        "TECHNO_BLAST_BURN": "Techno Blast",
        "TECHNO_BLAST_CHILL": "Techno Blast",
        "TECHNO_BLAST_SHOCK": "Techno Blast",
        "TECHNO_BLAST_WATER": "Techno Blast",
        "AURA_WHEEL_ELECTRIC": "Aura Wheel",
        "AURA_WHEEL_DARK": "Aura Wheel",
    }
    if token in special_names:
        return special_names[token]
    return " ".join(part.capitalize() for part in token.split("_") if part)


def move_token_from_template(template_id: str) -> tuple[str, int] | None:
    match = re.match(r"^V\d+_MOVE_(.+)$", template_id)
    if not match:
        return None
    token = match.group(1)
    if token.endswith("_FAST"):
        return token[:-5], 1
    return token, 0


def combat_move_token_from_template(template_id: str) -> str:
    match = re.match(r"^COMBAT_V\d+_MOVE_(.+)$", template_id)
    return match.group(1) if match else ""


def move_key_from_token(token: str) -> str:
    if token.endswith("_FAST"):
        token = token[:-5]
    if token.startswith("TECHNO_BLAST_"):
        token = "TECHNO_BLAST"
    if token.startswith("AURA_WHEEL_"):
        token = "AURA_WHEEL"
    return normalize_key(token)


def enum_name_from_pokemon_template(template_id: str) -> str:
    match = re.match(r"^V\d+_POKEMON_(.+)$", template_id)
    return match.group(1) if match else ""


def dex_number_from_template(template_id: str) -> int | None:
    match = re.match(r"^V(\d+)_POKEMON_", template_id)
    return int(match.group(1)) if match else None


def normalize_form(value: Any, species_enum: Any) -> str:
    normalized_species = re.sub(r"[^a-z0-9]+", "_", str(species_enum or "").lower()).strip("_")
    normalized = re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")
    if normalized_species and normalized.startswith(f"{normalized_species}_"):
        normalized = normalized[len(normalized_species) + 1 :]
    if normalized in {"", normalized_species, "normal", "default"}:
        return ""
    aliases = {
        "alolan": "alola",
        "galarian": "galar",
        "hisuian": "hisui",
        "paldean": "paldea",
    }
    return aliases.get(normalized, normalized)


def local_pool_key(row: Any) -> str:
    return f"{row['pokedex_number'] or row['pokemon_id']}:{normalize_form(row['form'], row['name'])}"


def fetch_json(url: str) -> list[dict[str, Any]]:
    with urllib.request.urlopen(url, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def build_game_master_combat_moves(
    game_master: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    combat_moves: dict[str, dict[str, Any]] = {}
    for entry in game_master:
        template_id = str(entry.get("templateId") or "")
        settings = entry.get("data", {}).get("combatMove")
        if not settings:
            continue

        unique_id = str(settings.get("uniqueId") or "")
        token = unique_id if not unique_id.isdigit() else combat_move_token_from_template(template_id)
        if not token:
            continue
        type_name = normalize_type(settings.get("type"))
        typed_key = f"{move_key_from_token(token)}:{type_name}"
        combat_moves[typed_key] = settings
    return combat_moves


def build_game_master_moves(game_master: list[dict[str, Any]]) -> dict[str, GameMasterMove]:
    combat_moves = build_game_master_combat_moves(game_master)
    moves: dict[str, GameMasterMove] = {}
    for entry in game_master:
        template_id = str(entry.get("templateId") or "")
        token_info = move_token_from_template(template_id)
        settings = entry.get("data", {}).get("moveSettings")
        if not token_info or not settings:
            continue

        token, is_fast = token_info
        type_name = normalize_type(settings.get("pokemonType"))
        key = move_key_from_token(token)
        typed_key = f"{key}:{type_name}"
        combat = combat_moves.get(typed_key)
        buffs = (combat.get("buffs") or {}) if combat else {}
        pvp_turns = None
        if combat:
            # Niantic stores zero-based durationTurns for fast moves. Missing
            # durationTurns is the normal one-turn fast-move representation.
            pvp_turns = (
                int(combat.get("durationTurns") or 0) + 1
                if is_fast
                else 1
            )
        moves[typed_key] = GameMasterMove(
            key=key,
            typed_key=typed_key,
            token=token,
            movement_id=str(settings.get("movementId") or ""),
            name=title_from_move_token(token),
            type_name=type_name,
            raid_power=round(float(settings.get("power") or 0)),
            raid_energy=round(float(settings.get("energyDelta") or 0)),
            raid_cooldown=round(float(settings.get("durationMs") or 0)),
            pvp_power=round(float(combat.get("power") or 0)) if combat else None,
            pvp_energy=round(float(combat.get("energyDelta") or 0)) if combat else None,
            pvp_turns=pvp_turns,
            pvp_attacker_attack_stage_change=int(
                buffs.get("attackerAttackStatStageChange") or 0
            ),
            pvp_attacker_defense_stage_change=int(
                buffs.get("attackerDefenseStatStageChange") or 0
            ),
            pvp_target_attack_stage_change=int(
                buffs.get("targetAttackStatStageChange") or 0
            ),
            pvp_target_defense_stage_change=int(
                buffs.get("targetDefenseStatStageChange") or 0
            ),
            pvp_buff_activation_chance=float(
                buffs.get("buffActivationChance") or 0
            ),
            is_fast=is_fast,
        )
    return moves


def game_master_move_lookup(
    gm_moves: dict[str, GameMasterMove],
) -> tuple[dict[str, GameMasterMove], dict[str, GameMasterMove], dict[str, GameMasterMove]]:
    by_token = {move.token: move for move in gm_moves.values()}
    by_movement_id = {move.movement_id: move for move in gm_moves.values() if move.movement_id}
    grouped_by_key: dict[str, list[GameMasterMove]] = {}
    for move in gm_moves.values():
        grouped_by_key.setdefault(move.key, []).append(move)
    unique_by_key = {
        key: moves[0]
        for key, moves in grouped_by_key.items()
        if len(moves) == 1
    }
    return by_token, by_movement_id, unique_by_key


def pool_move_keys(move_tokens: list[Any] | None, gm_moves: dict[str, GameMasterMove]) -> set[str]:
    by_token, by_movement_id, unique_by_key = game_master_move_lookup(gm_moves)
    keys: set[str] = set()
    for raw_token in move_tokens or []:
        token = str(raw_token)
        if token.isdigit():
            move = by_movement_id.get(token)
        else:
            token = token[:-5] if token.endswith("_FAST") else token
            move = by_token.get(token) or unique_by_key.get(move_key_from_token(token))
        if move:
            keys.add(move.typed_key)
    return keys


def build_game_master_pools(
    game_master: list[dict[str, Any]],
    gm_moves: dict[str, GameMasterMove],
) -> dict[str, GameMasterPool]:
    pools: dict[str, GameMasterPool] = {}
    for entry in game_master:
        template_id = str(entry.get("templateId") or "")
        if not re.match(r"^V\d+_POKEMON_", template_id):
            continue
        settings = entry.get("data", {}).get("pokemonSettings")
        if not settings:
            continue

        dex_number = dex_number_from_template(template_id)
        species_enum = settings.get("pokemonId") or enum_name_from_pokemon_template(template_id)
        form = normalize_form(settings.get("form"), species_enum)
        key = f"{dex_number}:{form}"
        current = pool_move_keys(settings.get("quickMoves"), gm_moves) | pool_move_keys(
            settings.get("cinematicMoves"), gm_moves
        )
        elite = pool_move_keys(settings.get("eliteQuickMove"), gm_moves) | pool_move_keys(
            settings.get("eliteCinematicMove"), gm_moves
        )
        pools[key] = GameMasterPool(
            key=key,
            current_move_keys=frozenset(current),
            elite_move_keys=frozenset(elite),
        )
    return pools


def get_type_ids(conn: CatalogConnection) -> dict[str, int]:
    return {
        normalize_type(row["name"]): int(row["type_id"])
        for row in conn.execute("SELECT type_id, name FROM types")
    }


def get_local_move_groups(
    conn: CatalogConnection,
) -> tuple[dict[str, list[Any]], dict[str, list[Any]]]:
    rows = list(
        conn.execute(
            """
            SELECT m.*, lower(t.name) AS type_name
            FROM moves m
            JOIN types t ON t.type_id = m.type_id
            ORDER BY m.move_id
            """
        )
    )
    by_key: dict[str, list[Any]] = {}
    by_typed_key: dict[str, list[Any]] = {}
    for row in rows:
        key = normalize_key(row["name"])
        typed_key = f"{key}:{normalize_type(row['type_name'])}"
        by_key.setdefault(key, []).append(row)
        by_typed_key.setdefault(typed_key, []).append(row)
    return by_key, by_typed_key


def get_local_moves(conn: CatalogConnection) -> tuple[dict[str, Any], dict[str, Any]]:
    grouped_by_key, grouped_by_typed_key = get_local_move_groups(conn)
    by_key = {
        key: rows[0]
        for key, rows in grouped_by_key.items()
        if len(rows) == 1
    }
    # Prefer the established lowest move ID when duplicate rows represent the
    # same typed move. Existing Pokemon assignments use those stable IDs.
    by_typed_key = {
        typed_key: rows[0]
        for typed_key, rows in grouped_by_typed_key.items()
    }
    return by_key, by_typed_key


def ensure_moves(
    conn: CatalogConnection,
    gm_moves: dict[str, GameMasterMove],
    apply: bool,
) -> tuple[int, int]:
    type_ids = get_type_ids(conn)
    grouped_by_key, grouped_by_typed_key = get_local_move_groups(conn)
    updates = 0
    inserts = 0
    next_move_id = int(conn.execute("SELECT COALESCE(MAX(move_id), 0) + 1 FROM moves").fetchone()[0])

    for gm_move in sorted(gm_moves.values(), key=lambda move: (move.name, move.type_name)):
        local_rows = grouped_by_typed_key.get(gm_move.typed_key, [])
        if not local_rows:
            untyped_rows = grouped_by_key.get(gm_move.key, [])
            local_rows = untyped_rows if len(untyped_rows) == 1 else []
        type_id = type_ids.get(gm_move.type_name)
        if type_id is None:
            continue

        if local_rows:
            for local in local_rows:
                local_pvp_power = (
                    None if local["pvp_power"] is None else int(local["pvp_power"])
                )
                local_pvp_energy = (
                    None if local["pvp_energy"] is None else int(local["pvp_energy"])
                )
                local_pvp_turns = (
                    None if local["pvp_turns"] is None else int(local["pvp_turns"])
                )
                local_attacker_attack = int(
                    local["pvp_attacker_attack_stage_change"] or 0
                )
                local_attacker_defense = int(
                    local["pvp_attacker_defense_stage_change"] or 0
                )
                local_target_attack = int(local["pvp_target_attack_stage_change"] or 0)
                local_target_defense = int(
                    local["pvp_target_defense_stage_change"] or 0
                )
                local_buff_chance = float(local["pvp_buff_activation_chance"] or 0)
                changed = (
                    int(local["type_id"]) != type_id
                    or int(local["is_fast"] or 0) != gm_move.is_fast
                    or int(local["raid_power"] or 0) != gm_move.raid_power
                    or int(local["raid_energy"] or 0) != gm_move.raid_energy
                    or int(local["raid_cooldown"] or 0) != gm_move.raid_cooldown
                    or (
                        gm_move.pvp_power is not None
                        and local_pvp_power != gm_move.pvp_power
                    )
                    or (
                        gm_move.pvp_energy is not None
                        and local_pvp_energy != gm_move.pvp_energy
                    )
                    or (
                        gm_move.pvp_turns is not None
                        and local_pvp_turns != gm_move.pvp_turns
                    )
                    or local_attacker_attack
                    != gm_move.pvp_attacker_attack_stage_change
                    or local_attacker_defense
                    != gm_move.pvp_attacker_defense_stage_change
                    or local_target_attack != gm_move.pvp_target_attack_stage_change
                    or local_target_defense
                    != gm_move.pvp_target_defense_stage_change
                    or abs(
                        local_buff_chance - gm_move.pvp_buff_activation_chance
                    )
                    > 1e-9
                )
                if changed:
                    updates += 1
                    if apply:
                        conn.execute(
                            """
                            UPDATE moves
                            SET type_id = ?,
                                is_fast = ?,
                                raid_power = ?,
                                raid_energy = ?,
                                raid_cooldown = ?,
                                pvp_power = COALESCE(?, pvp_power),
                                pvp_energy = COALESCE(?, pvp_energy),
                                pvp_turns = COALESCE(?, pvp_turns),
                                pvp_attacker_attack_stage_change = ?,
                                pvp_attacker_defense_stage_change = ?,
                                pvp_target_attack_stage_change = ?,
                                pvp_target_defense_stage_change = ?,
                                pvp_buff_activation_chance = ?
                            WHERE move_id = ?
                            """,
                            (
                                type_id,
                                bool(gm_move.is_fast),
                                gm_move.raid_power,
                                gm_move.raid_energy,
                                gm_move.raid_cooldown,
                                gm_move.pvp_power,
                                gm_move.pvp_energy,
                                gm_move.pvp_turns,
                                gm_move.pvp_attacker_attack_stage_change,
                                gm_move.pvp_attacker_defense_stage_change,
                                gm_move.pvp_target_attack_stage_change,
                                gm_move.pvp_target_defense_stage_change,
                                gm_move.pvp_buff_activation_chance,
                                local["move_id"],
                            ),
                        )
        else:
            inserts += 1
            if apply:
                conn.execute(
                    """
                    INSERT INTO moves (
                        move_id, name, type_id, raid_power, pvp_power, raid_energy,
                        pvp_energy, raid_cooldown, pvp_turns, is_fast, fusion_id,
                        shadow, purified, apex,
                        pvp_attacker_attack_stage_change,
                        pvp_attacker_defense_stage_change,
                        pvp_target_attack_stage_change,
                        pvp_target_defense_stage_change,
                        pvp_buff_activation_chance
                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, NULL,
                        ?, ?, ?, ?, ?
                    )
                    """,
                    (
                        next_move_id,
                        gm_move.name,
                        type_id,
                        gm_move.raid_power,
                        gm_move.pvp_power,
                        gm_move.raid_energy,
                        gm_move.pvp_energy,
                        gm_move.raid_cooldown,
                        gm_move.pvp_turns,
                        bool(gm_move.is_fast),
                        gm_move.pvp_attacker_attack_stage_change,
                        gm_move.pvp_attacker_defense_stage_change,
                        gm_move.pvp_target_attack_stage_change,
                        gm_move.pvp_target_defense_stage_change,
                        gm_move.pvp_buff_activation_chance,
                    ),
                )
                next_move_id += 1

    return updates, inserts


def refresh_move_maps(conn: CatalogConnection) -> dict[str, int]:
    _by_key, by_typed_key = get_local_moves(conn)
    return {typed_key: int(row["move_id"]) for typed_key, row in by_typed_key.items()}


def sync_assignment_table(
    conn: CatalogConnection,
    table: str,
    id_column: str,
    entity_id: int,
    current_move_ids: set[int],
    elite_move_ids: set[int],
    replaceable_duplicate_move_ids: set[int],
    apply: bool,
) -> tuple[int, int, int]:
    existing = list(
        conn.execute(
            f"""
            SELECT move_id, COALESCE(legacy, FALSE) AS legacy
            FROM {table}
            WHERE {id_column} = ?
            """,
            (entity_id,),
        )
    )
    by_move = {int(row["move_id"]): row for row in existing}
    desired_move_ids = current_move_ids | elite_move_ids
    delete_count = 0
    insert_count = 0
    update_count = 0

    for row in existing:
        move_id = int(row["move_id"])
        legacy = int(row["legacy"] or 0)
        should_delete = legacy == 0 and move_id not in current_move_ids
        should_replace_wrong_duplicate = (
            legacy != 0
            and move_id not in desired_move_ids
            and move_id in replaceable_duplicate_move_ids
        )
        if should_delete or should_replace_wrong_duplicate:
            delete_count += 1
            if apply:
                conn.execute(
                    f"DELETE FROM {table} WHERE {id_column} = ? AND move_id = ?",
                    (entity_id, move_id),
                )

    for move_id in sorted(current_move_ids):
        row = by_move.get(move_id)
        if row is None:
            insert_count += 1
            if apply:
                if table == "pokemon_moves":
                    assignment_id = int(
                        conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM pokemon_moves").fetchone()[0]
                    )
                    conn.execute(
                        "INSERT INTO pokemon_moves (id, pokemon_id, move_id, legacy) VALUES (?, ?, ?, FALSE)",
                        (assignment_id, entity_id, move_id),
                    )
                else:
                    conn.execute(
                        f"INSERT INTO {table} ({id_column}, move_id, legacy) VALUES (?, ?, FALSE)",
                        (entity_id, move_id),
                    )
        elif int(row["legacy"] or 0) != 0:
            update_count += 1
            if apply:
                conn.execute(
                    f"UPDATE {table} SET legacy = FALSE WHERE {id_column} = ? AND move_id = ?",
                    (entity_id, move_id),
                )

    for move_id in sorted(elite_move_ids - current_move_ids):
        if move_id not in by_move:
            insert_count += 1
            if apply:
                if table == "pokemon_moves":
                    assignment_id = int(
                        conn.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM pokemon_moves").fetchone()[0]
                    )
                    conn.execute(
                        "INSERT INTO pokemon_moves (id, pokemon_id, move_id, legacy) VALUES (?, ?, ?, TRUE)",
                        (assignment_id, entity_id, move_id),
                    )
                else:
                    conn.execute(
                        f"INSERT INTO {table} ({id_column}, move_id, legacy) VALUES (?, ?, TRUE)",
                        (entity_id, move_id),
                    )

    return insert_count, update_count, delete_count


def sync_pokemon_moves(
    conn: CatalogConnection,
    gm_pools: dict[str, GameMasterPool],
    move_ids_by_typed_key: dict[str, int],
    replaceable_duplicate_move_ids_by_key: dict[str, set[int]],
    apply: bool,
) -> tuple[int, int, int, int]:
    matched = 0
    inserts = updates = deletes = 0
    rows = conn.execute("SELECT pokemon_id, pokedex_number, name, form FROM pokemon").fetchall()
    for row in rows:
        pool = gm_pools.get(local_pool_key(row))
        if not pool:
            continue
        current_ids = {move_ids_by_typed_key[key] for key in pool.current_move_keys if key in move_ids_by_typed_key}
        elite_ids = {move_ids_by_typed_key[key] for key in pool.elite_move_keys if key in move_ids_by_typed_key}
        duplicate_base_keys = {key.split(":", 1)[0] for key in pool.current_move_keys | pool.elite_move_keys}
        replaceable_ids = set().union(
            *(replaceable_duplicate_move_ids_by_key.get(key, set()) for key in duplicate_base_keys)
        ) if duplicate_base_keys else set()
        added, changed, removed = sync_assignment_table(
            conn,
            "pokemon_moves",
            "pokemon_id",
            int(row["pokemon_id"]),
            current_ids,
            elite_ids,
            replaceable_ids,
            apply,
        )
        matched += 1
        inserts += added
        updates += changed
        deletes += removed
    return matched, inserts, updates, deletes


FUSION_FORM_KEYS = {
    "black kyurem": "646:black",
    "white kyurem": "646:white",
    "dawn wings necrozma": "800:dawn_wings",
    "dusk mane necrozma": "800:dusk_mane",
}


def sync_fusion_moves(
    conn: CatalogConnection,
    gm_pools: dict[str, GameMasterPool],
    move_ids_by_typed_key: dict[str, int],
    replaceable_duplicate_move_ids_by_key: dict[str, set[int]],
    apply: bool,
) -> tuple[int, int, int, int]:
    matched = 0
    inserts = updates = deletes = 0
    rows = conn.execute("SELECT fusion_id, lower(name) AS name FROM fusion_pokemon").fetchall()
    for row in rows:
        pool_key = FUSION_FORM_KEYS.get(row["name"])
        pool = gm_pools.get(pool_key or "")
        if not pool:
            continue
        current_ids = {move_ids_by_typed_key[key] for key in pool.current_move_keys if key in move_ids_by_typed_key}
        elite_ids = {move_ids_by_typed_key[key] for key in pool.elite_move_keys if key in move_ids_by_typed_key}
        duplicate_base_keys = {key.split(":", 1)[0] for key in pool.current_move_keys | pool.elite_move_keys}
        replaceable_ids = set().union(
            *(replaceable_duplicate_move_ids_by_key.get(key, set()) for key in duplicate_base_keys)
        ) if duplicate_base_keys else set()
        added, changed, removed = sync_assignment_table(
            conn,
            "fusion_moveset",
            "fusion_id",
            int(row["fusion_id"]),
            current_ids,
            elite_ids,
            replaceable_ids,
            apply,
        )
        matched += 1
        inserts += added
        updates += changed
        deletes += removed
    return matched, inserts, updates, deletes


def duplicate_move_ids_by_base_key(
    gm_moves: dict[str, GameMasterMove],
    move_ids_by_typed_key: dict[str, int],
) -> dict[str, set[int]]:
    base_key_counts: dict[str, int] = {}
    for move in gm_moves.values():
        base_key_counts[move.key] = base_key_counts.get(move.key, 0) + 1

    duplicate_ids: dict[str, set[int]] = {}
    for typed_key, move_id in move_ids_by_typed_key.items():
        base_key = typed_key.split(":", 1)[0]
        if base_key_counts.get(base_key, 0) > 1:
            duplicate_ids.setdefault(base_key, set()).add(move_id)
    return duplicate_ids


def run(args: argparse.Namespace) -> int:
    game_master = fetch_json(args.game_master_url)
    gm_moves = build_game_master_moves(game_master)
    gm_pools = build_game_master_pools(game_master, gm_moves)

    with open_catalog_authoring_connection(args.database_url) as conn:
        try:
            conn.execute("BEGIN")
            move_updates, move_inserts = ensure_moves(conn, gm_moves, args.apply)
            move_ids_by_typed_key = refresh_move_maps(conn)
            replaceable_duplicate_move_ids_by_key = duplicate_move_ids_by_base_key(
                gm_moves, move_ids_by_typed_key
            )
            pokemon_matched, pokemon_inserts, pokemon_updates, pokemon_deletes = sync_pokemon_moves(
                conn, gm_pools, move_ids_by_typed_key, replaceable_duplicate_move_ids_by_key, args.apply
            )
            fusion_matched, fusion_inserts, fusion_updates, fusion_deletes = sync_fusion_moves(
                conn, gm_pools, move_ids_by_typed_key, replaceable_duplicate_move_ids_by_key, args.apply
            )

            if args.apply:
                conn.commit()
            else:
                conn.rollback()
        except Exception:
            conn.rollback()
            raise

    mode = "APPLIED" if args.apply else "DRY RUN"
    print(f"{mode}: Game Master move refresh")
    print("Database: PostgreSQL catalog")
    print(f"Game Master: {args.game_master_url}")
    print(f"Game Master moves: {len(gm_moves)}")
    print(f"Game Master Pokemon/form pools: {len(gm_pools)}")
    print(f"Move stat rows updated: {move_updates}")
    print(f"Move rows inserted: {move_inserts}")
    print(f"Pokemon pools matched: {pokemon_matched}")
    print(
        "Pokemon move assignments: "
        f"+{pokemon_inserts} ~{pokemon_updates} -{pokemon_deletes}"
    )
    print(f"Fusion pools matched: {fusion_matched}")
    print(
        "Fusion move assignments: "
        f"+{fusion_inserts} ~{fusion_updates} -{fusion_deletes}"
    )
    if not args.apply:
        print("No changes were written. Re-run with --apply to update the database.")
    return 0


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--database-url",
        help="PostgreSQL catalog URL. Defaults to the editor's production SSH session.",
    )
    parser.add_argument("--game-master-url", default=DEFAULT_GAME_MASTER_URL)
    parser.add_argument("--apply", action="store_true", help="Write changes to the database")
    return parser.parse_args(argv)


if __name__ == "__main__":
    raise SystemExit(run(parse_args(sys.argv[1:])))
