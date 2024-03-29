//useShowAllPokemons.js

import { useMemo } from 'react';

const useShowAllPokemons = (allPokemons) => {
    const displayedPokemons = useMemo(() => {
        // Initially, just return allPokemons without filtering
        return allPokemons;
    }, [allPokemons]);

    return displayedPokemons;
};

export default useShowAllPokemons;
