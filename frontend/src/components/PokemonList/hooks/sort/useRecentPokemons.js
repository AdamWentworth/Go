//useRecentPokemons.js

import { useMemo } from 'react';

const useRecentPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        if (sortMode === 0) return displayedPokemons;

        return [...displayedPokemons].sort((a, b) => {
            let dateA, dateB;

            // Function to extract the sort date based on variant and costume specifics
            const getSortDate = (pokemon) => {
                if (showAll) {
                    if (pokemon.variantType.startsWith('costume')) {
                        const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                        const isShinyVariant = pokemon.variantType.includes('shiny');
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            return new Date(isShinyVariant ? costumeData.date_shiny_available : costumeData.date_available);
                        }
                    } else {
                        // Handle other variant types (default, shiny, shadow, shiny_shadow)
                        switch (pokemon.variantType) {
                            case 'default': return new Date(pokemon.date_available);
                            case 'shiny': return new Date(pokemon.date_shiny_available);
                            case 'shadow': return new Date(pokemon.date_shadow_available);
                            case 'shiny_shadow': return new Date(pokemon.date_shiny_shadow_available);
                            default: return new Date();
                        }
                    }
                } else if (showCostume) {
                    // Extracting costumeId from variantType for matching with costume entry
                    const costumeId = pokemon.variantType.includes('costume') ? parseInt(pokemon.variantType.split('_')[1], 10) : null;
                    if (costumeId != null) {
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            const date = isShiny ? costumeData.date_shiny_available : costumeData.date_available;
                            return new Date(date);
                        }
                    }
                }
                // Fallback to default logic for non-costume or non-matching cases
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

            dateA = getSortDate(a);
            dateB = getSortDate(b);

            // Perform the sorting based on the dates determined above
            const comparison = sortMode === 1 ? dateB - dateA : dateA - dateB;
            return comparison !== 0 ? comparison : a.pokemon_id - b.pokemon_id;
        });
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useRecentPokemons;
