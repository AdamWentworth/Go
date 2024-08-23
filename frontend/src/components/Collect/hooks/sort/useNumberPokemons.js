import { useMemo } from 'react';

const useNumberPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    // console.log('Displayed Pokemons:', displayedPokemons);
    // console.log('Sort Mode:', sortMode);
    // console.log('Filter Flags:', { isShiny, showShadow, showCostume, showAll });

    return useMemo(() => {
        if (!displayedPokemons || !Array.isArray(displayedPokemons)) {
            console.error('displayedPokemons is either undefined or not an array:', displayedPokemons);
            return [];
        }

        const filteredAndSortedPokemons = displayedPokemons.filter(pokemon => {
            // console.log('Processing Pokemon:', pokemon);
            if (!pokemon.variantType) {
                console.error('pokemon.variantType is undefined for pokemon:', pokemon);
                return false;
            }

            const isVariantShiny = pokemon.variantType.includes('shiny');
            const isVariantShadow = pokemon.variantType.includes('shadow');
            const isVariantCostume = pokemon.variantType.includes('costume');

            // console.log('Variant Flags:', { isVariantShiny, isVariantShadow, isVariantCostume });

            if (!showAll) {
                if (isShiny && !isVariantShiny) return false;
                if (showShadow && !isVariantShadow) return false;
                if (showCostume && !isVariantCostume) return false;
            }

            return true;
        })
        .sort((a, b) => {
            // console.log('Sorting:', { a, b });
            if (sortMode === 'ascending') {
                return a.pokedex_number - b.pokedex_number;
            } else {
                return b.pokedex_number - a.pokedex_number;
            }
        });

        // console.log('Filtered and Sorted Pokemons:', filteredAndSortedPokemons);
        return filteredAndSortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useNumberPokemons;