import { describe, expect, it } from "vitest";

import {
  normalizeTrainerShowcaseSlots,
  reorderTrainerShowcaseSlots,
} from "@/pages/Trainer/trainerShowcaseSlots";

describe("trainerShowcaseSlots", () => {
  it("moves a featured Pokemon while preserving a compact six-slot list", () => {
    expect(
      reorderTrainerShowcaseSlots(
        ["bulbasaur", "charmander", "squirtle", "", "", ""],
        0,
        2,
      ),
    ).toEqual([
      "charmander",
      "squirtle",
      "bulbasaur",
      "",
      "",
      "",
    ]);
  });

  it("treats an empty destination as moving the Pokemon to the end", () => {
    expect(
      reorderTrainerShowcaseSlots(
        ["bulbasaur", "charmander", "squirtle", "", "", ""],
        0,
        5,
      ),
    ).toEqual([
      "charmander",
      "squirtle",
      "bulbasaur",
      "",
      "",
      "",
    ]);
  });

  it("does not mutate the source list and ignores invalid source slots", () => {
    const source = ["bulbasaur", "charmander", "", "", "", ""];

    expect(reorderTrainerShowcaseSlots(source, 4, 0)).toEqual(source);
    expect(source).toEqual([
      "bulbasaur",
      "charmander",
      "",
      "",
      "",
      "",
    ]);
    expect(
      normalizeTrainerShowcaseSlots([
        "",
        "bulbasaur",
        "",
        "charmander",
      ]),
    ).toEqual([
      "bulbasaur",
      "charmander",
      "",
      "",
      "",
      "",
    ]);
  });
});
