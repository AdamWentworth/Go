import { useMemo } from 'react';

const useNumberPokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        if (!displayedPokemons || !Array.isArray(displayedPokemons)) {
            console.error('displayedPokemons is either undefined or not an array:', displayedPokemons);
            return [];
        }

        const filteredAndSortedPokemons = displayedPokemons.filter(pokemon => {
            if (!pokemon.variantType) {
                console.error('pokemon.variantType is undefined for pokemon:', pokemon);
                return false;
            }

            const isVariantShiny = pokemon.variantType === 'shiny';
            const isVariantShadow = pokemon.variantType === 'shadow';
            const isVariantShinyShadow = pokemon.variantType === 'shiny_shadow';
            const isVariantCostume = pokemon.variantType.includes('costume');

            if (!showAll) {
                if (isShiny && !isVariantShiny) return false;
                if (showShadow && !isVariantShadow && !isVariantShinyShadow) return false;
                if (showCostume && !isVariantCostume) return false;
            }

            return true;
        })
        .sort((a, b) => {
            // Primary sorting by pokedex_number
            const pokedexComparison = sortMode === 'ascending' 
                ? a.pokedex_number - b.pokedex_number 
                : b.pokedex_number - a.pokedex_number;

            if (pokedexComparison !== 0) return pokedexComparison;

            // Secondary sorting by form (null comes first)
            if (a.form === null && b.form !== null) return -1;
            if (a.form !== null && b.form === null) return 1;

            // Tertiary sorting by date_available if both forms are non-null
            if (a.form !== null && b.form !== null) {
                const dateA = new Date(a.date_available);
                const dateB = new Date(b.date_available);
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;
            }

            // Prioritize "default" first, then "shiny", and then everything else
            const isDefaultA = a.variantType === 'default';
            const isDefaultB = b.variantType === 'default';
            const isShinyA = a.variantType === 'shiny';
            const isShinyB = b.variantType === 'shiny';

            if (isDefaultA && !isDefaultB) return -1;
            if (!isDefaultA && isDefaultB) return 1;

            if (isShinyA && !isShinyB) return -1;
            if (!isShinyA && isShinyB) return 1;

            // Ensure that costumes come before megas but after shadow and shiny_shadow
            const isCostumeA = a.variantType.includes('costume');
            const isCostumeB = b.variantType.includes('costume');
            const isMegaA = a.variantType.includes('mega');
            const isMegaB = b.variantType.includes('mega');

            if (isCostumeA && isMegaB) return -1;
            if (isMegaA && isCostumeB) return 1;

            // Quaternary sorting by costume's date_available if both are costumes
            if (isCostumeA && isCostumeB) {
                const costumeIdA = parseInt(a.variantType.split('_')[1], 10); // Extract costume_id from variantType
                const costumeIdB = parseInt(b.variantType.split('_')[1], 10);

                const costumeA = a.costumes.find(costume => costume.costume_id === costumeIdA);
                const costumeB = b.costumes.find(costume => costume.costume_id === costumeIdB);

                if (costumeA && costumeB) {
                    const dateCostumeA = new Date(costumeA.date_available);
                    const dateCostumeB = new Date(costumeB.date_available);

                    if (dateCostumeA < dateCostumeB) return -1;
                    if (dateCostumeA > dateCostumeB) return 1;

                    // If dates are the same, sort by costume_id
                    if (costumeIdA < costumeIdB) return -1;
                    if (costumeIdA > costumeIdB) return 1;

                    // If costume_id is the same, non-shiny comes before shiny
                    const isShinyCostumeA = a.variantType.includes('shiny') && isCostumeA;
                    const isShinyCostumeB = b.variantType.includes('shiny') && isCostumeB;
                    
                    if (!isShinyCostumeA && isShinyCostumeB) return -1;
                    if (isShinyCostumeA && !isShinyCostumeB) return 1;
                }
            }

            // Ensure shadow comes before shiny shadow
            const isShadowA = a.variantType === 'shadow';
            const isShinyShadowA = a.variantType === 'shiny_shadow';
            const isShadowB = b.variantType === 'shadow';
            const isShinyShadowB = b.variantType === 'shiny_shadow';

            if (isShadowA && isShinyShadowB) return -1;
            if (isShinyShadowA && isShadowB) return 1;

            // Mega evolutions should be sorted in this specific order: mega_x, mega_y, shiny_mega_x, shiny_mega_y
            const isMegaXA = a.variantType === 'mega_x';
            const isMegaYA = a.variantType === 'mega_y';
            const isShinyMegaXA = a.variantType === 'shiny_mega_x';
            const isShinyMegaYA = a.variantType === 'shiny_mega_y';
            const isMegaXB = b.variantType === 'mega_x';
            const isMegaYB = b.variantType === 'mega_y';
            const isShinyMegaXB = b.variantType === 'shiny_mega_x';
            const isShinyMegaYB = b.variantType === 'shiny_mega_y';

            if (isMegaXA && !isMegaXB) return -1;
            if (!isMegaXA && isMegaXB) return 1;

            if (isMegaYA && !isMegaYB) return -1;
            if (!isMegaYA && isMegaYB) return 1;

            if (isShinyMegaXA && !isShinyMegaXB) return -1;
            if (!isShinyMegaXA && isShinyMegaXB) return 1;

            if (isShinyMegaYA && !isShinyMegaYB) return -1;
            if (!isShinyMegaYA && isShinyMegaYB) return 1;

            return 0;
        });

        return filteredAndSortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useNumberPokemons;
