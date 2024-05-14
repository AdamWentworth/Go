import { useMemo } from 'react';

const useNamePokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
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
            // Function to extract the base name by slicing off everything before the last space
            const getBaseName = (name) => {
                return name.substring(name.lastIndexOf(' ') + 1);
            };

            const baseNameA = getBaseName(a.name);
            const baseNameB = getBaseName(b.name);

            // Sort alphabetically by base name, using sortMode to determine direction
            if (sortMode === 'ascending') {
                return baseNameA.localeCompare(baseNameB);
            } else {
                return baseNameB.localeCompare(baseNameA);
            }
        });
        return filteredAndSortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useNamePokemons;
