// useSortManager.js
import useRecentPokemons from './sort/useRecentPokemons';

const useSortManager = (displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll }) => {
    return useRecentPokemons(displayedPokemons, sortMode, { isShiny, showShadow, showCostume, showAll });
};

export default useSortManager;


