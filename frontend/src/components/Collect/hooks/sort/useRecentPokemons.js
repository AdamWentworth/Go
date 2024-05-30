//useRecentPokemons.js

import { useMemo } from 'react';

const useRecentPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        // Convert 'ascending' or 'descending' to appropriate sort order
        const sortOrder = sortMode === 'ascending' ? 1 : -1;

        // Filter out non-shadow costumes if both showShadow and showCostume are true
        const filteredPokemons = showShadow && showCostume ? 
            displayedPokemons.filter(pokemon => 
                pokemon.variantType.startsWith('shadow_costume') && 
                pokemon.costumes.some(costume => costume.shadow_costume)
            ) : 
            displayedPokemons;

        return filteredPokemons.sort((a, b) => {
            let dateA, dateB;

            const getSortDate = (pokemon) => {
                if (showAll) {
                    if (pokemon.variantType.startsWith('costume')) {
                        const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                        const isShinyVariant = pokemon.variantType.includes('shiny');
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            return new Date(isShinyVariant ? costumeData.date_shiny_available : costumeData.date_available);
                        }}
                    if (pokemon.variantType.startsWith('shadow_costume')) {
                        const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            return new Date(costumeData.shadow_costume.date_available);
                        }
                    }
                    else {
                        switch (pokemon.variantType) {
                            case 'default': return new Date(pokemon.date_available);
                            case 'shiny': return new Date(pokemon.date_shiny_available);
                            case 'shadow': return new Date(pokemon.date_shadow_available);
                            case 'shiny_shadow': return new Date(pokemon.date_shiny_shadow_available);
                            default: return new Date();
                        }
                    }
                } else if (showCostume) {
                    const costumeId = pokemon.variantType.includes('costume') ? parseInt(pokemon.variantType.split('_')[1], 10) : null;
                    if (costumeId != null) {
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            const date = isShiny ? costumeData.date_shiny_available : costumeData.date_available;
                            return new Date(date);
                        }
                        if (pokemon.variantType.startsWith('shadow_costume')) {
                            const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                            const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                            if (costumeData) {
                                return new Date(costumeData.shadow_costume.date_available);
                            }
                        }
                    }
                }
                if (isShiny && showShadow && pokemon.date_shiny_shadow_available) {
                    return new Date(pokemon.date_shiny_shadow_available);
                }
                if (isShiny && pokemon.date_shiny_available) {
                    return new Date(pokemon.date_shiny_available);
                }
                if (showShadow && pokemon.date_shadow_available) {
                    if (pokemon.variantType.startsWith('shadow_costume')) {
                        const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            return new Date(costumeData.shadow_costume.date_available);
                        }
                    }
                    else {
                    return new Date(pokemon.date_shadow_available);
                    }
                }
                if (showShadow && showCostume) {
                    if (pokemon.variantType.startsWith('shadow_costume')) {
                        const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            return new Date(costumeData.shadow_costume.date_available);
                        }
                    }
                }
                return new Date(pokemon.date_available);
            };

            dateA = getSortDate(a);
            dateB = getSortDate(b);

            // Use `sortOrder` to determine the sorting direction
            const comparison = sortOrder * (dateA - dateB);
            return comparison !== 0 ? comparison : a.pokemon_id - b.pokemon_id;
        });
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useRecentPokemons;
