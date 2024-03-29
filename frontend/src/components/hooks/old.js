//useSortedPokemons.js

import { useMemo } from 'react';

const useSortedPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        if (sortMode === 0) {
            return displayedPokemons;
        }

        return [...displayedPokemons].sort((a, b) => {
            let dateA, dateB;

            // Function to determine the sorting date for a given pokemon or variant
            const determineSortDate = (pokemon) => {
                if (showCostume) {
                    const costume = pokemon.costumes?.find(costume => 
                        showAll ? 
                        (pokemon.currentImage === costume.image_url || pokemon.currentImage === costume.image_url_shiny) : 
                        costume.name === pokemon.currentCostumeName);
                    if (costume) {
                        return new Date(isShiny && costume.date_shiny_available ? costume.date_shiny_available : costume.date_available);
                    }
                }
                if (isShiny && showShadow && pokemon.date_shiny_shadow_available) {
                    return new Date(pokemon.date_shiny_shadow_available);
                }
                if (isShiny && pokemon.date_shiny_available) {
                    return new Date(pokemon.date_shiny_available);
                }
                if (showShadow && pokemon.date_shadow_available) {
                    return new Date(pokemon.date_shadow_available);
                }
                return new Date(pokemon.date_available);
            };

            dateA = determineSortDate(a);
            dateB = determineSortDate(b);

            const dateComparison = sortMode === 1 ? dateB - dateA : dateA - dateB;
            return dateComparison !== 0 ? dateComparison : a.pokemon_id - b.pokemon_id;
        });
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useSortedPokemons;

