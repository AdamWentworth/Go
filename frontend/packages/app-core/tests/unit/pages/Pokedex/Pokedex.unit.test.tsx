import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Pokedex from '@/pages/Pokedex/Pokedex';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  createManualPokedexRegistration,
  type PokedexRegistrationEntry,
} from '@/features/pokedex/registrationProjection';

const storeMocks = vi.hoisted(() => ({
  variantsState: {
    variants: [] as PokemonVariant[],
    variantsLoading: false,
  },
  instancesState: {
    instances: {} as Record<string, PokemonInstance>,
  },
  manualRegistrationState: {
    registrations: [] as PokedexRegistrationEntry[],
    registrationsLoading: false,
    hydrate: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    unregister: vi.fn(async () => undefined),
    reset: vi.fn(),
  },
  modalState: {
    confirm: vi.fn(async () => true),
  },
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: typeof storeMocks.variantsState) => unknown) =>
    selector(storeMocks.variantsState),
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (selector: (state: typeof storeMocks.instancesState) => unknown) =>
    selector(storeMocks.instancesState),
}));

vi.mock('@/features/pokedex/store/useManualPokedexRegistrationsStore', () => ({
  useManualPokedexRegistrationsStore: (
    selector: (state: typeof storeMocks.manualRegistrationState) => unknown,
  ) => selector(storeMocks.manualRegistrationState),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => storeMocks.modalState,
}));

vi.mock('@/components/CloseButton', () => ({
  default: ({
    className,
    onClick,
    title,
  }: {
    className?: string;
    onClick?: () => void;
    title?: string;
  }) => (
    <button
      aria-label={title ?? 'Close'}
      className={className}
      data-testid="pokedex-close-button"
      onClick={onClick}
      type="button"
    >
      Close
    </button>
  ),
}));

vi.mock('@/pages/Pokedex/PokedexPokemonDetail', () => ({
  default: ({ pokemon, onClose }: { pokemon: PokemonVariant; onClose: () => void }) => (
    <section data-testid="pokedex-pokemon-detail">
      <h2>{pokemon.species_name}</h2>
      <button onClick={onClose} type="button">
        Close detail
      </button>
    </section>
  ),
}));

vi.mock('@/utils/imageHelpers', () => ({
  determineImageUrl: (_female: boolean, pokemon: PokemonVariant) =>
    pokemon.currentImage || pokemon.image_url,
}));

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  const pokemonId = Number(overrides.pokemon_id ?? 1);
  const dex = Number(overrides.pokedex_number ?? pokemonId);
  const name = String(overrides.species_name ?? overrides.name ?? 'Bulbasaur');

  return {
    variant_id: `${String(dex).padStart(4, '0')}-default`,
    pokemon_id: pokemonId,
    pokedex_number: dex,
    name,
    species_name: name,
    form: null,
    generation: 1,
    variantType: 'default',
    currentImage: `/images/default/pokemon_${pokemonId}.png`,
    image_url: `/images/default/pokemon_${pokemonId}.png`,
    image_url_shiny: `/images/shiny/shiny_pokemon_${pokemonId}.png`,
    image_url_shadow: `/images/shadow/shadow_pokemon_${pokemonId}.png`,
    image_url_shiny_shadow: `/images/shiny_shadow/shiny_shadow_pokemon_${pokemonId}.png`,
    gender_rate: 'M/F',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    max: [],
    evolves_from: [],
    evolves_to: [],
    ...overrides,
  } as PokemonVariant;
}

function makeInstance(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    instance_id: 'instance-1',
    variant_id: '0001-default',
    pokemon_id: 1,
    is_caught: true,
    is_for_trade: false,
    is_wanted: false,
    registered: true,
    lucky: false,
    shadow: false,
    purified: false,
    attack_iv: 10,
    defense_iv: 10,
    stamina_iv: 10,
    height: null,
    weight: null,
    gender: null,
    pokeball: null,
    location_card: null,
    date_caught: '2026-07-09T00:00:00.000Z',
    ...overrides,
  } as PokemonInstance;
}

