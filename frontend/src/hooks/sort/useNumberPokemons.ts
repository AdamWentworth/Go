// useNumberPokemons.ts

import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useNumberPokemons = (
  displayedPokemons: PokemonVariant[] | undefined,
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    if (!displayedPokemons || !Array.isArray(displayedPokemons)) {
      console.error('displayedPokemons is either undefined or not an array:', displayedPokemons);
      return [];
    }

    return [...displayedPokemons].sort((a, b) => {
      const pokedexComparison = sortMode === 'ascending'
        ? a.pokedex_number - b.pokedex_number
        : b.pokedex_number - a.pokedex_number;

      if (pokedexComparison !== 0) return pokedexComparison;

      if (a.form === null && b.form !== null) return -1;
      if (a.form !== null && b.form === null) return 1;

      if (a.form !== null && b.form !== null) {
        const dateA = new Date(a.date_available);
        const dateB = new Date(b.date_available);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
      }

      const isDefaultA = a.variantType === 'default';
      const isDefaultB = b.variantType === 'default';
      const isShinyA = a.variantType === 'shiny';
      const isShinyB = b.variantType === 'shiny';

      if (isDefaultA && !isDefaultB) return -1;
      if (!isDefaultA && isDefaultB) return 1;
      if (isShinyA && !isShinyB) return -1;
      if (!isShinyA && isShinyB) return 1;

      const isCostumeA = a.variantType.includes('costume');
      const isCostumeB = b.variantType.includes('costume');
      const isMegaA = a.variantType.includes('mega');
      const isMegaB = b.variantType.includes('mega');

      if (isCostumeA && isMegaB) return -1;
      if (isMegaA && isCostumeB) return 1;

      if (isCostumeA && isCostumeB) {
        const costumeIdA = parseInt(a.variantType.split('_')[1], 10);
        const costumeIdB = parseInt(b.variantType.split('_')[1], 10);
        const costumeA = a.costumes.find(costume => costume.costume_id === costumeIdA);
        const costumeB = b.costumes.find(costume => costume.costume_id === costumeIdB);

        if (costumeA && costumeB) {
          const dateA = new Date(costumeA.date_available);
          const dateB = new Date(costumeB.date_available);

          if (dateA < dateB) return -1;
          if (dateA > dateB) return 1;
          if (costumeIdA < costumeIdB) return -1;
          if (costumeIdA > costumeIdB) return 1;

          const isShinyCostumeA = a.variantType.includes('shiny') && isCostumeA;
          const isShinyCostumeB = b.variantType.includes('shiny') && isCostumeB;

          if (!isShinyCostumeA && isShinyCostumeB) return -1;
          if (isShinyCostumeA && !isShinyCostumeB) return 1;
        }
      }

      const isShadowA = a.variantType === 'shadow';
      const isShinyShadowA = a.variantType === 'shiny_shadow';
      const isShadowB = b.variantType === 'shadow';
      const isShinyShadowB = b.variantType === 'shiny_shadow';

      if (isShadowA && isShinyShadowB) return -1;
      if (isShinyShadowA && isShadowB) return 1;

      const isMegaXA = a.variantType === 'mega_x';
      const isMegaYA = a.variantType === 'mega_y';
      const isShinyMegaXA = a.variantType === 'shiny_mega_x';
      const isShinyMegaYA = a.variantType === 'shiny_mega_y';
      const isMegaXB = b.variantType === 'mega_x';
      const isMegaYB = b.variantType === 'mega_y';
      const isShinyMegaXB = b.variantType === 'shiny_mega_x';
      const isShinyMegaYB = b.variantType === 'shiny_mega_y';

      if (isMegaXA && !isMegaXB) return -1;
      if (!isMegaXA && isMegaXB) return 1;

      if (isMegaYA && !isMegaYB) return -1;
      if (!isMegaYA && isMegaYB) return 1;

      if (isShinyMegaXA && !isShinyMegaXB) return -1;
      if (!isShinyMegaXA && isShinyMegaXB) return 1;

      if (isShinyMegaYA && !isShinyMegaYB) return -1;
      if (!isShinyMegaYA && isShinyMegaYB) return 1;

      return 0;
    });
  }, [displayedPokemons, sortMode]);
};

export default useNumberPokemons;