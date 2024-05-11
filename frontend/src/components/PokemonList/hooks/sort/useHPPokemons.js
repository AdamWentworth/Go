import { useMemo } from 'react';

const useHPPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        const filteredAndSortedPokemons = displayedPokemons.filter(pokemon => {
            const isVariantShiny = pokemon.variantType.includes('shiny');
            const isVariantShadow = pokemon.variantType.includes('shadow');
            const isVariantCostume = pokemon.variantType.includes('costume');

            if (!showAll) {
                if (isShiny && !isVariantShiny) return false;
                if (showShadow && !isVariantShadow) return false;
                if (showCostume && !isVariantCostume) return false;
            }

            return true;  // Passes filter
        }).sort((a, b) => {
            // Sort based on stamina, using sortMode to determine direction
            if (sortMode === 'ascending') {
                return a.stamina - b.stamina;
            } else {
                return b.stamina - a.stamina;
            }
        });
        return filteredAndSortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useHPPokemons;
