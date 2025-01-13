// useSortManager.js
import useRecentPokemons from './useRecentPokemons';
import useNumberPokemons from './useNumberPokemons';
import useHPPokemons from './useHPPokemons';
import useNamePokemons from './useNamePokemons';  // Import the new sorting hook
import useCPPokemons from './useCPPokemons';
import useFavoritePokemons from './useFavoritePokemons'

const useSortManager = (displayedPokemons, sortType, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    switch (sortType) {
        case 'releaseDate':
            return useRecentPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
        case 'number':
            return useNumberPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
        case 'hp':
            return useHPPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
        case 'name':
            return useNamePokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
        case 'combatPower':
            return useCPPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
        case 'favorite':
            return useFavoritePokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
        default:
            return displayedPokemons;  // Return unsorted if sortType is unrecognized
    }
};

export default useSortManager;