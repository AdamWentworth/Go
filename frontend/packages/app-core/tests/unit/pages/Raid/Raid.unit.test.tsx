import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import Raid from "@/pages/Raid/Raid";
import type { PokemonVariant } from "@/types/pokemonVariants";
import type { Move } from "@/types/pokemonSubTypes";

type RaidTestVariantOverrides = Omit<
  Partial<PokemonVariant>,
  "moves" | "raid_boss"
> &
  Pick<PokemonVariant, "name" | "variant_id"> & {
    moves?: Move[];
    raid_boss?: unknown[];
  };

const mocks = vi.hoisted(() => ({
  storeState: {
    variants: [] as PokemonVariant[],
    variantsLoading: false,
    isMovesLoading: false,
    isRaidDataLoading: false,
    ensureMoves: vi.fn(),
    ensureRaidData: vi.fn(),
  },
}));

vi.mock("@/features/variants/store/useVariantsStore", () => ({
  useVariantsStore: (selector: (state: typeof mocks.storeState) => unknown) =>
    selector(mocks.storeState),
}));

vi.mock("@/components/LoadingSpinner", () => ({
  default: () => <div data-testid="loading-spinner">Loading</div>,
}));

const move = (
  name: string,
  type: string,
  isFast: 0 | 1,
  power: number,
  cooldown: number,
  energy: number,
) =>
  ({
    name,
    type,
    type_name: type,
    is_fast: isFast,
    raid_power: power,
    raid_cooldown: cooldown,
    raid_energy: energy,
  }) as unknown as Move;

const variant = (overrides: RaidTestVariantOverrides): PokemonVariant =>
  ({
    pokemon_id: overrides.pokemon_id ?? 150,
    pokedex_number: overrides.pokedex_number ?? 150,
    name: overrides.name,
    species_name: overrides.species_name ?? overrides.name,
    attack: overrides.attack ?? 300,
    defense: overrides.defense ?? 182,
    stamina: overrides.stamina ?? 214,
    type_1_id: overrides.type_1_id ?? 15,
    type_2_id: overrides.type_2_id ?? 0,
    type1_name: overrides.type1_name ?? "psychic",
    type2_name: overrides.type2_name ?? "none",
    form: overrides.form,
    megaForm: overrides.megaForm,
    variantType: overrides.variantType ?? "default",
    currentImage: overrides.currentImage ?? "/images/missing-pokemon.png",
    image_url: overrides.image_url ?? "",
    sprite_url: overrides.sprite_url ?? "",
    moves: overrides.moves ?? [
      move("Confusion", "psychic", 1, 20, 1600, 15),
      move("Psystrike", "psychic", 0, 95, 2300, -50),
    ],
    raid_boss: (overrides.raid_boss ??
      []) as unknown as PokemonVariant["raid_boss"],
    backgrounds: [],
    variant_id: overrides.variant_id,
  }) as unknown as PokemonVariant;

