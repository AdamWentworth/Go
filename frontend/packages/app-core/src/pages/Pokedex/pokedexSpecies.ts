import type { PokemonPokedexSpecies } from '@shared-contracts/pokemon';

import type { PokemonVariant } from '@/types/pokemonVariants';

export function isPokedexPokemonReleased(pokemon: Pick<PokemonVariant, 'available'>): boolean {
  return Number(pokemon.available ?? 1) !== 0;
}

function createUnreleasedPokedexVariant(species: PokemonPokedexSpecies): PokemonVariant {
  const imageUrl = species.image_url ?? '';

  return {
    variant_id: `pokedex-unreleased:${species.pokemon_id}`,
    pokemon_id: species.pokemon_id,
    pokedex_number: species.pokedex_number,
    name: species.name,
    species_name: species.name,
    form: species.form,
    generation: species.generation,
    available: 0,
    variantType: 'default',
    currentImage: imageUrl || undefined,
    image_url: imageUrl,
    image_url_shiny: '',
    image_url_shadow: '',
    image_url_shiny_shadow: '',
    attack: 0,
    defense: 0,
    stamina: 0,
    type_1_id: 0,
    type_2_id: 0,
    gender_rate: species.gender_rate ?? '',
    rarity: '',
    shiny_available: 0,
    shiny_rarity: null,
    date_available: '',
    date_shiny_available: '',
    female_unique: 0,
    type1_name: '',
    type2_name: '',
    shadow_shiny_available: 0,
    shadow_apex: null,
    date_shadow_available: '',
    date_shiny_shadow_available: '',
    shiny_shadow_rarity: null,
    type_1_icon: '',
    type_2_icon: '',
    costumes: [],
    moves: [],
    fusion: [],
    backgrounds: [],
    cp40: 0,
    cp50: 0,
    evolves_from: [],
    evolves_to: [],
    megaEvolutions: [],
    sizes: {
      pokedex_height: 0,
      pokedex_weight: 0,
      height_standard_deviation: 0,
      weight_standard_deviation: 0,
      height_xxs_threshold: 0,
      height_xs_threshold: 0,
      height_xl_threshold: 0,
      height_xxl_threshold: 0,
      weight_xxs_threshold: 0,
      weight_xs_threshold: 0,
      weight_xl_threshold: 0,
      weight_xxl_threshold: 0,
    },
    max: [],
    sprite_url: null,
  } as PokemonVariant;
}

export function mergePokedexSpecies(
  releasedVariants: PokemonVariant[],
  speciesCatalog: PokemonPokedexSpecies[],
): PokemonVariant[] {
  if (speciesCatalog.length === 0) return releasedVariants;

  const releasedBasePokemonIds = new Set<number>();
  for (const variant of releasedVariants) {
    if (variant.variantType !== 'default') continue;
    releasedBasePokemonIds.add(variant.pokemon_id);
  }

  const unreleasedSpecies = speciesCatalog
    .filter((species) => !releasedBasePokemonIds.has(species.pokemon_id))
    .map(createUnreleasedPokedexVariant);

  return [...releasedVariants, ...unreleasedSpecies];
}
