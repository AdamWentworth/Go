// useCPPokemons.js

import { useMemo } from 'react';

const useCPPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        const filteredPokemons = displayedPokemons.filter(pokemon => {
            const isVariantShiny = pokemon.variantType?.includes('shiny');
            const isVariantShadow = pokemon.variantType?.includes('shadow');
            const isVariantCostume = pokemon.variantType?.includes('costume');

            if (!showAll) {
                if (isShiny && !isVariantShiny) return false;
                if (showShadow && !isVariantShadow) return false;
                if (showCostume && !isVariantCostume) return false;
            }

            return true;  // Passes filter
        });

        const sortedPokemons = filteredPokemons.sort((a, b) => {
            // Determine the CP values for sorting based on ownership status and ensure numeric comparison
            let cpA = a.ownershipStatus ? (a.ownershipStatus.cp !== undefined ? parseInt(a.ownershipStatus.cp) : parseInt(a.cp50)) : parseInt(a.cp50);
            let cpB = b.ownershipStatus ? (b.ownershipStatus.cp !== undefined ? parseInt(b.ownershipStatus.cp) : parseInt(b.cp50)) : parseInt(b.cp50);

            // Handle possible NaN cases where cp values might not be parseable
            cpA = isNaN(cpA) ? -1 : cpA;  // Assign a low value to ensure these sort last
            cpB = isNaN(cpB) ? -1 : cpB;

            // Secondary sort by Pokedex number if CP is null or not provided
            if (cpA === cpB) {
                return a.pokedex_number - b.pokedex_number;
            }

            // Primary CP sort
            if (sortMode === 'ascending') {
                return cpA - cpB;
            } else {
                return cpB - cpA;
            }
        });

        return sortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useCPPokemons;