function seedPokedexStores() {
  const bulbasaur = makeVariant({
    variant_id: '0001-default',
    pokemon_id: 1,
    pokedex_number: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
  });
  const ivysaur = makeVariant({
    variant_id: '0002-default',
    pokemon_id: 2,
    pokedex_number: 2,
    name: 'Ivysaur',
    species_name: 'Ivysaur',
  });
  const venusaur = makeVariant({
    variant_id: '0003-default',
    pokemon_id: 3,
    pokedex_number: 3,
    name: 'Venusaur',
    species_name: 'Venusaur',
  });
  const squirtle = makeVariant({
    variant_id: '0007-default',
    pokemon_id: 7,
    pokedex_number: 7,
    name: 'Squirtle',
    species_name: 'Squirtle',
  });
  const shinyBulbasaur = makeVariant({
    variant_id: '0001-shiny',
    pokemon_id: 1,
    pokedex_number: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    variantType: 'shiny',
    currentImage: '/images/shiny/shiny_pokemon_1.png',
    image_url: '/images/shiny/shiny_pokemon_1.png',
  });
  const shadowBulbasaur = makeVariant({
    variant_id: '0001-shadow',
    pokemon_id: 1,
    pokedex_number: 1,
    name: 'Bulbasaur',
    species_name: 'Bulbasaur',
    variantType: 'shadow',
    currentImage: '/images/shadow/shadow_pokemon_1.png',
    image_url: '/images/shadow/shadow_pokemon_1.png',
  });
  const costumePikachu = makeVariant({
    variant_id: '0025-costume_1',
    pokemon_id: 25,
    pokedex_number: 25,
    name: 'Pikachu',
    species_name: 'Pikachu',
    variantType: 'costume_1',
    currentImage: '/images/costume/pokemon_25_costume_1.png',
    image_url: '/images/costume/pokemon_25_costume_1.png',
    costumes: [
      {
        costume_id: 1,
        name: 'Party Hat',
        date_available: '2017-02-26',
        date_shiny_available: null,
        shiny_available: 0,
      },
    ],
  } as Partial<PokemonVariant>);

  storeMocks.variantsState.variants = [
    bulbasaur,
    ivysaur,
    venusaur,
    squirtle,
    shinyBulbasaur,
    shadowBulbasaur,
    costumePikachu,
  ];
  storeMocks.variantsState.variantsLoading = false;
  storeMocks.instancesState.instances = {
    'instance-1': makeInstance({
      instance_id: 'instance-1',
      variant_id: '0001-default',
      pokemon_id: 1,
    }),
  };
  storeMocks.manualRegistrationState.registrations = [];
  storeMocks.manualRegistrationState.hydrate.mockClear();
  storeMocks.manualRegistrationState.register.mockClear();
  storeMocks.manualRegistrationState.unregister.mockClear();
  storeMocks.modalState.confirm.mockClear();
  storeMocks.modalState.confirm.mockResolvedValue(true);
}

describe('Pokedex page', () => {
  beforeEach(() => {
    seedPokedexStores();
  });

  it('guards category navigation, advanced qualities, region detail search, and Pokemon drill-in', async () => {
    render(<Pokedex />);

    expect(screen.getByRole('heading', { name: 'Pokedex' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Advanced/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
    expect(screen.getByRole('tab', { name: /^Pokemon$/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /^Shiny$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Shadow$/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /^Costume$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^XS$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^XL$/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: /Advanced/i }));

    expect(screen.getByRole('switch', { name: /Advanced/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('button', { name: /^XS$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^XL$/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^Shiny$/i }));

    expect(screen.getByRole('tab', { name: /^Shiny$/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: /Kanto.*0 \/ 1/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /^Pokemon$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Kanto.*1 \/ 5/i }));

    expect(screen.getByRole('searchbox', { name: /Search/i })).toBeInTheDocument();
    const visibleActions = screen.getByLabelText('Visible registration actions');
    const kantoFolderToggle = screen.getByRole('button', { name: /Collapse Kanto Pokemon/i });

    expect(kantoFolderToggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(visibleActions).getByText('5')).toBeInTheDocument();

    fireEvent.click(kantoFolderToggle);

    expect(screen.getByRole('button', { name: /Expand Kanto Pokemon/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('button', { name: /Bulbasaur.*Registered/i })).not.toBeInTheDocument();
    expect(within(visibleActions).getByText('0')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Expand Kanto Pokemon/i }));

    expect(screen.getByRole('button', { name: /Bulbasaur.*Registered/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Squirtle.*Missing/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox', { name: /Search/i }), {
      target: { value: 'squirtle' },
    });

    expect(screen.queryByRole('button', { name: /Bulbasaur/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Squirtle.*Missing/i })).toBeInTheDocument();

    fireEvent.click(within(visibleActions).getByRole('button', { name: /^Register all$/i }));
    await waitFor(() =>
      expect(storeMocks.manualRegistrationState.register).toHaveBeenCalledWith([
        expect.objectContaining({
          registration_id: 'species:7|form:normal|variant:default',
          source: 'manual',
        }),
      ]),
    );

    fireEvent.click(within(visibleActions).getByRole('button', { name: /^Unregister all$/i }));
    await waitFor(() =>
      expect(storeMocks.manualRegistrationState.unregister).toHaveBeenCalledWith([
        'species:7|form:normal|variant:default',
      ]),
    );
    expect(storeMocks.modalState.confirm).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByTestId('pokedex-close-button'));
    expect(screen.getByRole('button', { name: /Kanto.*1 \/ 5/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Kanto.*1 \/ 5/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /Search/i }), {
      target: { value: 'bulbasaur' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Bulbasaur.*Registered/i }));

    expect(screen.getByTestId('pokedex-pokemon-detail')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bulbasaur' })).toBeInTheDocument();
  });

  it('counts matching region registrations by visible card instead of raw registration rows', () => {
    const shinyBulbasaur = storeMocks.variantsState.variants.find(
      (variant) => variant.variant_id === '0001-shiny',
    ) as PokemonVariant;
    storeMocks.manualRegistrationState.registrations = [
      createManualPokedexRegistration(shinyBulbasaur, { appraisal: '4-star' }),
      createManualPokedexRegistration(shinyBulbasaur, {
        appraisal: '4-star',
        gender: 'Male',
      }),
    ];

    render(<Pokedex />);

    fireEvent.click(screen.getByRole('tab', { name: /^Shiny$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^100%$/i }));

    expect(screen.getByRole('button', { name: /Kanto.*1 \/ 1/i })).toBeInTheDocument();
  });
});
