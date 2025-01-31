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
                        }
                    }
                    if (pokemon.variantType.startsWith('shadow_costume')) {
                        const costumeId = parseInt(pokemon.variantType.match(/\d+/)[0], 10);
                        const costumeData = pokemon.costumes.find(costume => costume.costume_id === costumeId);
                        if (costumeData) {
                            return new Date(costumeData.shadow_costume.date_available);
                        }
                    }
                    if (pokemon.variantType?.includes('fusion')) {
                        // Split on underscore and get the last element in case of 'shiny_fusion_1'
                        const parts = pokemon.variantType.split('_');
                        const fusionId = parseInt(parts[parts.length - 1], 10);
                        const fusionData = pokemon.fusion?.find(f => f.fusion_id === fusionId);
                        if (fusionData) {
                            return new Date(fusionData.date_available);
                        }
                    }
                    if (pokemon.variantType.includes('mega') || pokemon.variantType.includes('primal')) {
                        // Extract the form directly from the pokemon's form property
                        const megaForm = pokemon.form; // This will be 'X' or 'Y'
                        // If pokemon has mega evolutions
                        if (pokemon.megaEvolutions && pokemon.megaEvolutions.length > 0) {
                            // Find the matching mega evolution based on form
                            const selectedMegaEvolution = pokemon.megaEvolutions.find(
                                mega => mega.form === megaForm
                            ) || pokemon.megaEvolutions[0]; // Fallback to first mega if no match
                            // Return the appropriate date
                            return new Date(selectedMegaEvolution.date_available);
                        }               
                    } else {
                        const maxData = pokemon.max?.[0];
                        switch (pokemon.variantType) {
                            case 'default': return new Date(pokemon.date_available);
                            case 'shiny': return new Date(pokemon.date_shiny_available);
                            case 'shadow': return new Date(pokemon.date_shadow_available);
                            case 'shiny_shadow': return new Date(pokemon.date_shiny_shadow_available);
                            case 'dynamax':
                            case 'shiny_dynamax':
                                if (maxData?.dynamax_release_date) {
                                    return new Date(maxData.dynamax_release_date);
                                } else {
                                    console.warn(`No dynamax_release_date found for Pokemon ${pokemon.name} (ID: ${pokemon.pokedex_number})`);
                                    return new Date();
                                }
                                break;
                            case 'gigantamax':
                            case 'shiny_gigantamax':
                                if (maxData?.gigantamax_release_date) {
                                    return new Date(maxData.gigantamax_release_date);
                                } else {
                                    console.warn(`No gigantamax_release_date found for Pokemon ${pokemon.name} (ID: ${pokemon.pokedex_number})`);
                                    return new Date();
                                }
                                break;
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
                    } else {
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

            if (comparison !== 0) {
                return comparison;
            } else {
                // If dates are the same, tie-breaking logic
                return sortMode === 'ascending' ? 
                    a.pokedex_number - b.pokedex_number : 
                    b.pokedex_number - a.pokedex_number;
            }
        });
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useRecentPokemons;