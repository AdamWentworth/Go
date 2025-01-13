// useFavoritePokemons.js
import { useMemo } from 'react';

const useFavoritePokemons = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useMemo(() => {
        // Filter Pokémon based on variant criteria and user settings
        const filteredPokemons = displayedPokemons.filter(pokemon => {
            const isVariantShiny = pokemon.variantType?.includes('shiny');
            const isVariantShadow = pokemon.variantType?.includes('shadow');
            const isVariantCostume = pokemon.variantType?.includes('costume');

            if (!showAll) {
                if (isShiny && !isVariantShiny) return false;
                if (showShadow && !isVariantShadow) return false;
                if (showCostume && !isVariantCostume) return false;
            }

            return true;
        });

        // Sort Pokémon: Favorites first, then by CP within each group
        const sortedPokemons = filteredPokemons.sort((a, b) => {
            const favA = a.favorite;
            const favB = b.favorite;

            // Prioritize favorites
            if (favA && !favB) return -1;
            if (!favA && favB) return 1;

            // If both have the same favorite status, sort by CP
            let cpA = a.ownershipStatus 
                        ? (a.ownershipStatus.cp !== undefined ? parseInt(a.ownershipStatus.cp) : parseInt(a.cp50)) 
                        : parseInt(a.cp50);
            let cpB = b.ownershipStatus 
                        ? (b.ownershipStatus.cp !== undefined ? parseInt(b.ownershipStatus.cp) : parseInt(b.cp50)) 
                        : parseInt(b.cp50);

            cpA = isNaN(cpA) ? -1 : cpA;
            cpB = isNaN(cpB) ? -1 : cpB;

            // If CP values are equal, use Pokedex number as a tiebreaker
            if (cpA === cpB) {
                return a.pokedex_number - b.pokedex_number;
            }

            // Sort by CP based on sortMode
            return sortMode === 'ascending' ? cpA - cpB : cpB - cpA;
        });

        return sortedPokemons;
    }, [displayedPokemons, sortMode, isShiny, showShadow, showCostume, showAll]);
};

export default useFavoritePokemons;
