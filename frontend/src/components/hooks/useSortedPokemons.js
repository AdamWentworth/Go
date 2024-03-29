//useSortedPokemons.js

import { useMemo } from 'react';

const useSortedPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume }) => {
    return useMemo(() => {
        if (sortMode === 0) {
            return displayedPokemons;
        } else {
            const pokemonsToSort = [...displayedPokemons];
            pokemonsToSort.sort((a, b) => {
                let dateA, dateB;

                // Adjusted logic for handling shiny costumes
                if (showCostume) {
                    const costumeA = a.costumes?.find(costume => costume.name === a.currentCostumeName);
                    const costumeB = b.costumes?.find(costume => costume.name === b.currentCostumeName);
                    // Use date_shiny_available if both shiny and costume toggles are active, otherwise use date_available
                    dateA = new Date((isShiny && costumeA?.date_shiny_available) || costumeA?.date_available || a.date_available);
                    dateB = new Date((isShiny && costumeB?.date_shiny_available) || costumeB?.date_available || b.date_available);
                } else if (isShiny && showShadow) {
                    dateA = new Date(a.date_shiny_shadow_available || a.date_available);
                    dateB = new Date(b.date_shiny_shadow_available || b.date_available);
                } else if (isShiny) {
                    dateA = new Date(a.date_shiny_available || a.date_available);
                    dateB = new Date(b.date_shiny_available || b.date_available);
                } else if (showShadow) {
                    dateA = new Date(a.date_shadow_available || a.date_available);
                    dateB = new Date(b.date_shadow_available || b.date_available);
                } else {
                    dateA = new Date(a.date_available);
                    dateB = new Date(b.date_available);
                }

                // Sorting by date with a tiebreaker based on pokemon_id for consistent order
                const dateComparison = sortMode === 1 ? dateB - dateA : dateA - dateB;
                if (dateComparison === 0) {
                    return a.pokemon_id - b.pokemon_id; // Tiebreaker: lower pokemon_id first
                }
                return dateComparison;
            });

            return pokemonsToSort;
        }
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume]);
};

export default useSortedPokemons;
