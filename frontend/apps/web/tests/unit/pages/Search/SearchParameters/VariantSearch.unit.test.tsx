import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import VariantSearch from '@/pages/Search/SearchParameters/VariantSearch';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SelectedMoves } from '@/pages/Search/SearchParameters/VariantComponents/MovesSearch';

const validatePokemonMock = vi.fn();
const updateImageMock = vi.fn();

vi.mock('@/pages/Search/utils/validatePokemon', () => ({
  default: (...args: unknown[]) => validatePokemonMock(...args),
}));

vi.mock('@/pages/Search/utils/updateImage', () => ({
  updateImage: (...args: unknown[]) => updateImageMock(...args),
}));

vi.mock('@/pages/Search/components/Dropdown', () => ({
  default: ({ label }: { label: string }) => <div data-testid={`dropdown-${label}`} />,
}));

vi.mock('@/pages/Search/SearchParameters/VariantComponents/MovesSearch', () => ({
  default: () => <div data-testid="moves-search" />,
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: () => <div data-testid="gender-component" />,
}));

vi.mock('@/components/pokemonComponents/BackgroundLocationCard', () => ({
  default: () => <div data-testid="background-location-card" />,
}));

type Props = React.ComponentProps<typeof VariantSearch>;

const toSetter = <T,>() => vi.fn() as unknown as React.Dispatch<React.SetStateAction<T>>;

const baseVariant = {
  name: 'Bulbasaur',
  form: null,
  gender_rate: '50_50_0',
  moves: [],
  costumes: [
    {
      name: 'Party',
      costume_id: 7,
      date_available: '2024-01-01',
      date_shiny_available: null,
      shiny_available: 1,
    },
  ],
  backgrounds: [
    {
      background_id: 101,
      costume_id: null,
      image_url: '/images/bg.png',
      name: 'City',
      location: 'Seattle',
      date: '2025-01-01',
    },
  ],
  max: [
    {
      pokemon_id: 1,
      dynamax: 1,
      gigantamax: 1,
      dynamax_release_date: null,
      gigantamax_release_date: null,
    },
  ],
} as unknown as PokemonVariant;

const createProps = (overrides: Partial<Props> = {}): Props => ({
  pokemon: '',
  setPokemon: toSetter<string>(),
  isShiny: false,
  setIsShiny: toSetter<boolean>(),
  isShadow: false,
  setIsShadow: toSetter<boolean>(),
  costume: '',
  setCostume: toSetter<string | null>(),
  selectedForm: '',
  setSelectedForm: toSetter<string>(),
  selectedMoves: {
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  } as SelectedMoves,
  setSelectedMoves: toSetter<SelectedMoves>(),
  selectedGender: 'Any',
  setSelectedGender: toSetter<string | null>(),
  setErrorMessage: toSetter<string | null>(),
  setSelectedBackgroundId: toSetter<number | null>(),
  dynamax: false,
  setDynamax: toSetter<boolean>(),
  gigantamax: false,
  setGigantamax: toSetter<boolean>(),
  pokemonCache: [baseVariant],
  ...overrides,
});

describe('VariantSearch', () => {
  beforeEach(() => {
    validatePokemonMock.mockReset();
    updateImageMock.mockReset();

    validatePokemonMock.mockReturnValue({
      error: null,
      availableCostumes: [
        {
          name: 'Party',
          costume_id: 7,
          date_available: '2024-01-01',
        },
      ],
      availableForms: ['None'],
    });

    updateImageMock.mockReturnValue('/images/default.png');
  });

  it('shows autocomplete suggestions and applies clicked suggestion', async () => {
    const setPokemon = toSetter<string>();

    render(
      <VariantSearch
        {...createProps({
          setPokemon,
          pokemonCache: [
            baseVariant,
            { ...baseVariant, name: 'Butterfree' } as PokemonVariant,
          ],
        })}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('Enter Pokemon name'), {
      target: { value: 'Bul' },
    });

    await screen.findByText('Bulbasaur');
    fireEvent.click(screen.getByText('Bulbasaur'));

    expect(setPokemon).toHaveBeenCalledWith('Bul');
    expect(setPokemon).toHaveBeenLastCalledWith('Bulbasaur');
  });

  it('cycles max toggle from dynamax into gigantamax when both exist', () => {
    const setDynamax = toSetter<boolean>();
    const setGigantamax = toSetter<boolean>();

    const { rerender } = render(
      <VariantSearch
        {...createProps({
          pokemon: 'Bulbasaur',
          dynamax: false,
          gigantamax: false,
          setDynamax,
          setGigantamax,
        })}
      />,
    );

    fireEvent.click(screen.getByAltText('Dynamax (Desaturated)'));
    expect(setDynamax).toHaveBeenCalledWith(true);

    rerender(
      <VariantSearch
        {...createProps({
          pokemon: 'Bulbasaur',
          dynamax: true,
          gigantamax: false,
          setDynamax,
          setGigantamax,
        })}
      />,
    );

    fireEvent.click(screen.getByAltText('Dynamax'));
    expect(setDynamax).toHaveBeenCalledWith(false);
    expect(setGigantamax).toHaveBeenCalledWith(true);
  });

  it('propagates validation errors to parent error state', async () => {
    const setErrorMessage = toSetter<string | null>();
    validatePokemonMock
      .mockReturnValueOnce({
        error: null,
        availableCostumes: [],
        availableForms: [],
      })
      .mockReturnValueOnce({
        error: 'Invalid variant',
        availableCostumes: [],
        availableForms: [],
      });

    render(
      <VariantSearch
        {...createProps({
          pokemon: 'Bulbasaur',
          setErrorMessage,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Shiny' }));

    await waitFor(() => {
      expect(setErrorMessage).toHaveBeenCalledWith('Invalid variant');
    });
  });

  it('resets costume when costume picker is closed', () => {
    const setCostume = toSetter<string | null>();

    render(
      <VariantSearch
        {...createProps({
          pokemon: 'Bulbasaur',
          setCostume,
        })}
      />,
    );

    const costumeToggle = screen.getByRole('button', { name: 'Toggle Costume' });
    fireEvent.click(costumeToggle);
    fireEvent.click(costumeToggle);

    expect(setCostume).toHaveBeenCalledWith(null);
  });
});
