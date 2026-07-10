import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PokedexPokemonDetail from '@/pages/Pokedex/PokedexPokemonDetail';
import {
  buildPokedexRegistrationId,
  type PokedexRegistrationEntry,
  type PokedexRegistrationFacets,
} from '@/features/pokedex/registrationProjection';

import type { PokemonVariant } from '@/types/pokemonVariants';

const modalMocks = vi.hoisted(() => ({
  confirm: vi.fn(async () => true),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => modalMocks,
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
      data-testid="pokemon-detail-close"
      onClick={onClick}
      type="button"
    >
      Close
    </button>
  ),
}));

vi.mock('@/utils/imageHelpers', () => ({
  determineImageUrl: (_female: boolean, pokemon: PokemonVariant, ...rest: unknown[]) => {
    const purified = rest.at(-1) === true;
    if (purified) return `/images/purified/${pokemon.pokemon_id}.png`;
    return pokemon.currentImage || pokemon.image_url;
  },
  getTypeIconPath: (type: string) => `/types/${type.toLowerCase()}.png`,
}));

function makePokemon(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
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
    type1_name: 'Grass',
    type2_name: 'Poison',
    type_1_icon: '/types/grass.png',
    type_2_icon: '/types/poison.png',
    attack: 118,
    defense: 111,
    stamina: 128,
    cp40: 1115,
    cp50: 1260,
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    max: [],
    evolves_from: [],
    evolves_to: [],
    sizes: {
      pokedex_height: 0.7,
      pokedex_weight: 6.9,
      height_standard_deviation: 0.1,
      weight_standard_deviation: 1,
      height_xxs_threshold: 0.45,
      height_xs_threshold: 0.6,
      height_xl_threshold: 0.85,
      height_xxl_threshold: 1.05,
      weight_xxs_threshold: 4,
      weight_xs_threshold: 5.5,
      weight_xl_threshold: 8,
      weight_xxl_threshold: 10,
    },
    ...overrides,
  } as PokemonVariant;
}

function makeRegistration(
  pokemon: PokemonVariant,
  facets: PokedexRegistrationFacets = {},
): PokedexRegistrationEntry {
  return {
    registration_id: buildPokedexRegistrationId({
      pokemon_id: pokemon.pokemon_id,
      form: pokemon.form,
      facets: { variant: pokemon.variantType, ...facets },
    }),
    pokemon_id: pokemon.pokemon_id,
    pokedex_number: Number(pokemon.pokedex_number),
    base_variant_id: pokemon.variant_id,
    species_name: pokemon.species_name,
    form: pokemon.form ?? null,
    variant_type: pokemon.variantType,
    facets: { variant: pokemon.variantType, ...facets },
    is_registered: true,
    registered_at: '2026-07-09T00:00:00.000Z',
    source: 'instance',
    source_instance_id: 'instance-1',
    level: 'exact',
  };
}

function makeSpeciesVariants(options: { includeShinyShadow?: boolean } = {}) {
  const base = makePokemon({
    variant_id: '0001-default',
    variantType: 'default',
  });
  const shiny = makePokemon({
    variant_id: '0001-shiny',
    variantType: 'shiny',
    currentImage: '/images/shiny/shiny_pokemon_1.png',
    image_url: '/images/shiny/shiny_pokemon_1.png',
  });
  const shadow = makePokemon({
    variant_id: '0001-shadow',
    variantType: 'shadow',
    currentImage: '/images/shadow/shadow_pokemon_1.png',
    image_url: '/images/shadow/shadow_pokemon_1.png',
  });
  const shinyShadow = makePokemon({
    variant_id: '0001-shiny-shadow',
    variantType: 'shiny_shadow',
    currentImage: '/images/shiny_shadow/shiny_shadow_pokemon_1.png',
    image_url: '/images/shiny_shadow/shiny_shadow_pokemon_1.png',
  });
  const costume = makePokemon({
    variant_id: '0001-costume_1',
    variantType: 'costume_1',
    currentImage: '/images/costume/pokemon_1_costume_1.png',
    image_url: '/images/costume/pokemon_1_costume_1.png',
    costumes: [
      {
        costume_id: 1,
        name: 'Party Hat',
        date_available: '2017-02-26',
        date_shiny_available: '2018-02-26',
        shiny_available: 1,
      },
    ],
  } as Partial<PokemonVariant>);
  const shinyCostume = makePokemon({
    variant_id: '0001-costume_1_shiny',
    variantType: 'costume_1_shiny',
    currentImage: '/images/costume/shiny_pokemon_1_costume_1.png',
    image_url: '/images/costume/shiny_pokemon_1_costume_1.png',
    costumes: costume.costumes,
  });
  const dynamax = makePokemon({
    variant_id: '0001-dynamax',
    variantType: 'dynamax',
    currentImage: '/images/dynamax/pokemon_1.png',
    image_url: '/images/dynamax/pokemon_1.png',
  });

  return [
    base,
    shiny,
    shadow,
    ...(options.includeShinyShadow === false ? [] : [shinyShadow]),
    costume,
    shinyCostume,
    dynamax,
  ];
}

