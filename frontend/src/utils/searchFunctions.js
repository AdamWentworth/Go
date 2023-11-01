const generationMap = {
    "kanto": 1,
    "johto": 2,
    "hoenn": 3,
    "sinnoh": 4,
    "unova": 5,
    "kalos": 6,
    "alola": 7,
    "galar": 8,
    "hisui": 9,
    "paldea": 10
};

export function handleSearchTermChange(allPokemons, term, generations, pokemonTypes, setFilteredPokemonList) {
    const unionTerms = term.split(',').map(t => t.trim());

    // Use a set to store the results to avoid duplicates
    let resultsSet = new Set();

    unionTerms.forEach(uTerm => {
        const intersectionTerms = uTerm.split('&').map(t => t.trim());
        
        let tempResults = [...allPokemons]; // start with all pokemons and then filter them down

        intersectionTerms.forEach(iTerm => {
            const generationNumber = generationMap[iTerm.toLowerCase()];
            if (generationNumber !== undefined) {
                tempResults = tempResults.filter(pokemon => pokemon.generation === generationNumber);
            } else if (pokemonTypes.includes(iTerm.toLowerCase())) {
                tempResults = tempResults.filter(pokemon => 
                    Array.isArray(pokemon.type) && 
                    pokemon.type.includes(iTerm.toLowerCase())
                );
            }
        });        
        
        tempResults.forEach(pokemon => resultsSet.add(pokemon));
    });

    // Convert the results set to an array for final output
    const results = [...resultsSet];
    
    setFilteredPokemonList(results);
}


export function shouldAddPokemon(pokemon, costume, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow) {
    const matchesGeneration = selectedGeneration ? pokemon.generation === selectedGeneration : true;
    const matchesShiny = isShiny && showShadow ? pokemon.shiny_available === 1 && pokemon.shadow_shiny_available === 1 : (isShiny ? pokemon.shiny_available === 1 : true);

    const matchesSearch = matchesSearchTerm(pokemon, searchTerm, pokemonTypes, generations);

    const basicMatches = matchesGeneration && matchesShiny && matchesSearch;

    if (costume) {
        return (
            !isShiny && !showShadow ||
            (isShiny && !showShadow && costume.shiny_available === 1) ||
            (!isShiny && showShadow && costume.shadow_available === 1) ||
            (isShiny && showShadow && costume.shiny_available === 1 && costume.shiny_shadow_available === 1)
        ) && basicMatches;
    } else {
        return basicMatches;
    }
}

function matchesSearchTerm(pokemon, searchTerm, pokemonTypes, generations) {

    const unionTerms = searchTerm.split(',').map(term => term.trim().toLowerCase());

    for (const uTerm of unionTerms) {
        const intersectionTerms = uTerm.split('&').map(term => term.trim().toLowerCase());
        const allIntersectionTermsMatch = intersectionTerms.every(term => 
            checkTermMatches(pokemon, term, pokemonTypes, generationMap)
        );

        if (allIntersectionTermsMatch) {
            return true;
        }
    }

    return false;
}


function checkTermMatches(pokemon, term, pokemonTypes, generationMap) {
    const isTypeSearch = pokemonTypes.includes(term);
    const isGenerationSearch = Object.keys(generationMap).includes(term);

    if (isGenerationSearch) {
        return pokemon.generation === generationMap[term];
    } else if (isTypeSearch) {
        return (
            (pokemon.type1_name && pokemon.type1_name.toLowerCase() === term) ||
            (pokemon.type2_name && pokemon.type2_name.toLowerCase() === term)
        );
    } else {
        return (
            pokemon.name &&
            typeof pokemon.name === 'string' &&
            pokemon.name.toLowerCase().includes(term)
        );
    }
}