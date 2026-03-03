import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InstanceOverlay from '@/pages/Pokemon/features/instances/InstanceOverlay';

vi.mock('@/components/OverlayPortal', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="overlay-portal">{children}</div>
  ),
}));

vi.mock('@/components/WindowOverlay', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="window-overlay">{children}</div>
  ),
}));

vi.mock('@/components/CloseButton', () => ({
  default: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      close
    </button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/CaughtInstance', () => ({
  default: () => <div data-testid="caught-instance" />,
}));

vi.mock('@/pages/Pokemon/features/instances/TradeInstance', () => ({
  default: () => <div data-testid="trade-instance" />,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Trade/TradeDetails', () => ({
  default: () => <div data-testid="trade-details" />,
}));

vi.mock('@/pages/Pokemon/features/instances/WantedInstance', () => ({
  default: () => <div data-testid="wanted-instance" />,
}));

vi.mock('@/pages/Pokemon/features/instances/components/Wanted/WantedDetails', () => ({
  default: () => <div data-testid="wanted-details" />,
}));

function makePokemon(overrides: Record<string, unknown> = {}) {
  return {
    pokemon_id: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    variant_id: '0001-default',
    variantType: 'default',
    currentImage: '/images/1.png',
    image_url: '/images/1.png',
    image_url_shadow: '/images/1-shadow.png',
    image_url_shiny: '/images/1-shiny.png',
    image_url_shiny_shadow: '/images/1-shiny-shadow.png',
    instanceData: {},
    costumes: [],
    ...overrides,
  } as unknown as React.ComponentProps<typeof InstanceOverlay>['pokemon'];
}

function renderOverlay(
  tagFilter: string,
  pokemonOverrides: Record<string, unknown> = {},
) {
  render(
    <InstanceOverlay
      pokemon={makePokemon(pokemonOverrides)}
      onClose={vi.fn()}
      variants={[]}
      tagFilter={tagFilter}
      lists={{}}
      instances={{}}
      sortType="name"
      sortMode="ascending"
      isEditable={true}
      username="ash"
    />,
  );
}

describe('InstanceOverlay', () => {
  it('renders caught overlay when tag filter is caught', () => {
    renderOverlay('caught');
    expect(screen.getByTestId('caught-instance')).toBeInTheDocument();
  });

  it('renders trade overlay windows when tag filter is trade', () => {
    renderOverlay('trade');
    expect(screen.getByTestId('trade-instance')).toBeInTheDocument();
    expect(screen.getByTestId('trade-details')).toBeInTheDocument();
  });

  it('falls back to pokemon status when tag filter is unknown', () => {
    renderOverlay('unknown-filter', {
      instanceData: { status: 'wanted' },
    });
    expect(screen.getByTestId('wanted-details')).toBeInTheDocument();
    expect(screen.getByTestId('wanted-instance')).toBeInTheDocument();
  });
});
