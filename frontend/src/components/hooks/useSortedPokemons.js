//useSortedPokemons.js

import { useMemo } from 'react';

const useSortedPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        if (sortMode === 0) return displayedPokemons;

        return [...displayedPokemons].sort((a, b) => {
            let dateA, dateB;

            // Function to extract the sort date based on variant and costume specifics
            const getSortDate = (pokemon) => {
                // Handling for "Show All" mode
                if (showAll) {
                  if (pokemon.variantType.startsWith('costume')) {
                    // Extracting the costume ID from variantType
                    const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                    const isShinyVariant = pokemon.variantType.includes('shiny');
                    // Finding the matching costume by costumeId
                    const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                    if (costumeData) {
                      // Selecting the appropriate date based on shiny status
                      return new Date(isShinyVariant ? costumeData.date_shiny_available : costumeData.date_available);
                    }
                  } 
                else {
                    // Handle other variant types (default, shiny, shadow, shiny_shadow)
                    switch (pokemon.variantType) {
                      case 'default':
                        return new Date(pokemon.date_available);
                      case 'shiny':
                        return new Date(pokemon.date_shiny_available);
                      case 'shadow':
                        return new Date(pokemon.date_shadow_available);
                      case 'shiny_shadow':
                        return new Date(pokemon.date_shiny_shadow_available);
                      default:
                        return new Date();
                    }
                  }
                } else {
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
                }
            };

            dateA = getSortDate(a);
            dateB = getSortDate(b);

            // Perform the sorting based on the dates determined above
            const comparison = sortMode === 1 ? dateB - dateA : dateA - dateB;
            return comparison !== 0 ? comparison : a.pokemon_id - b.pokemon_id;
        });
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useSortedPokemons;



