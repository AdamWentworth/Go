import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RaidBossDetails from "@/pages/Raid/components/RaidBossDetails";
import { RAID_TIER_PRESETS } from "@/pages/Raid/utils/raidRules";

describe("RaidBossDetails", () => {
  it("shows the Super Mega shield and actual-Mega requirement", () => {
    render(
      <RaidBossDetails
        tier={RAID_TIER_PRESETS["super-mega"]}
        bossStats={{
          bossCp: 99_000,
          attack: 300,
          defense: 200,
          hp: 25_000,
          timeLimitSeconds: 300,
        }}
        groupEstimate={{
          topTeamDps: 100,
          minTrainers: 10,
          comfortableTrainers: 12,
          soloTimeSeconds: 250,
          superMega: {
            shieldCount: 10,
            shieldCountSource: "catalog",
            assumesMegaPerTrainer: true,
          },
        }}
        metadata={null}
      />,
    );

    expect(screen.getByText("10 shields")).toBeInTheDocument();
    expect(
      screen.getByText("Plan for 10 Trainers with a Mega Pokémon"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Primal Pokémon cannot break shields/),
    ).toBeInTheDocument();
  });
});
