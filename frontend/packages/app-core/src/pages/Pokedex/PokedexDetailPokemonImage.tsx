import { useEffect, useState } from 'react';

import { determineImageUrl } from '@/utils/imageHelpers';

import type { PokemonVariant } from '@/types/pokemonVariants';

export type PokedexDetailGender = 'Male' | 'Female';

export const DEFAULT_POKEMON_IMAGE_URL = '/images/default_pokemon.png';

export function getPokemonImage(
  pokemon: PokemonVariant,
  options?: {
    gender?: PokedexDetailGender;
    purified?: boolean;
  },
): string {
  return (
    determineImageUrl(
      options?.gender === 'Female',
      pokemon,
      false,
      undefined,
      false,
      undefined,
      options?.purified === true,
    ) ||
    pokemon.currentImage ||
    pokemon.image_url ||
    DEFAULT_POKEMON_IMAGE_URL
  );
}

export function PokedexDetailPokemonImage({
  pokemon,
  className,
  gender,
  purified,
}: {
  pokemon: PokemonVariant;
  className: string;
  gender?: PokedexDetailGender;
  purified?: boolean;
}) {
  const image = getPokemonImage(pokemon, { gender, purified });
  const [src, setSrc] = useState(image);

  useEffect(() => {
    setSrc(image);
  }, [image]);

  return (
    <img
      alt=""
      className={className}
      src={src}
      decoding="async"
      draggable={false}
      loading="lazy"
      onError={() => {
        if (src !== DEFAULT_POKEMON_IMAGE_URL) {
          setSrc(DEFAULT_POKEMON_IMAGE_URL);
        }
      }}
    />
  );
}