describe("Raid page", () => {
  beforeEach(() => {
    mocks.storeState.variantsLoading = false;
    mocks.storeState.isMovesLoading = false;
    mocks.storeState.isRaidDataLoading = false;
    mocks.storeState.variants = [
      variant({
        name: "Mewtwo",
        variant_id: "mewtwo-default",
        raid_boss: [
          {
            id: 1,
            tier: "5-star",
            min_unboosted_cp: 2294,
            max_unboosted_cp: 2387,
            min_boosted_cp: 2868,
            max_boosted_cp: 2984,
          },
        ],
      }),
      variant({
        name: "Tyranitar",
        variant_id: "tyranitar-default",
        pokemon_id: 248,
        pokedex_number: 248,
        attack: 251,
        defense: 207,
        stamina: 225,
        type_1_id: 16,
        type_2_id: 2,
        type1_name: "rock",
        type2_name: "dark",
        moves: [
          move("Bite", "dark", 1, 6, 500, 4),
          move("Brutal Swing", "dark", 0, 65, 1900, -33),
        ],
      }),
      variant({
        name: "Gengar",
        variant_id: "gengar-default",
        pokemon_id: 94,
        pokedex_number: 94,
        attack: 261,
        defense: 149,
        stamina: 155,
        type_1_id: 9,
        type_2_id: 14,
        type1_name: "ghost",
        type2_name: "poison",
        moves: [
          move("Lick", "ghost", 1, 5, 500, 6),
          move("Shadow Ball", "ghost", 0, 100, 3000, -50),
        ],
      }),
      variant({
        name: "Absol",
        variant_id: "absol-default",
        pokemon_id: 359,
        pokedex_number: 359,
        attack: 246,
        defense: 120,
        stamina: 163,
        type_1_id: 2,
        type_2_id: 0,
        type1_name: "dark",
        type2_name: "none",
        moves: [
          move("Psycho Cut", "psychic", 1, 5, 600, 8),
          move("Dark Pulse", "dark", 0, 80, 3000, -50),
        ],
      }),
      variant({
        name: "Raikou",
        variant_id: "raikou-default",
        pokemon_id: 243,
        pokedex_number: 243,
        attack: 241,
        defense: 195,
        stamina: 207,
        type_1_id: 4,
        type_2_id: 0,
        type1_name: "electric",
        type2_name: "none",
        moves: [
          move("Thunder Shock", "electric", 1, 5, 600, 8),
          move("Wild Charge", "electric", 0, 90, 2600, -50),
        ],
        raid_boss: [
          {
            id: 2,
            tier: "5",
            min_unboosted_cp: 1889,
            max_unboosted_cp: 1972,
            min_boosted_cp: 2361,
            max_boosted_cp: 2466,
          },
        ],
      }),
      variant({
        name: "Shiny Tyranitar",
        variant_id: "tyranitar-shiny",
        pokemon_id: 248,
        pokedex_number: 248,
        variantType: "shiny",
        moves: [
          move("Bite", "dark", 1, 6, 500, 4),
          move("Brutal Swing", "dark", 0, 65, 1900, -33),
        ],
      }),
    ];
  });

  it("renders loading spinner while variants are loading", () => {
    mocks.storeState.variantsLoading = true;

    render(<Raid />);

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });

  it("renders the selected boss and metadata-backed raid tier", () => {
    render(<Raid />);

    fireEvent.click(screen.getByRole("button", { name: "Boss counters" }));

    expect(
      screen.getByRole("button", { name: "Boss counters" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Build a raid team/i)).not.toBeInTheDocument();
    expect(screen.getByText("Boss CP")).toBeInTheDocument();
    expect(screen.getAllByText("5-star").length).toBeGreaterThan(0);
    expect(
      screen.getByText((_, element) => element?.textContent === "1889 - 1972"),
    ).toBeInTheDocument();
  });

  it("keeps raid boss choices hidden until searching", () => {
    render(<Raid />);

    fireEvent.click(screen.getByRole("button", { name: "Boss counters" }));

    expect(
      screen.queryByLabelText("Raid boss suggestions"),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/find boss/i), {
      target: { value: "raikou" },
    });

    const suggestions = screen.getByLabelText("Raid boss suggestions");
    fireEvent.click(
      within(suggestions).getByRole("button", { name: /raikou/i }),
    );

    expect(screen.getByRole("heading", { name: "Raikou" })).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Raid boss suggestions"),
    ).not.toBeInTheDocument();
  });

  it("supports current raid modifiers and filters eligible counter results", () => {
    render(<Raid />);

    fireEvent.click(screen.getByRole("button", { name: "Boss counters" }));

    expect(screen.getByLabelText(/relobby delay/i)).toHaveValue("10");
    expect(screen.getByLabelText(/boss behavior/i)).toHaveValue("expected");
    expect(screen.getByLabelText(/dodging/i)).toHaveValue("none");
    expect(
      within(screen.getByLabelText("Raid counters")).getAllByText(/faints/)
        .length,
    ).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/boss behavior/i), {
      target: { value: "monte-carlo" },
    });
    expect(screen.getByLabelText(/boss behavior/i)).toHaveValue(
      "monte-carlo",
    );
    fireEvent.change(screen.getByLabelText(/dodging/i), {
      target: { value: "charged" },
    });
    expect(screen.getByLabelText(/dodging/i)).toHaveValue("charged");
    expect(screen.getAllByText(/modeled outcomes/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Shadow raid" }));
    expect(screen.getByText("Purified Gem reminder")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/counter search/i), {
      target: { value: "tyranitar" },
    });

    const counterList = screen.getByLabelText("Raid counters");
    expect(within(counterList).getByText("Tyranitar")).toBeInTheDocument();
    expect(within(counterList).queryByText("Gengar")).not.toBeInTheDocument();
    expect(
      within(counterList).queryByText("Shiny Tyranitar"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Best moves" }));
    expect(
      screen.getByRole("button", { name: "All moves" }),
    ).toBeInTheDocument();
  });

  it("opens on an overall raid attacker leaderboard", () => {
    render(<Raid />);

    expect(screen.getByRole("button", { name: "Overall" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Top raid attackers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "How rankings work" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/AdamWentworth/PokeGoNexus/blob/master/docs/raid-ranking-methodology.md",
    );
    expect(screen.queryByLabelText("Type DPS pages")).not.toBeInTheDocument();
    expect(screen.queryByText("Boss CP")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/relobby delay/i)).not.toBeInTheDocument();

    const settingsButton = screen.getByRole("button", { name: "Settings" });
    expect(settingsButton).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(settingsButton);

    expect(settingsButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText(/relobby delay/i)).toHaveValue("10");
    expect(screen.queryByLabelText(/boss movesets/i)).not.toBeInTheDocument();
    expect(screen.getByText("Neutral typeless benchmark")).toBeInTheDocument();

    const counterList = screen.getByLabelText("Top raid attackers");
    expect(
      within(counterList).getByRole("columnheader", { name: "Pokémon" }),
    ).toBeInTheDocument();
    expect(
      within(counterList).getByRole("columnheader", { name: "Moves" }),
    ).toBeInTheDocument();
    for (const metric of ["eDPS", "DPS", "TDO", "ER", "CP"]) {
      expect(
        within(counterList).getByRole("button", {
          name: new RegExp(`Sort by ${metric}`, "i"),
        }),
      ).toBeInTheDocument();
    }
    expect(within(counterList).getByText("Gengar")).toBeInTheDocument();
    expect(
      within(counterList).queryByText("Shiny Tyranitar"),
    ).not.toBeInTheDocument();
    expect(
      within(counterList).getByLabelText(
        "Fast move: Lick, Ghost type",
      ),
    ).toBeInTheDocument();
    expect(within(counterList).getAllByAltText("Ghost type").length).toBeGreaterThan(0);
    expect(within(counterList).queryByText("Fast Ghost")).not.toBeInTheDocument();
  });

  it("normalizes the padded Mega Mewtwo Y artwork in raid layouts", () => {
    mocks.storeState.variants = [
      variant({
        name: "Mega Mewtwo Y",
        variant_id: "mewtwo-mega-y",
        pokemon_id: 150,
        pokedex_number: 150,
        variantType: "mega_y",
        megaForm: "Y",
        currentImage: "/images/mega/mega_150_Y.png?v=content-hash",
      }),
    ];

    const { container } = render(<Raid />);
    const image = container.querySelector<HTMLImageElement>(
      'img[src*="/images/mega/mega_150_Y.png"]',
    );

    expect(image).not.toBeNull();
    expect(image).toHaveClass("raid-pokemon-image--mega-mewtwo-y");
  });

  it("sorts the overall leaderboard by every displayed raid metric", () => {
    render(<Raid />);

    const counterList = screen.getByLabelText("Top raid attackers");
    const eDpsSort = within(counterList).getByRole("button", {
      name: /Sort by eDPS/i,
    });
    expect(eDpsSort.closest("th")).toHaveAttribute("aria-sort", "descending");

    const cpSort = within(counterList).getByRole("button", {
      name: /Sort by CP/i,
    });
    fireEvent.click(cpSort);

    expect(cpSort.closest("th")).toHaveAttribute("aria-sort", "descending");
    const descendingRows = within(counterList).getAllByRole("row").slice(1);
    const pokemonName = (row: HTMLElement | undefined) =>
      row?.querySelector(".raid-type-table-pokemon-copy strong")?.textContent;
    const descendingFirst = pokemonName(descendingRows[0]);
    const descendingLast = pokemonName(descendingRows.at(-1));

    fireEvent.click(cpSort);

    expect(cpSort.closest("th")).toHaveAttribute("aria-sort", "ascending");
    const ascendingRows = within(counterList).getAllByRole("row").slice(1);
    expect(pokemonName(ascendingRows[0])).toBe(descendingLast);
    expect(pokemonName(ascendingRows.at(-1))).toBe(descendingFirst);

    for (const metric of ["DPS", "TDO", "ER"]) {
      const metricSort = within(counterList).getByRole("button", {
        name: new RegExp(`Sort by ${metric}`, "i"),
      });
      fireEvent.click(metricSort);
      expect(metricSort.closest("th")).toHaveAttribute(
        "aria-sort",
        "descending",
      );
    }
  });

  it("keeps historical boss typings out of neutral overall moveset selection", () => {
    const bossOnlyMoves = [
      move("Tackle", "normal", 1, 0, 500, 6),
      move("Struggle", "normal", 0, 0, 2000, -33),
    ];

    mocks.storeState.variants = [
      variant({
        name: "Mega Mewtwo Y",
        variant_id: "mewtwo-mega-y",
        pokemon_id: 150,
        pokedex_number: 150,
        attack: 388,
        defense: 202,
        stamina: 228,
        type1_name: "psychic",
        type2_name: "none",
        variantType: "mega",
        moves: [
          move("Psycho Cut", "psychic", 1, 5, 600, 8),
          move("Confusion", "psychic", 1, 20, 1600, 15),
          move("Psystrike", "psychic", 0, 95, 2300, -50),
          move("Shadow Ball", "ghost", 0, 100, 3000, -50),
        ],
      }),
      ...Array.from({ length: 8 }, (_, index) =>
        variant({
          name: `Psychic Boss ${index + 1}`,
          variant_id: `target-psychic-${index + 1}`,
          pokemon_id: 9000 + index,
          pokedex_number: 9000 + index,
          type1_name: "psychic",
          type2_name: "none",
          moves: bossOnlyMoves,
          raid_boss: [
            {
              id: 9000 + index,
              tier: "5",
              form: "Normal",
              name: `Psychic Boss ${index + 1}`,
            },
          ],
        }),
      ),
    ];

    render(<Raid />);

    const counterList = screen.getByLabelText("Top raid attackers");
    const dataRows = within(counterList).getAllByRole("row").slice(1);

    expect(dataRows[0]).toHaveTextContent("Mega Mewtwo Y");
    expect(dataRows[0]).toHaveTextContent("Psystrike");
    expect(dataRows[0]).not.toHaveTextContent("Shadow Ball");
  });

  it("labels Hidden Power with the modeled type and matching type icon", () => {
    mocks.storeState.variants = [
      variant({
        name: "Shadow Regigigas",
        variant_id: "regigigas-shadow",
        pokemon_id: 486,
        pokedex_number: 486,
        attack: 287,
        defense: 210,
        stamina: 221,
        type1_name: "normal",
        type2_name: "none",
        variantType: "shadow",
        moves: [
          move("Hidden Power", "normal", 1, 15, 1500, 15),
          move("Giga Impact", "normal", 0, 200, 4700, -100),
        ],
      }),
      variant({
        name: "Electric Raid Boss",
        variant_id: "electric-raid-boss",
        pokemon_id: 9000,
        pokedex_number: 9000,
        type1_name: "electric",
        type2_name: "none",
        moves: [
          move("Tackle", "normal", 1, 0, 500, 6),
          move("Struggle", "normal", 0, 0, 2000, -33),
        ],
        raid_boss: [
          { id: 9000, tier: "5", form: "Normal", name: "Electric Raid Boss" },
        ],
      }),
    ];

    render(<Raid />);

    const counterList = screen.getByLabelText("Top raid attackers");
    expect(
      within(counterList).getByLabelText(
        "Fast move: Hidden Power (Ground), Ground type",
      ),
    ).toBeInTheDocument();
    expect(within(counterList).getByAltText("Ground type")).toBeInTheDocument();
    expect(
      within(counterList).queryByLabelText(
        "Fast move: Hidden Power, Normal type",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows one ordinary raid entry instead of Dynamax and Gigantamax copies", () => {
    const metagrossRaid = [
      { id: 376, tier: "3", form: "Normal", name: "Metagross" },
    ];
    mocks.storeState.variants = [
      variant({
        name: "Metagross",
        variant_id: "metagross-default",
        pokemon_id: 376,
        pokedex_number: 376,
        raid_boss: metagrossRaid,
      }),
      variant({
        name: "Dynamax Metagross",
        variant_id: "metagross-dynamax",
        pokemon_id: 376,
        pokedex_number: 376,
        variantType: "dynamax",
        raid_boss: metagrossRaid,
      }),
      variant({
        name: "Gigantamax Metagross",
        variant_id: "metagross-gigantamax",
        pokemon_id: 376,
        pokedex_number: 376,
        variantType: "gigantamax",
        raid_boss: metagrossRaid,
      }),
    ];

    render(<Raid />);

    fireEvent.change(screen.getByLabelText(/attacker search/i), {
      target: { value: "metagross" },
    });
    const leaderboard = screen.getByLabelText("Top raid attackers");
    expect(within(leaderboard).getByText("Metagross")).toBeInTheDocument();
    expect(within(leaderboard).queryByText("Dynamax Metagross")).not.toBeInTheDocument();
    expect(within(leaderboard).queryByText("Gigantamax Metagross")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Boss counters" }));
    fireEvent.change(screen.getByLabelText(/find boss/i), {
      target: { value: "metagross" },
    });
    const suggestions = screen.getByLabelText("Raid boss suggestions");
    expect(within(suggestions).getAllByRole("button")).toHaveLength(1);
    expect(within(suggestions).getByRole("button")).toHaveTextContent(
      "Metagross",
    );
  });

  it("shows type DPS pages using fast or charged moves that match the selected type", () => {
    render(<Raid />);

    fireEvent.click(screen.getByRole("button", { name: "By type" }));

    expect(screen.getByRole("heading", { name: "Dark" })).toBeInTheDocument();
    expect(
      screen.getByText(/same eDPS, DPS, TDO, ER, and CP metrics as Overall/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Type DPS pages")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Dark" }).length,
    ).toBeGreaterThan(0);

    const counterList = screen.getByLabelText("Type DPS counters");
    expect(
      within(counterList).getByRole("columnheader", { name: "Pokémon" }),
    ).toBeInTheDocument();
    expect(
      within(counterList).getByRole("columnheader", { name: "Moves" }),
    ).toBeInTheDocument();
    for (const metric of ["eDPS", "DPS", "TDO", "ER", "CP"]) {
      expect(
        within(counterList).getByRole("button", {
          name: new RegExp(`Sort by ${metric}`, "i"),
        }),
      ).toBeInTheDocument();
    }
    const tdoSort = within(counterList).getByRole("button", {
      name: /Sort by TDO/i,
    });
    fireEvent.click(tdoSort);
    expect(tdoSort.closest("th")).toHaveAttribute("aria-sort", "descending");
    expect(within(counterList).getByText("Tyranitar")).toBeInTheDocument();
    expect(within(counterList).getByText("Absol")).toBeInTheDocument();
    expect(within(counterList).queryByText("Gengar")).not.toBeInTheDocument();
    expect(
      within(counterList).queryByText("Shiny Tyranitar"),
    ).not.toBeInTheDocument();
    expect(within(counterList).getAllByAltText("Dark type").length).toBeGreaterThan(0);
    expect(within(counterList).queryByText("Charged Dark")).not.toBeInTheDocument();
  });
});
