// useRecentPokemons.ts

import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const useRecentPokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode
): PokemonVariant[] => {
  return useMemo(() => {
    const sortOrder = sortMode === 'ascending' ? 1 : -1;

    return [...displayedPokemons].sort((a, b) => {
      const getSortDate = (pokemon: PokemonVariant): Date => {
        const maxData = pokemon.max?.[0];

        if (pokemon.variantType.startsWith('costume')) {
          const costumeId = parseInt(pokemon.variantType.match(/\d+/)?.[0] || '0', 10);
          const isShinyVariant = pokemon.variantType.includes('shiny');
          const costumeData = pokemon.costumes.find(c => c.costume_id === costumeId);
          if (costumeData) {
            return new Date(
              isShinyVariant
                ? costumeData.date_shiny_available ?? costumeData.date_available
                : costumeData.date_available
            );
          }
        }

        if (pokemon.variantType.startsWith('shadow_costume')) {
          const costumeId = parseInt(pokemon.variantType.match(/\d+/)?.[0] || '0', 10);
          const costumeData = pokemon.costumes.find(c => c.costume_id === costumeId);
          if (costumeData?.shadow_costume?.date_available) {
            return new Date(costumeData.shadow_costume.date_available);
          }
        }

        if (pokemon.variantType.includes('fusion')) {
          const parts = pokemon.variantType.split('_');
          const fusionId = parseInt(parts[parts.length - 1], 10);
          const fusionData = pokemon.fusion?.find(f => f.fusion_id === fusionId);
          if (fusionData) return new Date(fusionData.date_available);
        }

        if (pokemon.variantType.includes('mega') || pokemon.variantType.includes('primal')) {
          const megaForm = pokemon.form;
          const selectedMega = pokemon.megaEvolutions?.find(m => m.form === megaForm) ?? pokemon.megaEvolutions?.[0];
          if (selectedMega) return new Date(selectedMega.date_available);
        }

        switch (pokemon.variantType) {
          case 'default': return new Date(pokemon.date_available ?? '');
          case 'shiny': return new Date(pokemon.date_shiny_available ?? '');
          case 'shadow': return new Date(pokemon.date_shadow_available ?? '');
          case 'shiny_shadow': return new Date(pokemon.date_shiny_shadow_available ?? '');
          case 'dynamax':
          case 'shiny_dynamax':
            if (maxData?.dynamax_release_date) {
              return new Date(maxData.dynamax_release_date);
            }
            console.warn(`Missing dynamax_release_date for ${pokemon.name} (#${pokemon.pokedex_number})`);
            return new Date();
          case 'gigantamax':
          case 'shiny_gigantamax':
            if (maxData?.gigantamax_release_date) {
              return new Date(maxData.gigantamax_release_date);
            }
            console.warn(`Missing gigantamax_release_date for ${pokemon.name} (#${pokemon.pokedex_number})`);
            return new Date();
          default:
            return new Date(pokemon.date_available ?? '');
        }
      };

      const dateA = getSortDate(a);
      const dateB = getSortDate(b);

      const comparison = sortOrder * (dateA.getTime() - dateB.getTime());

      return comparison !== 0
        ? comparison
        : sortMode === 'ascending'
          ? a.pokedex_number - b.pokedex_number
          : b.pokedex_number - a.pokedex_number;
    });
  }, [displayedPokemons, sortMode]);
};

export default useRecentPokemons;