function makeFusionSpeciesVariants() {
  const base = makePokemon({
    pokemon_id: 646,
    pokedex_number: 646,
    variant_id: '0646-default',
    name: 'Kyurem',
    species_name: 'Kyurem',
    currentImage: '/images/default/pokemon_646.png',
    image_url: '/images/default/pokemon_646.png',
  });

  const whiteKyurem = makePokemon({
    pokemon_id: 646,
    pokedex_number: 646,
    variant_id: '0646-fusion_3',
    variantType: 'fusion_3',
    fusion_id: 3,
    name: 'White Kyurem',
    species_name: 'White Kyurem',
    currentImage: '/images/fusion/fusion_3.png',
    image_url: '/images/fusion/fusion_3.png',
  });

  const blackKyurem = makePokemon({
    pokemon_id: 646,
    pokedex_number: 646,
    variant_id: '0646-fusion_4',
    variantType: 'fusion_4',
    fusion_id: 4,
    name: 'Black Kyurem',
    species_name: 'Black Kyurem',
    currentImage: '/images/fusion/fusion_4.png',
    image_url: '/images/fusion/fusion_4.png',
  });

  return [base, whiteKyurem, blackKyurem];
}

function renderDetail(
  options: {
    includeShinyShadow?: boolean;
    onRegister?: (entries: PokedexRegistrationEntry[]) => void;
    onUnregister?: (ids: string[]) => void;
  } = {},
) {
  const variants = makeSpeciesVariants(options);
  const base = variants[0];

  return render(
    <PokedexPokemonDetail
      pokemon={base}
      variants={variants}
      registrations={[makeRegistration(base), makeRegistration(base, { size: 'xxl' })]}
      onRegister={options.onRegister}
      onUnregister={options.onUnregister}
      onClose={vi.fn()}
    />,
  );
}

