// useRecentPokemons.ts

import { useMemo } from 'react';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SortMode } from '@/types/sort'; // Updated import

const toValidTimestamp = (value: string | null | undefined): number => {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const useRecentPokemons = (
  displayedPokemons: PokemonVariant[],
  sortMode: SortMode,
  enabled = true,
): PokemonVariant[] => {
  return useMemo(() => {
    if (!enabled) return displayedPokemons;

    const sortOrder = sortMode === 'ascending' ? 1 : -1;

    return [...displayedPokemons].sort((a, b) => {
      const getSortTimestamp = (pokemon: PokemonVariant): number => {
        const maxData = pokemon.max?.[0];

        if (pokemon.variantType.startsWith('costume')) {
          const costumeId = parseInt(pokemon.variantType.match(/\d+/)?.[0] || '0', 10);
          const isShinyVariant = pokemon.variantType.includes('shiny');
          const costumeData = pokemon.costumes.find(c => c.costume_id === costumeId);
          if (costumeData) {
            return toValidTimestamp(
              isShinyVariant
                ? costumeData.date_shiny_available ?? costumeData.date_available
                : costumeData.date_available
            );
          }
        }

        if (pokemon.variantType.includes('shadow_costume')) {
          const costumeId = parseInt(pokemon.variantType.match(/\d+/)?.[0] || '0', 10);
          const costumeData = pokemon.costumes.find(c => c.costume_id === costumeId);
          if (costumeData?.shadow_costume?.date_available) {
            return toValidTimestamp(costumeData.shadow_costume.date_available);
          }
        }

        if (pokemon.variantType.includes('fusion')) {
          const parts = pokemon.variantType.split('_');
          const fusionId = parseInt(parts[parts.length - 1], 10);
          const fusionData = pokemon.fusion?.find(f => f.fusion_id === fusionId);
          if (fusionData) return toValidTimestamp(fusionData.date_available);
        }

        if (pokemon.variantType.includes('mega') || pokemon.variantType.includes('primal')) {
          const megaForm = pokemon.form;
          const selectedMega = pokemon.megaEvolutions?.find(m => m.form === megaForm) ?? pokemon.megaEvolutions?.[0];
          if (selectedMega) return toValidTimestamp(selectedMega.date_available);
        }

        switch (pokemon.variantType) {
          case 'default': return toValidTimestamp(pokemon.date_available);
          case 'shiny': return toValidTimestamp(pokemon.date_shiny_available);
          case 'shadow': return toValidTimestamp(pokemon.date_shadow_available);
          case 'shiny_shadow': return toValidTimestamp(pokemon.date_shiny_shadow_available);
          case 'dynamax':
          case 'shiny_dynamax':
            return toValidTimestamp(
              maxData?.dynamax_release_date ??
              (pokemon.variantType === 'shiny_dynamax'
                ? pokemon.date_shiny_available
                : pokemon.date_available),
            );
          case 'gigantamax':
          case 'shiny_gigantamax':
            return toValidTimestamp(
              maxData?.gigantamax_release_date ??
              (pokemon.variantType === 'shiny_gigantamax'
                ? pokemon.date_shiny_available
                : pokemon.date_available),
            );
          default:
            return toValidTimestamp(pokemon.date_available);
        }
      };

      const comparison = sortOrder * (getSortTimestamp(a) - getSortTimestamp(b));

      return comparison !== 0
        ? comparison
        : sortMode === 'ascending'
          ? a.pokedex_number - b.pokedex_number
          : b.pokedex_number - a.pokedex_number;
    });
  }, [displayedPokemons, enabled, sortMode]);
};

export default useRecentPokemons;
