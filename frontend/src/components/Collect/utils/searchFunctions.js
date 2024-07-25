//searchFunctions.js

import { generationMap } from './constants';

export function handleSearchTermChange(allPokemons, term, generations, pokemonTypes, setFilteredPokemonList, setIsShiny, setShowShadow, setShowCostume) {
    const unionTerms = term.split(',').map(t => t.trim().toLowerCase());

    // Use a set to store the results to avoid duplicates
    let resultsSet = new Set();
    let shinyFlag = false;
    let shinyNegationFlag = false;
    let shadowFlag = false;
    let shadowNegationFlag = false;
    let costumeFlag = false;
    let costumeNegationFlag = false;

    unionTerms.forEach(uTerm => {
        const intersectionTerms = uTerm.split('&').map(t => t.trim().toLowerCase());

        let tempResults = [...allPokemons]; // start with all pokemons and then filter them down

        intersectionTerms.forEach(iTerm => {
            if (iTerm === 'shiny') {
                shinyFlag = true;
            } else if (iTerm === '!shiny') {
                shinyNegationFlag = true;
            } else if (iTerm === 'shadow') {
                shadowFlag = true;
            } else if (iTerm === '!shadow') {
                shadowNegationFlag = true;
            } else if (iTerm === 'costume') {
                costumeFlag = true;
            } else if (iTerm === '!costume') {
                costumeNegationFlag = true;
            } else if (iTerm === 'legendary') {
                tempResults = tempResults.filter(pokemon => pokemon.rarity && pokemon.rarity.toLowerCase() === 'legendary');
            } else if (iTerm === '!legendary') {
                tempResults = tempResults.filter(pokemon => !pokemon.rarity || pokemon.rarity.toLowerCase() !== 'legendary');
            } else if (iTerm === 'mythical') {
                tempResults = tempResults.filter(pokemon => pokemon.rarity && pokemon.rarity.toLowerCase() === 'mythic');
            } else if (iTerm === '!mythical') {
                tempResults = tempResults.filter(pokemon => !pokemon.rarity || pokemon.rarity.toLowerCase() !== 'mythic');
            } else if (iTerm === 'ultrabeast') {
                tempResults = tempResults.filter(pokemon => pokemon.rarity && pokemon.rarity.toLowerCase() === 'ultra beast');
            } else if (iTerm === '!ultrabeast') {
                tempResults = tempResults.filter(pokemon => !pokemon.rarity || pokemon.rarity.toLowerCase() !== 'ultra beast');
            } else {
                const generationNumber = generationMap[iTerm];
                if (generationNumber !== undefined) {
                    tempResults = tempResults.filter(pokemon => pokemon.generation === generationNumber);
                } else if (pokemonTypes.includes(iTerm)) {
                    tempResults = tempResults.filter(pokemon =>
                        Array.isArray(pokemon.type) &&
                        pokemon.type.includes(iTerm)
                    );
                } else {
                    tempResults = tempResults.filter(pokemon =>
                        pokemon.name.toLowerCase().includes(iTerm)
                    );
                }
            }
        });

        tempResults.forEach(pokemon => resultsSet.add(pokemon));
    });

    // Convert the results set to an array for final output
    const results = [...resultsSet];

    setFilteredPokemonList(results);

    setIsShiny(shinyFlag && !shinyNegationFlag);
    setShowShadow(shadowFlag && !shadowNegationFlag);
    setShowCostume(costumeFlag && !costumeNegationFlag);
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
    const isShinySearch = term === 'shiny';
    const isShadowSearch = term === 'shadow';
    const isCostumeSearch = term === 'costume';
    const isLegendarySearch = term === 'legendary';
    const isMythicalSearch = term === 'mythical';
    const isUltraBeastSearch = term === 'ultrabeast';

    let result = false;

    if (isGenerationSearch) {
        result = pokemon.generation === generationMap[term];
    } else if (isTypeSearch) {
        result = (
            (pokemon.type1_name && pokemon.type1_name.toLowerCase() === term) ||
            (pokemon.type2_name && pokemon.type2_name.toLowerCase() === term)
        );
    } else if (isShinySearch) {
        result = pokemon.variantType && pokemon.variantType.includes('shiny');
    } else if (isShadowSearch) {
        result = pokemon.variantType && pokemon.variantType.includes('shadow');
    } else if (isCostumeSearch) {
        result = pokemon.variantType && pokemon.variantType.includes('costume');
    } else if (isLegendarySearch) {
        result = pokemon.rarity && pokemon.rarity.toLowerCase() === 'legendary';
    } else if (isMythicalSearch) {
        result = pokemon.rarity && pokemon.rarity.toLowerCase() === 'mythic';
    } else if (isUltraBeastSearch) {
        result = pokemon.rarity && pokemon.rarity.toLowerCase() === 'ultra beast';
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