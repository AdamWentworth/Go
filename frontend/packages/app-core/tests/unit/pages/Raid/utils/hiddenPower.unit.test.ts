import { describe, expect, it } from "vitest";

import {
  HIDDEN_POWER_TYPES,
  expandHiddenPowerFastMoves,
} from "@/pages/Raid/utils/hiddenPower";
import type { Move } from "@/types/pokemonSubTypes";

const move = (overrides: Partial<Move> = {}): Move =>
  ({
    move_id: 58,
    name: "Hidden Power",
    type_id: 13,
    raid_power: 15,
    pvp_power: 9,
    raid_energy: 15,
    pvp_energy: 8,
    raid_cooldown: 1500,
    pvp_turns: 3,
    is_fast: 1,
    type_name: "Normal",
    legacy: false,
    type: "normal",
    ...overrides,
  }) as Move;

describe("Hidden Power raid candidates", () => {
  it("expands the Normal catalog placeholder into all 16 legal GO types", () => {
    const source = move();
    const candidates = expandHiddenPowerFastMoves([source]);

    expect(candidates).toHaveLength(16);
    expect(candidates.map((candidate) => candidate.type)).toEqual(
      HIDDEN_POWER_TYPES.map(({ name }) => name),
    );
    expect(candidates.map((candidate) => candidate.type)).not.toContain(
      "normal",
    );
    expect(candidates.map((candidate) => candidate.type)).not.toContain(
      "fairy",
    );
    expect(candidates).toContainEqual(
      expect.objectContaining({
        name: "Hidden Power (Ground)",
        type_id: 11,
        type_name: "ground",
        type: "ground",
        raid_power: 15,
        raid_energy: 15,
        raid_cooldown: 1500,
      }),
    );
    expect(source).toEqual(
      expect.objectContaining({
        name: "Hidden Power",
        type_id: 13,
        type_name: "Normal",
        type: "normal",
      }),
    );
  });

  it("leaves ordinary moves and already modeled labels alone", () => {
    const ordinaryMove = move({
      move_id: 1,
      name: "Pound",
      type_id: 13,
    });
    const modeledMove = move({
      name: "Hidden Power (Ice)",
      type_id: 12,
      type_name: "ice",
      type: "ice",
    });

    expect(expandHiddenPowerFastMoves([ordinaryMove, modeledMove])).toEqual([
      ordinaryMove,
      modeledMove,
    ]);
  });
});
