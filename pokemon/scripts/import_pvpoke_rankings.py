#!/usr/bin/env python3
"""Import a versioned PvPoke overall-ranking snapshot into PostgreSQL.

PvPoke supplies battle-simulation rankings and recommended movesets. This
importer filters them to released forms that PokeGoNexus can display, attaches
local images, and atomically activates the new snapshot.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any


EDITOR_DIR = Path(__file__).resolve().parents[2] / "editor"
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from scripts.postgres_catalog import CatalogConnection, open_catalog_authoring_connection


DEFAULT_REPOSITORY = "https://github.com/pvpoke/pvpoke.git"
DEFAULT_RAW_ROOT = "https://raw.githubusercontent.com/pvpoke/pvpoke"
SOURCE_LICENSE = "MIT"
LEAGUES = {
    "great": ("1500", "cp1500"),
    "ultra": ("2500", "cp2500"),
    "master": ("10000", None),
}


@dataclass(frozen=True)
class LocalPokemon:
    pokemon_id: int
    dex: int
    name: str
    form: str
    image_url: str
    shadow_image_url: str | None


@dataclass(frozen=True)
class LocalFusion:
    fusion_id: int
    name: str
    image_url: str


@dataclass(frozen=True)
class LocalMatch:
    variant_kind: str
    pokemon_id: int | None
    fusion_id: int | None
    image_url: str


def normalize_token(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")


def canonical_form(value: Any) -> str:
    form = normalize_token(value)
    aliases = {
        "alolan": "alolan",
        "galarian": "galarian",
        "hisuian": "hisuian",
        "paldean": "paldean",
        "crowned_sword": "crowned_sword",
        "crowned_shield": "crowned_shield",
    }
    return aliases.get(form, form)


def parenthetical_form(species_name: str) -> str:
    matches = re.findall(r"\(([^)]+)\)", species_name)
    for value in matches:
        normalized = canonical_form(value)
        if normalized != "shadow":
            return normalized
    return ""


def species_base_id(species_id: str) -> tuple[str, bool]:
    normalized = normalize_token(species_id)
    if normalized.endswith("_shadow"):
        return normalized.removesuffix("_shadow"), True
    return normalized, False


def local_species_keys(pokemon: LocalPokemon) -> set[str]:
    name = normalize_token(pokemon.name)
    form = canonical_form(pokemon.form)
    return {f"{name}_{form}"} if form else {name}


def match_local_species(
    species: dict[str, Any],
    pokemon_by_dex: dict[int, list[LocalPokemon]],
    fusions: list[LocalFusion],
) -> LocalMatch | None:
    species_id, is_shadow = species_base_id(str(species.get("speciesId") or ""))
    dex = int(species.get("dex") or 0)

    fusion_aliases = {
        "kyurem_black": "black_kyurem",
        "kyurem_white": "white_kyurem",
        "necrozma_dawn_wings": "dawn_wings_necrozma",
        "necrozma_dusk_mane": "dusk_mane_necrozma",
    }
    fusion_key = fusion_aliases.get(species_id)
    if fusion_key:
        for fusion in fusions:
            if normalize_token(fusion.name) == fusion_key:
                return LocalMatch("fusion", None, fusion.fusion_id, fusion.image_url)

    candidates = pokemon_by_dex.get(dex, [])
    if not candidates:
        return None

    exact = [
        candidate
        for candidate in candidates
        if species_id in local_species_keys(candidate)
    ]
    if not exact:
        requested_form = parenthetical_form(str(species.get("speciesName") or ""))
        if requested_form:
            exact = [
                candidate
                for candidate in candidates
                if canonical_form(candidate.form) == requested_form
            ]
    if not exact:
        unformed = [candidate for candidate in candidates if not canonical_form(candidate.form)]
        exact = unformed or candidates[:1]

    candidate = exact[0]
    if is_shadow:
        if not candidate.shadow_image_url:
            return None
        return LocalMatch("shadow", candidate.pokemon_id, None, candidate.shadow_image_url)

    kind = "crown" if canonical_form(candidate.form).startswith("crowned_") else "pokemon"
    return LocalMatch(kind, candidate.pokemon_id, None, candidate.image_url)


def fetch_json(url: str) -> Any:
    request = urllib.request.Request(url, headers={"User-Agent": "PokeGoNexus PvP importer"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def resolve_source_version(repository: str, requested_ref: str) -> str:
    output = subprocess.check_output(
        ["git", "ls-remote", repository, requested_ref],
        text=True,
        timeout=45,
    ).strip()
    if not output:
        raise RuntimeError(f"Could not resolve PvPoke ref: {requested_ref}")
    return output.split()[0]


def load_local_catalog(
    connection: CatalogConnection,
) -> tuple[dict[int, list[LocalPokemon]], list[LocalFusion]]:
    cursor = connection.cursor()
    cursor.execute(
        """
        SELECT
          pokemon.pokemon_id,
          pokemon.pokedex_number,
          pokemon.name,
          COALESCE(pokemon.form, ''),
          pokemon.image_url,
          shadow_pokemon.image_url_shadow
        FROM pokemon
        LEFT JOIN shadow_pokemon USING (pokemon_id)
        WHERE pokemon.available IS TRUE
          AND pokemon.pokedex_number IS NOT NULL
          AND pokemon.image_url IS NOT NULL
        ORDER BY pokemon.pokedex_number, pokemon.pokemon_id
        """
    )
    pokemon_by_dex: dict[int, list[LocalPokemon]] = {}
    for row in cursor.fetchall():
        pokemon = LocalPokemon(
            pokemon_id=int(row[0]),
            dex=int(row[1]),
            name=str(row[2]),
            form=str(row[3] or ""),
            image_url=str(row[4]),
            shadow_image_url=str(row[5]) if row[5] else None,
        )
        pokemon_by_dex.setdefault(pokemon.dex, []).append(pokemon)

    cursor.execute(
        """
        SELECT fusion_id, name, image_url
        FROM fusion_pokemon
        WHERE available IS TRUE
          AND image_url IS NOT NULL
        ORDER BY fusion_id
        """
    )
    fusions = [
        LocalFusion(int(row[0]), str(row[1]), str(row[2]))
        for row in cursor.fetchall()
    ]
    return pokemon_by_dex, fusions


def recommended_ivs(
    pokemon: dict[str, Any],
    iv_key: str | None,
) -> tuple[float, int, int, int]:
    if iv_key:
        values = pokemon.get("defaultIVs", {}).get(iv_key)
        if isinstance(values, list) and len(values) >= 4:
            return float(values[0]), int(values[1]), int(values[2]), int(values[3])
    return 50.0, 15, 15, 15


def structured_moveset(
    ranking: dict[str, Any],
    moves_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for index, move_id in enumerate(ranking.get("moveset") or []):
        move = moves_by_id.get(str(move_id), {})
        kind = "fast" if index == 0 else "charged"
        result.append(structured_move(move_id, move, kind))
    return result


def structured_move(
    move_id: Any,
    move: dict[str, Any],
    kind: str,
) -> dict[str, Any]:
    buffs = move.get("buffs") or [0, 0]
    attacker_attack = 0
    attacker_defense = 0
    target_attack = 0
    target_defense = 0
    if move.get("buffTarget") == "self":
        attacker_attack = int(buffs[0] or 0)
        attacker_defense = int(buffs[1] or 0)
    elif move.get("buffTarget") == "opponent":
        target_attack = int(buffs[0] or 0)
        target_defense = int(buffs[1] or 0)

    energy = int(move.get("energy") or 0)
    return {
        "id": str(move_id),
        "name": str(move.get("name") or str(move_id).replace("_", " ").title()),
        "type": str(move.get("type") or "normal"),
        "kind": kind,
        "power": int(move.get("power") or 0),
        "energyGain": int(move.get("energyGain") or 0) if kind == "fast" else 0,
        "energyCost": energy if kind == "charged" else 0,
        "turns": max(1, int(move.get("turns") or 1)),
        "buff": {
            "attackerAttack": attacker_attack,
            "attackerDefense": attacker_defense,
            "targetAttack": target_attack,
            "targetDefense": target_defense,
            "chance": float(move.get("buffApplyChance") or 0),
        },
    }


def structured_matchups(ranking: dict[str, Any], key: str) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for matchup in ranking.get(key) or []:
        species_id = str(matchup.get("opponent") or "")
        rating = matchup.get("rating")
        if not species_id or rating is None:
            continue
        result.append(
            {
                "speciesId": species_id,
                "rating": float(rating),
            }
        )
    return result


def structured_move_usage(
    ranking: dict[str, Any],
    moves_by_id: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    usage = ranking.get("moves") or {}
    result: list[dict[str, Any]] = []
    for source_key, kind in (("fastMoves", "fast"), ("chargedMoves", "charged")):
        for item in usage.get(source_key) or []:
            move_id = str(item.get("moveId") or "")
            if not move_id:
                continue
            move = moves_by_id.get(move_id, {})
            result.append({
                **structured_move(move_id, move, kind),
                "uses": int(item.get("uses") or 0),
            })
    return result


def build_rows(
    league: str,
    rankings: list[dict[str, Any]],
    species_by_id: dict[str, dict[str, Any]],
    moves_by_id: dict[str, dict[str, Any]],
    pokemon_by_dex: dict[int, list[LocalPokemon]],
    fusions: list[LocalFusion],
) -> tuple[list[tuple[Any, ...]], int]:
    _cp, iv_key = LEAGUES[league]
    rows: list[tuple[Any, ...]] = []
    skipped = 0
    for source_rank, ranking in enumerate(rankings, start=1):
        species_id = str(ranking.get("speciesId") or "")
        species = species_by_id.get(species_id)
        if not species or species.get("released") is not True:
            skipped += 1
            continue
        local_match = match_local_species(species, pokemon_by_dex, fusions)
        if not local_match:
            skipped += 1
            continue
        moveset = structured_moveset(ranking, moves_by_id)
        if len(moveset) < 2:
            skipped += 1
            continue

        level, attack_iv, defense_iv, stamina_iv = recommended_ivs(species, iv_key)
        stats = ranking.get("stats") or {}
        rows.append(
            (
                league,
                len(rows) + 1,
                source_rank,
                species_id,
                str(ranking.get("speciesName") or species.get("speciesName") or species_id),
                local_match.pokemon_id,
                local_match.fusion_id,
                local_match.variant_kind,
                local_match.image_url,
                json.dumps([value for value in species.get("types") or [] if value != "none"]),
                json.dumps(moveset),
                float(ranking.get("score") or 0),
                float(ranking.get("rating") or 0),
                json.dumps(ranking.get("scores") or []),
                json.dumps(structured_matchups(ranking, "matchups")),
                json.dumps(structured_matchups(ranking, "counters")),
                json.dumps(structured_move_usage(ranking, moves_by_id)),
                level,
                attack_iv,
                defense_iv,
                stamina_iv,
                float(stats["product"]) if stats.get("product") is not None else None,
                float(stats["atk"]) if stats.get("atk") is not None else None,
                float(stats["def"]) if stats.get("def") is not None else None,
                int(stats["hp"]) if stats.get("hp") is not None else None,
            )
        )
    return rows, skipped


def import_snapshot(
    connection: CatalogConnection,
    source_version: str,
    raw_root: str,
) -> dict[str, Any]:
    source_base = f"{raw_root.rstrip('/')}/{source_version}/src/data"
    species_list = fetch_json(f"{source_base}/gamemaster/pokemon.json")
    move_list = fetch_json(f"{source_base}/gamemaster/moves.json")
    species_by_id = {str(item["speciesId"]): item for item in species_list}
    moves_by_id = {str(item["moveId"]): item for item in move_list}
    pokemon_by_dex, fusions = load_local_catalog(connection)

    all_rows: list[tuple[Any, ...]] = []
    imported_counts: dict[str, int] = {}
    skipped_counts: dict[str, int] = {}
    for league, (cp, _iv_key) in LEAGUES.items():
        rankings = fetch_json(
            f"{source_base}/rankings/all/overall/rankings-{cp}.json"
        )
        rows, skipped = build_rows(
            league,
            rankings,
            species_by_id,
            moves_by_id,
            pokemon_by_dex,
            fusions,
        )
        all_rows.extend(rows)
        imported_counts[league] = len(rows)
        skipped_counts[league] = skipped

    snapshot_id = f"pvpoke-{source_version}"
    metadata = {
        "importedCounts": imported_counts,
        "skippedCounts": skipped_counts,
        "method": "PvPoke all/overall battle-simulation rankings filtered to the PokeGoNexus catalog",
    }
    cursor = connection.cursor()
    cursor.execute("UPDATE pvp_ranking_snapshots SET is_active = FALSE WHERE is_active = TRUE")
    cursor.execute(
        """
        INSERT INTO pvp_ranking_snapshots (
          snapshot_id, source_name, source_version, source_url, source_license,
          is_active, metadata
        ) VALUES (?, 'PvPoke', ?, ?, ?, TRUE, ?::JSONB)
        ON CONFLICT (snapshot_id) DO UPDATE SET
          source_name = EXCLUDED.source_name,
          source_version = EXCLUDED.source_version,
          source_url = EXCLUDED.source_url,
          source_license = EXCLUDED.source_license,
          imported_at = CURRENT_TIMESTAMP,
          is_active = TRUE,
          metadata = EXCLUDED.metadata
        """,
        (
            snapshot_id,
            source_version,
            f"https://github.com/pvpoke/pvpoke/tree/{source_version}",
            SOURCE_LICENSE,
            json.dumps(metadata),
        ),
    )
    cursor.execute("DELETE FROM pvp_rankings WHERE snapshot_id = ?", (snapshot_id,))
    cursor.executemany(
        """
        INSERT INTO pvp_rankings (
          snapshot_id, league, rank, source_rank, species_id, species_name,
          pokemon_id, fusion_id, variant_kind, image_url, types, moveset,
          score, rating, category_scores, matchups, counters, move_usage,
          recommended_level, attack_iv, defense_iv, stamina_iv, stat_product,
          battle_attack, battle_defense, battle_hp
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::JSONB, ?::JSONB, ?, ?, ?::JSONB,
          ?::JSONB, ?::JSONB, ?::JSONB, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """,
        [(snapshot_id, *row) for row in all_rows],
    )
    connection.commit()
    return metadata


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database-url")
    parser.add_argument("--ref", default="refs/heads/master")
    parser.add_argument("--source-version")
    parser.add_argument("--repository", default=DEFAULT_REPOSITORY)
    parser.add_argument("--raw-root", default=DEFAULT_RAW_ROOT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_version = args.source_version or resolve_source_version(args.repository, args.ref)
    with open_catalog_authoring_connection(args.database_url) as connection:
        metadata = import_snapshot(connection, source_version, args.raw_root)
    print(f"Imported PvPoke snapshot {source_version}.")
    for league in LEAGUES:
        print(
            f"{league}: {metadata['importedCounts'][league]} imported, "
            f"{metadata['skippedCounts'][league]} omitted"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
