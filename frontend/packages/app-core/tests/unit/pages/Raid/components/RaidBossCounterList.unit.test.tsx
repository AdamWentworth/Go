import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RaidBossCounterList from "@/pages/Raid/components/RaidBossCounterList";
import type { RaidCounterScore } from "@/pages/Raid/utils/raidTypes";
import type { PokemonVariant } from "@/types/pokemonVariants";

vi.mock("@/pages/Raid/components/RaidPokemonImage", () => ({
  default: () => <div data-testid="pokemon-image" />,
}));

describe("RaidBossCounterList", () => {
  it("shows sustained attacker DPS separately from finite-boss simulation timing", () => {
    const score = {
      variant: {
        variant_id: "6-mega-y",
        variantType: "mega_y",
        name: "Mega Charizard Y",
        species_name: "Charizard",
      } as unknown as PokemonVariant,
      fastMove: { name: "Fire Spin", type_name: "Fire" },
      chargedMove: { name: "Blast Burn", type_name: "Fire" },
      cp: 5037,
      sustainedDps: 72.4,
      dps: 63.2,
      soloTimeSeconds: 10,
      trainersNeeded: 1,
      faints: 0,
      relobbies: 0,
      dodges: 0,
      partyPoweredChargedMoves: 0,
      simulationDistribution: null,
    } as RaidCounterScore;

    render(<RaidBossCounterList scores={[score]} attackerLevel="50.0" />);

    expect(screen.getByText("72.4 DPS")).toBeInTheDocument();
    expect(screen.queryByText("63.2 DPS")).not.toBeInTheDocument();
    expect(screen.getByText("1 trainer")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Fast move: Fire Spin, Fire type"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Charged move: Blast Burn, Fire type"),
    ).toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Faints")).toBeInTheDocument();
    expect(screen.queryByText(/P50|P90/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Rank 1, gold podium")).toBeInTheDocument();
  });

  it("keeps modeled ranges available in plain-language accessible details", () => {
    const score = {
      variant: {
        variant_id: "384-mega",
        variantType: "mega",
        name: "Mega Rayquaza",
        species_name: "Rayquaza",
      } as unknown as PokemonVariant,
      fastMove: { name: "Air Slash", type_name: "Flying" },
      chargedMove: { name: "Dragon Ascent", type_name: "Flying" },
      cp: 5713,
      sustainedDps: 90.1,
      dps: 88.4,
      soloTimeSeconds: 10,
      trainersNeeded: 1,
      faints: 0,
      relobbies: 0,
      dodges: 0,
      partyPoweredChargedMoves: 0,
      simulationDistribution: {
        sampleCount: 12,
        winRate: 1,
        timeToWinSeconds: { p10: 9, p50: 10, p90: 11 },
        faints: { p10: 0, p50: 0, p90: 1 },
        relobbies: { p10: 0, p50: 0, p90: 0 },
      },
    } as RaidCounterScore;

    render(<RaidBossCounterList scores={[score]} attackerLevel="50.0" />);

    expect(
      screen.getByLabelText(
        "Expected clear time 10s. Likely range 9s to 11s. Based on 12 modeled outcomes.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "Expected 0 faints and 0 relobbies. High estimate 1 faint and 0 relobbies. Based on 12 modeled outcomes.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/modeled outcomes/i)).not.toBeInTheDocument();
  });
});
