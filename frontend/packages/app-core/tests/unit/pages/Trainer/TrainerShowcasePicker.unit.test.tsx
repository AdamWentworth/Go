import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

describe("TrainerShowcasePicker", () => {
  it("edits one showcase slot while protecting Pokemon assigned elsewhere", () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    const onClose = vi.fn();

    render(
      <TrainerShowcasePicker
        candidates={candidates}
        selectedIds={["instance-1", "instance-2", "", "", "", ""]}
        slotIndex={0}
        variantById={new Map<string, PokemonVariant>()}
        onSelect={onSelect}
        onClear={onClear}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: "Keep Pokemon #1 in featured slot 1",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", {
        name: "Pokemon #2 is already in featured slot 2",
      }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Choose Pokemon #3 for featured slot 1",
      }),
    );
    expect(onSelect).toHaveBeenCalledWith("instance-3");

    fireEvent.click(screen.getByRole("button", { name: "Clear slot" }));
    expect(onClear).toHaveBeenCalledOnce();

    fireEvent.click(
      screen.getByRole("button", { name: "Close Pokemon picker" }),
    );
    expect(
      screen.getByLabelText("Choose Pokemon for featured slot 1"),
    ).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
