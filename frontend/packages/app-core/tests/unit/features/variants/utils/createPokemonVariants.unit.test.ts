import { describe, expect, it } from 'vitest';

import createPokemonVariants, {
  isCatalogEntryReleased,
} from '@/features/variants/utils/createPokemonVariants';
import type { BasePokemon } from '@/types/pokemonBase';
import type { PokemonVariant } from '@/types/pokemonVariants';

import pokemonsFixture from '@/../tests/__helpers__/fixtures/pokemons.json';

const samplePokemons = (pokemonsFixture as BasePokemon[]).slice(0, 40);

describe('createPokemonVariants (unit)', () => {
  it('keeps undated and released catalog entries while rejecting future releases', () => {
    const referenceTime = new Date(2026, 6, 17, 12).getTime();

    expect(isCatalogEntryReleased(null, referenceTime)).toBe(true);
    expect(isCatalogEntryReleased('not-a-date', referenceTime)).toBe(true);
    expect(isCatalogEntryReleased('2026-07-17', referenceTime)).toBe(true);
    expect(isCatalogEntryReleased('2026-07-18', referenceTime)).toBe(false);
  });

  it('creates at least one variant per base pokemon', () => {
    const variants = createPokemonVariants(samplePokemons);
    const defaults = variants.filter((v) => v.variantType === 'default');

    expect(defaults).toHaveLength(samplePokemons.length);
    expect(variants.length).toBeGreaterThanOrEqual(samplePokemons.length);
  });

  it('assigns non-empty and unique variant_id values', () => {
    const variants = createPokemonVariants(samplePokemons);
    const ids = variants.map((v) => v.variant_id);
    const unique = new Set(ids);

    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
    expect(unique.size).toBe(ids.length);
  });

  it('assigns non-empty display names for all generated variants', () => {
    const variants = createPokemonVariants(samplePokemons);
    const names = variants.map((v) => v.name);
    expect(names.every((n) => typeof n === 'string' && n.trim().length > 0)).toBe(true);
  });

  it('generates stable variant_id sequences for same input', () => {
    const first = createPokemonVariants(samplePokemons).map((v) => v.variant_id);
    const second = createPokemonVariants(samplePokemons).map((v) => v.variant_id);

    expect(second).toEqual(first);
  });

  it('does not create shiny default variants when shiny_available is false', () => {
    const variants = createPokemonVariants(samplePokemons);
    const byId = new Map<number, PokemonVariant[]>();
    for (const v of variants) {
      byId.set(v.pokemon_id, [...(byId.get(v.pokemon_id) || []), v]);
    }

    for (const p of samplePokemons.filter((x) => !x.shiny_available)) {
      const pokemonVariants = byId.get(p.pokemon_id) || [];
      const hasShiny = pokemonVariants.some((v) => v.variantType === 'shiny');
      expect(hasShiny).toBe(false);
    }
  });

  it('includes costume variants for pokemon that have costumes', () => {
    const variants = createPokemonVariants(samplePokemons);
    const costumeEligible = samplePokemons.filter((p) => p.costumes?.length > 0);

    for (const p of costumeEligible) {
      const pokemonVariants = variants.filter((v) => v.pokemon_id === p.pokemon_id);
      const hasCostume = pokemonVariants.some((v) => v.variantType.startsWith('costume_'));
      expect(hasCostume).toBe(true);
    }
  });

  it('uses fusion-specific backgrounds for fusion variants when provided', () => {
    const baseBackgrounds = [
      {
        background_id: 38,
        name: 'Base Background',
        location: 'Base',
        image_url: 'https://example.com/base.png',
        date: '2025-01-01',
        costume_id: 0,
      },
    ];
    const fusionBackgrounds = [
      {
        background_id: 40,
        name: 'Fusion Background',
        location: 'Fusion',
        image_url: 'https://example.com/fusion.png',
        date: '2025-01-02',
        costume_id: 0,
      },
    ];

    const sample = samplePokemons[0];
    const pokemon: BasePokemon = {
      ...sample,
      pokemon_id: 646,
      name: 'Kyurem',
      backgrounds: baseBackgrounds,
      costumes: [],
      fusion: [
        {
          fusion_id: 3,
          base_pokemon_id1: 646,
          base_pokemon_id2: 643,
          date_available: '2025-01-01',
          type_1_id: 3,
          type_2_id: 12,
          type1_name: 'Dragon',
          type2_name: 'Ice',
          name: 'White Kyurem',
          image_url: 'https://example.com/white-kyurem.png',
          image_url_shiny: 'https://example.com/white-kyurem-shiny.png',
          backgrounds: fusionBackgrounds,
        },
      ],
      megaEvolutions: [],
      raid_boss: [],
      max: [],
      evolves_from: [],
    };

    const variants = createPokemonVariants([pokemon]);
    const defaultVariant = variants.find((v) => v.variantType === 'default');
    const fusionVariant = variants.find((v) => v.variantType === 'fusion_3');

    expect(defaultVariant?.backgrounds).toEqual(baseBackgrounds);
    expect(fusionVariant?.backgrounds).toEqual(fusionBackgrounds);
  });

  it('uses each Mega form\'s types instead of inheriting the base Pokemon types', () => {
    const sample = samplePokemons[0];
    const charizard: BasePokemon = {
      ...sample,
      pokemon_id: 6,
      name: 'Charizard',
      type_1_id: 10,
      type_2_id: 3,
      type1_name: 'Fire',
      type2_name: 'Flying',
      costumes: [],
      fusion: [],
      raid_boss: [],
      max: [],
      evolves_from: [],
      megaEvolutions: [
        {
          id: 1,
          form: 'X',
          date_available: '2020-08-27',
          mega_energy_cost: 200,
          type_1_id: 10,
          type_2_id: 3,
          type1_name: 'Fire',
          type2_name: 'Dragon',
        },
        {
          id: 2,
          form: 'Y',
          date_available: '2020-08-27',
          mega_energy_cost: 200,
          type_1_id: 10,
          type_2_id: 11,
          type1_name: 'Fire',
          type2_name: 'Flying',
        },
      ],
    };

    const variants = createPokemonVariants([charizard]);
    const megaX = variants.find((variant) => variant.megaForm === 'X');
    const megaY = variants.find((variant) => variant.megaForm === 'Y');

    expect([megaX?.type1_name, megaX?.type2_name]).toEqual([
      'Fire',
      'Dragon',
    ]);
    expect([megaY?.type1_name, megaY?.type2_name]).toEqual([
      'Fire',
      'Flying',
    ]);
  });

  it('keeps curated fusion raid data only on matching fusion variants', () => {
    const sample = samplePokemons[0];
    const pokemon: BasePokemon = {
      ...sample,
      pokemon_id: 646,
      name: 'Kyurem',
      backgrounds: [],
      costumes: [],
      fusion: [
        {
          fusion_id: 3,
          base_pokemon_id1: 646,
          base_pokemon_id2: 643,
          date_available: '2025-01-01',
          type_1_id: 3,
          type_2_id: 12,
          type1_name: 'Dragon',
          type2_name: 'Ice',
          name: 'White Kyurem',
          image_url: 'https://example.com/white-kyurem.png',
        },
      ],
      megaEvolutions: [],
      raid_boss: [
        {
          id: 900002,
          pokemon_id: 646,
          name: 'White Kyurem',
          form: 'White',
          type: 'Dragon / Ice',
          boosted_weather: 'Windy / Snow',
          max_boosted_cp: 2553,
          max_unboosted_cp: 2042,
          min_boosted_cp: 2446,
          min_unboosted_cp: 1957,
          possible_shiny: 1,
          tier: 'fusion_5',
        },
      ],
      max: [],
      evolves_from: [],
    };

    const variants = createPokemonVariants([pokemon]);
    const defaultVariant = variants.find((v) => v.variantType === 'default');
    const fusionVariant = variants.find((v) => v.variantType === 'fusion_3');

    expect(defaultVariant?.raid_boss).toBeUndefined();
    expect(fusionVariant?.raid_boss?.[0]?.tier).toBe('fusion_5');
  });

  it('keeps curated shadow raid data only on shadow variants', () => {
    const sample = samplePokemons[0];
    const pokemon: BasePokemon = {
      ...sample,
      pokemon_id: 484,
      name: 'Palkia',
      backgrounds: [],
      costumes: [],
      fusion: [],
      megaEvolutions: [],
      date_shadow_available: '2026-07-01',
      image_url_shadow: 'https://example.com/shadow-palkia.png',
      raid_boss: [
        {
          id: 900011,
          pokemon_id: 484,
          name: 'Shadow Palkia',
          form: 'Normal',
          type: 'Water / Dragon',
          boosted_weather: 'Rainy / Windy',
          max_boosted_cp: 2850,
          max_unboosted_cp: 2280,
          min_boosted_cp: 2648,
          min_unboosted_cp: 2118,
          possible_shiny: 1,
          tier: 'shadow_5',
        },
      ],
      max: [],
      evolves_from: [],
    };

    const variants = createPokemonVariants([pokemon]);
    const defaultVariant = variants.find((v) => v.variantType === 'default');
    const shadowVariant = variants.find((v) => v.variantType === 'shadow');

    expect(defaultVariant?.raid_boss).toBeUndefined();
    expect(shadowVariant?.raid_boss?.[0]?.tier).toBe('shadow_5');
  });

  it('keeps costume raid data only on the matching costume variant', () => {
    const sample = samplePokemons[0];
    const pokemon: BasePokemon = {
      ...sample,
      pokemon_id: 25,
      name: 'Pikachu',
      backgrounds: [],
      costumes: [
        {
          costume_id: 216,
          name: 'holiday_2023',
          image_url: 'https://example.com/holiday-pikachu.png',
          image_url_shiny: 'https://example.com/holiday-pikachu-shiny.png',
          shiny_available: 1,
          date_available: '2023-12-18',
          date_shiny_available: '2023-12-18',
          shadow_costume: null,
        },
      ],
      fusion: [],
      megaEvolutions: [],
      raid_boss: [
        {
          id: 920013,
          pokemon_id: 25,
          name: 'Holiday 2023 Pikachu',
          form: 'Normal',
          type: 'Electric',
          boosted_weather: 'Rainy',
          max_boosted_cp: 670,
          max_unboosted_cp: 536,
          min_boosted_cp: 616,
          min_unboosted_cp: 493,
          possible_shiny: 1,
          tier: '1',
          costume_id: 216,
        },
      ],
      max: [],
      evolves_from: [],
    };

    const variants = createPokemonVariants([pokemon]);
    const defaultVariant = variants.find((v) => v.variantType === 'default');
    const costumeVariant = variants.find((v) => v.variantType === 'costume_216');
    const shinyCostumeVariant = variants.find((v) => v.variantType === 'costume_216_shiny');

    expect(defaultVariant?.raid_boss).toBeUndefined();
    expect(costumeVariant?.raid_boss?.[0]?.costume_id).toBe(216);
    expect(shinyCostumeVariant?.raid_boss).toBeUndefined();
  });

  it('creates both Mega Mewtwo forms with form-specific images, stats, CP, and types', () => {
    const sample = samplePokemons[0];
    const pokemon: BasePokemon = {
      ...sample,
      pokemon_id: 150,
      name: 'Mewtwo',
      pokedex_number: 150,
      image_url: '/images/default/pokemon_150.png',
      image_url_shiny: '/images/shiny/shiny_pokemon_150.png',
      shiny_available: 1,
      backgrounds: [],
      costumes: [],
      fusion: [],
      megaEvolutions: [
        {
          id: 46,
          mega_energy_cost: 300,
          attack: 399,
          defense: 215,
          stamina: 228,
          image_url: '/images/mega/mega_150_X.png',
          image_url_shiny: '/images/shiny_mega/shiny_mega_150_X.png',
          sprite_url: null,
          primal: null,
          form: 'X',
          type_1_id: 15,
          type_2_id: 6,
          type1_name: 'Psychic',
          type2_name: 'Fighting',
          date_available: '2026-05-25',
          cp40: 6112,
          cp50: 6910,
        },
        {
          id: 47,
          mega_energy_cost: 300,
          attack: 413,
          defense: 223,
          stamina: 228,
          image_url: '/images/mega/mega_150_Y.png',
          image_url_shiny: '/images/shiny_mega/shiny_mega_150_Y.png',
          sprite_url: null,
          primal: null,
          form: 'Y',
          type_1_id: 15,
          type_2_id: undefined,
          type1_name: 'Psychic',
          type2_name: undefined,
          date_available: '2026-05-25',
          cp40: 6428,
          cp50: 7267,
        },
      ],
      raid_boss: [],
      max: [],
      evolves_from: [],
    };

    const variants = createPokemonVariants([pokemon]);
    const megaX = variants.find((v) => v.variantType === 'mega_x');
    const megaY = variants.find((v) => v.variantType === 'mega_y');
    const shinyMegaX = variants.find((v) => v.variantType === 'shiny_mega_x');
    const shinyMegaY = variants.find((v) => v.variantType === 'shiny_mega_y');

    expect(megaX).toMatchObject({
      variant_id: '0150-mega_x',
      currentImage: '/images/mega/mega_150_X.png',
      attack: 399,
      defense: 215,
      stamina: 228,
      cp40: 6112,
      cp50: 6910,
      type_1_icon: '/images/types/psychic.png',
      type_2_icon: '/images/types/fighting.png',
    });
    expect(megaY).toMatchObject({
      variant_id: '0150-mega_y',
      currentImage: '/images/mega/mega_150_Y.png',
      attack: 413,
      defense: 223,
      stamina: 228,
      cp40: 6428,
      cp50: 7267,
      type_1_icon: '/images/types/psychic.png',
      type_2_icon: '',
    });
    expect(shinyMegaX?.currentImage).toBe('/images/shiny_mega/shiny_mega_150_X.png');
    expect(shinyMegaY?.currentImage).toBe('/images/shiny_mega/shiny_mega_150_Y.png');
  });

  it('does not create a Mega variant before its catalog release date', () => {
    const sample = samplePokemons[0];
    const pokemon: BasePokemon = {
      ...sample,
      pokemon_id: 121,
      name: 'Starmie',
      pokedex_number: 121,
      backgrounds: [],
      costumes: [],
      fusion: [],
      megaEvolutions: [
        {
          id: 155,
          mega_energy_cost: 300,
          attack: 276,
          defense: 229,
          stamina: 155,
          image_url: '',
          image_url_shiny: '',
          sprite_url: null,
          primal: null,
          form: null,
          type_1_id: 18,
          type_2_id: 15,
          type1_name: 'Water',
          type2_name: 'Psychic',
          date_available: '2099-08-22',
          cp40: 3701,
          cp50: 4184,
        },
      ],
      raid_boss: [],
      max: [],
      evolves_from: [],
    };

    const variants = createPokemonVariants([pokemon]);

    expect(variants.some((variant) => variant.variantType === 'mega')).toBe(false);
    expect(variants.some((variant) => variant.variantType === 'default')).toBe(true);
  });
});
