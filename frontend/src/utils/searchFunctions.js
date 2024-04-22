//searchFunctions.js

import { generationMap } from './constants';

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

export function matchesSearchTerm(pokemon, searchTerm, pokemonTypes, generations) {

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


export function checkTermMatches(pokemon, term, pokemonTypes, generationMap) {
    const isNegation = term.startsWith('!');

    if (isNegation) {
        term = term.slice(1); // remove '!' from the term
    }

    const isTypeSearch = pokemonTypes.includes(term);
    const isGenerationSearch = Object.keys(generationMap).includes(term);

    let result = false;

    if (isGenerationSearch) {
        result = pokemon.generation === generationMap[term];
    } else if (isTypeSearch) {
        result = (
            (pokemon.type1_name && pokemon.type1_name.toLowerCase() === term) ||
            (pokemon.type2_name && pokemon.type2_name.toLowerCase() === term)
        );
    } else {
        result = (
            pokemon.name &&
            typeof pokemon.name === 'string' &&
            pokemon.name.toLowerCase().includes(term)
        );
    }

    // If the term had a '!', negate the result
    return isNegation ? !result : result;
}



