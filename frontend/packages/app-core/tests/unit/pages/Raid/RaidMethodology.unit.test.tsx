import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import RaidMethodology from "@/pages/Raid/RaidMethodology";

describe("Raid methodology page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("explains each ranking mode and links back to raid rankings", () => {
    render(
      <MemoryRouter>
        <RaidMethodology />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "How raid rankings work" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "All types" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "By type" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Boss counters" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/catalog-doc-test/i)).not.toBeInTheDocument();

    for (const link of screen.getAllByRole("link", { name: /raid rankings/i })) {
      expect(link).toHaveAttribute("href", "/raid");
    }
  });

  it("documents the visible metrics and personalized data policy", () => {
    render(
      <MemoryRouter>
        <RaidMethodology />
      </MemoryRouter>,
    );

    for (const metric of ["eDPS", "DPS", "TDO", "ER", "CP"]) {
      expect(screen.getByRole("heading", { name: metric })).toBeInTheDocument();
    }
    expect(
      screen.getByRole("heading", { name: "My Pokemon means your actual Pokemon" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/silently promoted to level 50/i)).toBeInTheDocument();
    expect(screen.getByText(/damage = floor/i)).toBeInTheDocument();
  });

  it("documents Super Mega shield rules without mixing in Max Battles", () => {
    render(
      <MemoryRouter>
        <RaidMethodology />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Shield phases need real Mega Pokemon" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Primal Reversions do not count/i)).toBeInTheDocument();
    expect(screen.getByText(/provisional 8-shield value/i)).toBeInTheDocument();
    expect(screen.getByText(/Max Battles use different rules/i)).toBeInTheDocument();
  });
});
