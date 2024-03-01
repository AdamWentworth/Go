import { useMemo } from 'react';

const useSortedPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume }) => {
    return useMemo(() => {
        if (sortMode === 0) {
            return displayedPokemons;
        } else {
            const pokemonsToSort = [...displayedPokemons];
            pokemonsToSort.sort((a, b) => {
                // Determine which date to use for sorting
                let dateA, dateB;
                if (isShiny && showShadow) {
                    // Use shiny shadow available date if both toggles are active
                    dateA = new Date(a.date_shiny_shadow_available || a.date_available);
                    dateB = new Date(b.date_shiny_shadow_available || b.date_available);
                } else if (isShiny) {
                    // Use shiny available date if only shiny toggle is active
                    dateA = new Date(a.date_shiny_available || a.date_available);
                    dateB = new Date(b.date_shiny_available || b.date_available);
                } else if (showShadow) {
                    // Use shadow available date if only shadow toggle is active
                    dateA = new Date(a.date_shadow_available || a.date_available);
                    dateB = new Date(b.date_shadow_available || b.date_available);
                } else {
                    // Default to using the general available date
                    dateA = new Date(a.date_available);
                    dateB = new Date(b.date_available);
                }

                if (sortMode === 1) {
                    // Newest first
                    return dateB - dateA;
                } else if (sortMode === 2) {
                    // Oldest first
                    return dateA - dateB;
                }
            });

            return pokemonsToSort;
        }
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume]);
};

export default useSortedPokemons;
