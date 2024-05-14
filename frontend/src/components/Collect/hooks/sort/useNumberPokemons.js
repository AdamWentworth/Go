import { useMemo } from 'react';

const useNumberPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        const filteredAndSortedPokemons = displayedPokemons.filter(pokemon => {
            // Apply filtering based on the variant flags
            const isVariantShiny = pokemon.variantType.includes('shiny');
            const isVariantShadow = pokemon.variantType.includes('shadow');
            const isVariantCostume = pokemon.variantType.includes('costume');

            if (!showAll) {
                if (isShiny && !isVariantShiny) return false;
                if (showShadow && !isVariantShadow) return false;
                if (showCostume && !isVariantCostume) return false;
            }

            return true; // If showAll is true or none of the above conditions block the pokemon, it passes.
        })
        .sort((a, b) => {
            // Sorting logic remains the same
            if (sortMode === 'ascending') {
                return a.pokedex_number - b.pokedex_number;
            } else {
                return b.pokedex_number - a.pokedex_number;
            }
        });
        return filteredAndSortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useNumberPokemons;