describe('PokedexPokemonDetail', () => {
  beforeEach(() => {
    modalMocks.confirm.mockClear();
    modalMocks.confirm.mockResolvedValue(true);
  });

  it('updates the hero theme and sizing when registration slots are selected', () => {
    const { container } = renderDetail();

    expect(container.querySelector('.pokedex-pokemon-detail--pokemon')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^ShadowMissing$/i }));
    expect(container.querySelector('.pokedex-pokemon-detail--shadow')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /XXLRegistered/i }));
    expect(container.querySelector('.pokedex-pokemon-detail--xxl')).toBeInTheDocument();
    expect(
      container.querySelector('.pokedex-pokemon-detail__hero-image.pokedex-pokemon-detail__size-image--xxl'),
    ).toBeInTheDocument();
  });

  it('keeps shadow, purified, and shiny purified availability tied to shadow families', () => {
    const { rerender } = render(
      <PokedexPokemonDetail
        pokemon={makeSpeciesVariants({ includeShinyShadow: false })[0]}
        variants={makeSpeciesVariants({ includeShinyShadow: false })}
        registrations={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Shadow' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ShadowMissing$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PurifiedMissing/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Shiny Purified/i })).not.toBeInTheDocument();

    const variantsWithShinyShadow = makeSpeciesVariants();
    rerender(
      <PokedexPokemonDetail
        pokemon={variantsWithShinyShadow[0]}
        variants={variantsWithShinyShadow}
        registrations={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Shiny ShadowMissing/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shiny PurifiedMissing/i })).toBeInTheDocument();
  });

  it('uses each fusion variant icon instead of one generic fusion glyph', () => {
    const variants = makeFusionSpeciesVariants();

    render(
      <PokedexPokemonDetail
        pokemon={variants[0]}
        variants={variants}
        registrations={[]}
        onClose={vi.fn()}
      />,
    );

    const whiteKyuremButton = screen.getByRole('button', { name: /White KyuremMissing/i });
    const blackKyuremButton = screen.getByRole('button', { name: /Black KyuremMissing/i });

    expect(
      whiteKyuremButton
        .querySelector('.pokedex-pokemon-detail-card__icon')
        ?.getAttribute('src'),
    ).toBe('/images/fusion_3.png');
    expect(
      blackKyuremButton
        .querySelector('.pokedex-pokemon-detail-card__icon')
        ?.getAttribute('src'),
    ).toBe('/images/fusion_4.png');
  });

  it('allows all More sections to collapse and filters combination indexes', () => {
    renderDetail();

    fireEvent.click(screen.getByRole('tab', { name: /More/i }));

    const comboSectionButtons = screen
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-expanded'));
    const pokemonSectionButton = comboSectionButtons.find((button) =>
      button.textContent?.includes('Pokemon'),
    ) as HTMLButtonElement;

    expect(pokemonSectionButton).toBeTruthy();
    expect(pokemonSectionButton.textContent).toContain('2 / 60');
    expect(pokemonSectionButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('searchbox', { name: /Search combinations/i })).toBeInTheDocument();

    fireEvent.click(pokemonSectionButton);

    expect(pokemonSectionButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('searchbox', { name: /Search combinations/i })).not.toBeInTheDocument();

    fireEvent.click(pokemonSectionButton);
    fireEvent.change(screen.getByRole('searchbox', { name: /Search combinations/i }), {
      target: { value: 'female xxl 100' },
    });

    expect(screen.getByText('Showing 2 of 60')).toBeInTheDocument();

    const filters = screen.getByLabelText('Combination filters');
    fireEvent.click(within(filters).getByRole('button', { name: 'Lucky' }));

    expect(screen.getByText('Showing 1 of 60')).toBeInTheDocument();
    expect(screen.getByText('Female XXL Lucky 100%')).toBeInTheDocument();
  });

  it('registers and clears selected slots plus filtered combination batches', async () => {
    const onRegister = vi.fn();
    const onUnregister = vi.fn();
    renderDetail({ onRegister, onUnregister });

    fireEvent.click(screen.getByRole('button', { name: /^ShinyMissing$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Register Shiny$/i }));

    expect(onRegister).toHaveBeenCalledWith([
      expect.objectContaining({
        registration_id: 'species:1|form:normal|variant:shiny',
        source: 'manual',
      }),
    ]);

    fireEvent.click(screen.getByRole('button', { name: /Clear XXL/i }));
    expect(onUnregister).toHaveBeenCalledWith(['species:1|form:normal|variant:default|size:xxl']);

    const registeredToolbar = screen.getByLabelText('Registered tab bulk actions');
    expect(screen.getAllByRole('button', { name: /^Register all$/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^Unregister all$/i })).toHaveLength(1);

    onRegister.mockClear();
    modalMocks.confirm.mockClear();
    fireEvent.click(within(registeredToolbar).getByRole('button', { name: /^Register all$/i }));

    await waitFor(() => expect(onRegister).toHaveBeenCalledTimes(1));
    expect(onRegister.mock.calls[0][0]).toHaveLength(13);
    expect(modalMocks.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Register all 13 entries in the Registered tab'),
    );

    modalMocks.confirm.mockClear();
    fireEvent.click(screen.getByRole('tab', { name: /More/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /Search combinations/i }), {
      target: { value: 'female xxl 100' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Register all$/i }));

    await waitFor(() =>
      expect(onRegister).toHaveBeenLastCalledWith([
        expect.objectContaining({
          registration_id:
            'species:1|form:normal|variant:shiny|size:xxl|gender:female|appraisal:4-star',
        }),
        expect.objectContaining({
          registration_id:
            'species:1|form:normal|variant:shiny|size:xxl|lucky:true|gender:female|appraisal:4-star',
        }),
      ]),
    );
    expect(modalMocks.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Register all 2 shown combinations'),
    );
  });
});
