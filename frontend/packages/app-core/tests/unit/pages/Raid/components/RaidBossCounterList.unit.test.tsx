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
      fastMove: { name: "Fire Spin" },
      chargedMove: { name: "Blast Burn" },
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
    expect(screen.getByLabelText("Rank 1, gold podium")).toBeInTheDocument();
  });
});
