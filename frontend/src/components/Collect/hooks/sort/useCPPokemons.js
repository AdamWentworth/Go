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
            const cpA = a.ownershipStatus?.cp ?? 0;
            const cpB = b.ownershipStatus?.cp ?? 0;

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
