import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import TrainerShowcasePicker from "@/pages/Trainer/TrainerShowcasePicker";
import type { PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";

const candidates = Array.from({ length: 7 }, (_, index) => {
  const pokemonId = index + 1;
  return {
    instance_id: `instance-${pokemonId}`,
    variant_id: `${String(pokemonId).padStart(4, "0")}-default`,
    pokemon_id: pokemonId,
    nickname: null,
    cp: 1_000 + pokemonId,
    is_caught: true,
    disabled: false,
    favorite: false,
  } as PokemonInstance;
});

const PickerHarness = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <TrainerShowcasePicker
      candidates={candidates}
      selectedIds={selectedIds}
      variantById={new Map<string, PokemonVariant>()}
      onToggle={(instanceId) =>
        setSelectedIds((current) =>
          current.includes(instanceId)
            ? current.filter((value) => value !== instanceId)
            : [...current, instanceId].slice(0, 6),
        )
      }
    />
  );
};

describe("TrainerShowcasePicker", () => {
  it("numbers selections, caps the trainer card at six, and reopens a slot", () => {
    render(<PickerHarness />);

    for (let pokemonId = 1; pokemonId <= 6; pokemonId += 1) {
      fireEvent.click(
        screen.getByRole("button", {
          name: `Select Pokemon #${pokemonId} for trainer card`,
        }),
      );
    }

    expect(screen.getByLabelText("6 of 6 Pokemon selected")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Select Pokemon #7 for trainer card",
      }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove Pokemon #3 from trainer card",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Select Pokemon #7 for trainer card",
      }),
    ).toBeEnabled();
    expect(screen.getByLabelText("5 of 6 Pokemon selected")).toBeInTheDocument();
  });
});
