#!/usr/bin/env python3
"""Generate a compact differential fixture from a pinned PvPoke checkout.

The fixture deliberately uses PvPoke's published key matchups and counters,
not results calculated by PokeGoNexus. This lets the Go simulator compare
itself against an independent, versioned oracle in normal test runs without
vendoring PvPoke's full data set.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import subprocess
from pathlib import Path
from typing import Any


PINNED_PVPOKE_COMMIT = "f59fc0a2c78ace0b4d3b1bdcd161880e3287e4e0"
SCENARIOS = {
    "leads": {"shields": [1, 1], "energyTurns": [0, 0]},
    "closers": {"shields": [0, 0], "energyTurns": [0, 0]},
    "switches": {"shields": [1, 1], "energyTurns": [4, 0]},
    "chargers": {"shields": [1, 1], "energyTurns": [6, 0]},
    "attackers": {"shields": [0, 1], "energyTurns": [0, 0]},
}
REQUIRED_MATCHUPS = (
    ("chargers", "malamar_shadow", "tinkaton"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--pvpoke-dir",
        type=Path,
        required=True,
        help="PvPoke checkout at the pinned source commit",
    )
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--league-cp", type=int, default=1500)
    parser.add_argument(
        "--candidates-per-category",
        type=int,
        default=16,
        help="Top and percentile-spread published entries sampled per category",
    )
    parser.add_argument(
        "--matches-per-side",
        type=int,
        default=3,
        help="Published key matchups and counters sampled per candidate",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def source_commit(checkout: Path) -> str:
    return subprocess.check_output(
        ["git", "-C", str(checkout), "rev-parse", "HEAD"],
        text=True,
    ).strip()


def load_cp_multipliers(checkout: Path) -> list[float]:
    source = (checkout / "src/js/pokemon/Pokemon.js").read_text(encoding="utf-8")
    match = re.search(r"var cpms = (\[[^;]+\]);", source)
    if not match:
        raise RuntimeError("Could not read PvPoke CP multipliers")
    return [float(value) for value in json.loads(match.group(1))]


def battle_stats(
    species: dict[str, Any],
    league_cp: int,
    cp_multipliers: list[float],
) -> tuple[float, float, int]:
    if league_cp == 10000:
        level, attack_iv, defense_iv, stamina_iv = 50, 15, 15, 15
    else:
        combination = species.get("defaultIVs", {}).get(f"cp{league_cp}")
        if not combination or len(combination) < 4:
            raise RuntimeError(
                f"{species['speciesId']} has no default IVs for {league_cp}"
            )
        level, attack_iv, defense_iv, stamina_iv = combination[:4]

    cpm_index = round((float(level) - 1) * 2)
    cpm = cp_multipliers[cpm_index]
    base = species["baseStats"]
    attack = cpm * (float(base["atk"]) + float(attack_iv))
    defense = cpm * (float(base["def"]) + float(defense_iv))
    hp = max(math.floor(cpm * (float(base["hp"]) + float(stamina_iv))), 10)
    if int(species.get("dex") or 0) == 292:
        hp = 10
    return attack, defense, hp


def fixture_move(move: dict[str, Any], kind: str) -> dict[str, Any]:
    buffs = move.get("buffs") or [0, 0]
    chance = float(move.get("buffApplyChance", 1 if move.get("buffs") else 0))
    effect = {
        "AttackerAttack": 0,
        "AttackerDefense": 0,
        "TargetAttack": 0,
        "TargetDefense": 0,
        "Chance": chance,
    }
    if move.get("buffTarget") == "self":
        effect["AttackerAttack"] = int(buffs[0])
        effect["AttackerDefense"] = int(buffs[1])
    elif move.get("buffTarget") == "opponent":
        effect["TargetAttack"] = int(buffs[0])
        effect["TargetDefense"] = int(buffs[1])

    result = {
        "ID": str(move["moveId"]),
        "Name": str(move.get("name") or move["moveId"]),
        "Type": str(move["type"]),
        "Kind": kind,
        "Power": int(move.get("power") or 0),
        "EnergyGain": 0,
        "EnergyCost": 0,
        "Turns": max(1, round(float(move.get("cooldown") or 500) / 500)),
        "Buff": effect,
    }
    if kind == "fast":
        result["EnergyGain"] = int(move.get("energyGain") or 0)
    else:
        result["EnergyCost"] = int(move.get("energy") or 0)
    return result


def fixture_fighter(
    species_id: str,
    species_by_id: dict[str, dict[str, Any]],
    ranking_by_id: dict[str, dict[str, Any]],
    moves_by_id: dict[str, dict[str, Any]],
    league_cp: int,
    cp_multipliers: list[float],
) -> dict[str, Any]:
    species = species_by_id[species_id]
    ranking = ranking_by_id[species_id]
    moveset = ranking["moveset"]
    attack, defense, hp = battle_stats(species, league_cp, cp_multipliers)
    return {
        "ID": species_id,
        "Name": str(species.get("speciesName") or species_id),
        "Types": [value for value in species["types"] if value != "none"],
        "Attack": attack,
        "Defense": defense,
        "HP": hp,
        "FastMove": fixture_move(moves_by_id[moveset[0]], "fast"),
        "ChargedMoves": [
            fixture_move(moves_by_id[move_id], "charged")
            for move_id in moveset[1:]
        ],
        "Shadow": "shadow" in (species.get("tags") or []),
    }


def has_unsupported_form_change(species: dict[str, Any]) -> bool:
    return bool(species.get("formChange")) or any(
        int(value) != 0 for value in (species.get("nativeStatBuffs") or [0, 0])
    )


def stratified_candidates(
    rankings: list[dict[str, Any]],
    count: int,
) -> list[dict[str, Any]]:
    if count <= 0 or len(rankings) <= count:
        return rankings[: max(count, 0)]

    top_count = max(1, count // 2)
    indexes = list(range(top_count))
    spread_count = count - len(indexes)
    for step in range(1, spread_count + 1):
        index = round((len(rankings) - 1) * step / spread_count)
        if index not in indexes:
            indexes.append(index)
    for index in range(len(rankings)):
        if len(indexes) >= count:
            break
        if index not in indexes:
            indexes.append(index)
    return [rankings[index] for index in indexes[:count]]


def first_by_species_id(
    rows: list[dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for row in rows:
        # PvPoke uses Array.find(), so duplicate rows resolve to the first
        # entry rather than the last one.
        result.setdefault(row["speciesId"], row)
    return result


def build_fixture(args: argparse.Namespace) -> dict[str, Any]:
    checkout = args.pvpoke_dir.resolve()
    commit = source_commit(checkout)
    if commit != PINNED_PVPOKE_COMMIT:
        raise RuntimeError(
            f"PvPoke checkout is {commit}; expected {PINNED_PVPOKE_COMMIT}"
        )

    data_root = checkout / "src/data"
    species = load_json(data_root / "gamemaster/pokemon.json")
    moves = load_json(data_root / "gamemaster/moves.json")
    overall = load_json(
        data_root
        / f"rankings/all/overall/rankings-{args.league_cp}.json"
    )
    species_by_id = {item["speciesId"]: item for item in species}
    moves_by_id = {item["moveId"]: item for item in moves}
    ranking_by_id = {item["speciesId"]: item for item in overall}
    cp_multipliers = load_cp_multipliers(checkout)
    overrides_path = data_root / f"overrides/all/{args.league_cp}.json"
    overrides = load_json(overrides_path) if overrides_path.exists() else []
    overrides_by_id = first_by_species_id(overrides)

    cases: list[dict[str, Any]] = []
    fighter_ids: set[str] = set()
    excluded_form_changes: set[str] = set()
    seen_cases: set[tuple[str, str, str]] = set()
    rankings_by_category: dict[str, list[dict[str, Any]]] = {}

    for category, scenario in SCENARIOS.items():
        rankings = load_json(
            data_root
            / f"rankings/all/{category}/rankings-{args.league_cp}.json"
        )
        rankings_by_category[category] = rankings
        eligible_rankings = []
        for ranking in rankings:
            candidate_id = str(ranking["speciesId"])
            candidate = species_by_id.get(candidate_id)
            if (
                not candidate
                or candidate_id not in ranking_by_id
                or has_unsupported_form_change(candidate)
            ):
                if candidate and has_unsupported_form_change(candidate):
                    excluded_form_changes.add(candidate_id)
                continue
            eligible_rankings.append(ranking)

        for ranking in stratified_candidates(
            eligible_rankings,
            args.candidates_per_category,
        ):
            candidate_id = str(ranking["speciesId"])
            selected: list[dict[str, Any]] = []
            selected.extend((ranking.get("matchups") or [])[: args.matches_per_side])
            selected.extend((ranking.get("counters") or [])[: args.matches_per_side])
            for matchup in selected:
                opponent_id = str(matchup["opponent"])
                opponent = species_by_id.get(opponent_id)
                case_key = (category, candidate_id, opponent_id)
                if (
                    not opponent
                    or opponent_id not in ranking_by_id
                    or has_unsupported_form_change(opponent)
                    or case_key in seen_cases
                ):
                    if opponent and has_unsupported_form_change(opponent):
                        excluded_form_changes.add(opponent_id)
                    continue
                seen_cases.add(case_key)
                fighter_ids.update((candidate_id, opponent_id))
                cases.append(
                    {
                        "name": f"{category}/{candidate_id}/{opponent_id}",
                        "scenario": category,
                        "candidateId": candidate_id,
                        "opponentId": opponent_id,
                        "expectedRating": int(matchup["rating"]),
                        **scenario,
                    }
                )

    for category, candidate_id, opponent_id in REQUIRED_MATCHUPS:
        case_key = (category, candidate_id, opponent_id)
        if case_key in seen_cases:
            continue
        ranking = next(
            (
                row
                for row in rankings_by_category[category]
                if row["speciesId"] == candidate_id
            ),
            None,
        )
        if ranking is None:
            raise RuntimeError(f"Required candidate is absent: {candidate_id}")
        matchup = next(
            (
                row
                for row in (
                    list(ranking.get("matchups") or [])
                    + list(ranking.get("counters") or [])
                )
                if row["opponent"] == opponent_id
            ),
            None,
        )
        if matchup is None:
            raise RuntimeError(
                f"Required matchup is absent: {category}/{candidate_id}/{opponent_id}"
            )
        fighter_ids.update((candidate_id, opponent_id))
        cases.append(
            {
                "name": f"{category}/{candidate_id}/{opponent_id}",
                "scenario": category,
                "candidateId": candidate_id,
                "opponentId": opponent_id,
                "expectedRating": int(matchup["rating"]),
                **SCENARIOS[category],
            }
        )

    fighters = [
        fixture_fighter(
            species_id,
            species_by_id,
            ranking_by_id,
            moves_by_id,
            args.league_cp,
            cp_multipliers,
        )
        for species_id in sorted(fighter_ids)
    ]
    overall_cases = []
    for ranking in overall[:100]:
        scores = ranking.get("scores") or []
        if len(scores) < 6:
            continue
        override = overrides_by_id.get(ranking["speciesId"]) or {}
        overall_cases.append(
            {
                "speciesId": ranking["speciesId"],
                "scores": [float(value) for value in scores[:6]],
                "editorScore": (
                    float(override["editorScore"])
                    if override.get("editorScore") is not None
                    else None
                ),
                "expectedScore": float(ranking["score"]),
            }
        )
    return {
        "schemaVersion": 1,
        "source": {
            "name": "PvPoke",
            "repository": "https://github.com/pvpoke/pvpoke",
            "commit": commit,
            "license": "MIT",
            "leagueCp": args.league_cp,
            "notes": (
                "Published key matchup and counter ratings. Dynamic form-change "
                "species are tracked as an explicit unsupported parity boundary."
            ),
            "excludedFormChangeSpecies": sorted(excluded_form_changes),
        },
        "fighters": fighters,
        "cases": cases,
        "overallCases": overall_cases,
    }


def main() -> None:
    args = parse_args()
    fixture = build_fixture(args)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(fixture, indent=2, sort_keys=False) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {len(fixture['cases'])} cases and "
        f"{len(fixture['overallCases'])} overall scores using "
        f"{len(fixture['fighters'])} fighters to {args.output}"
    )


if __name__ == "__main__":
    main()
