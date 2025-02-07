//searchFunctions.js

import { generationMap } from '../utils/constants';

export function handleSearchTermChange(
    allPokemons,
    term,
    generations,
    pokemonTypes,
    setFilteredPokemonList,
    setIsShiny,
    setShowShadow,
    setShowCostume
  ) {
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
                  tempResults = tempResults.filter(pokemon => 
                      pokemon.rarity && pokemon.rarity.toLowerCase().includes('legendary')
                  );
              } else if (iTerm === '!legendary') {
                  tempResults = tempResults.filter(pokemon => 
                      !pokemon.rarity || !pokemon.rarity.toLowerCase().includes('legendary')
                  );
              } else if (iTerm === 'mythical') {
                  tempResults = tempResults.filter(pokemon => 
                      pokemon.rarity && pokemon.rarity.toLowerCase() === 'mythic'
                  );
              } else if (iTerm === '!mythical') {
                  tempResults = tempResults.filter(pokemon => 
                      !pokemon.rarity || pokemon.rarity.toLowerCase() !== 'mythic'
                  );
              } else if (iTerm === 'ultrabeast') {
                  tempResults = tempResults.filter(pokemon =>
                      pokemon.rarity && pokemon.rarity.toLowerCase().includes('ultra beast')
                  );
              } else if (iTerm === '!ultrabeast') {
                  tempResults = tempResults.filter(pokemon =>
                      !pokemon.rarity || !pokemon.rarity.toLowerCase().includes('ultra beast')
                  );
              } else if (iTerm === 'regional') {
                  tempResults = tempResults.filter(pokemon => 
                      pokemon.rarity && pokemon.rarity.toLowerCase().includes('regional')
                  );
              } else if (iTerm === '!regional') {
                  tempResults = tempResults.filter(pokemon => 
                      !pokemon.rarity || !pokemon.rarity.toLowerCase().includes('regional')
                  );
              } else if (iTerm === 'mega') {
                  tempResults = tempResults.filter(pokemon =>
                      Array.isArray(pokemon.megaEvolutions) && pokemon.megaEvolutions.length > 0 &&
                      !(pokemon.variantType && pokemon.variantType.includes('shadow'))
                  );
              } else if (iTerm === '!mega') {
                  tempResults = tempResults.filter(pokemon =>
                      !Array.isArray(pokemon.megaEvolutions) || pokemon.megaEvolutions.length === 0
                  );
              } else if (iTerm === 'fusion') {
                  tempResults = tempResults.filter(pokemon =>
                      Array.isArray(pokemon.fusion) && pokemon.fusion.length > 0
                  );
              } else if (iTerm === '!fusion') {
                  tempResults = tempResults.filter(pokemon =>
                      !Array.isArray(pokemon.fusion) || pokemon.fusion.length === 0
                  );
              } else if (iTerm === 'max') {
                  // Return Pokemon that have either 'dynamax' or 'gigantamax'
                  tempResults = tempResults.filter(pokemon => 
                      pokemon.variantType && (
                          pokemon.variantType.includes('dynamax') ||
                          pokemon.variantType.includes('gigantamax')
                      )
                  );
              } else if (iTerm === 'dynamax') {
                  // Return Pokemon that have 'dynamax'
                  tempResults = tempResults.filter(pokemon => 
                      pokemon.variantType && pokemon.variantType.includes('dynamax')
                  );
              } else if (iTerm === 'gigantamax') {
                  // Return Pokemon that have 'gigantamax'
                  tempResults = tempResults.filter(pokemon => 
                      pokemon.variantType && pokemon.variantType.includes('gigantamax')
                  );
              } else {
                  // Generation or type or species name
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
                          pokemon.species_name.toLowerCase().includes(iTerm)
                      );
                  }
              }
          });
  
          tempResults.forEach(p => resultsSet.add(p));
      });
  
      const results = [...resultsSet];
      setFilteredPokemonList(results);
  
      // Setting flags for Shiny / Shadow / Costume
      setIsShiny(shinyFlag && !shinyNegationFlag);
      setShowShadow(shadowFlag && !shadowNegationFlag);
      setShowCostume(costumeFlag && !costumeNegationFlag);
  }
  
export function matchesSearchTerm(pokemon, searchTerm, pokemonTypes, generations) {
    // Split by commas (for union) then by ampersand (for intersection)
    const unionTerms = searchTerm
      .split(',')
      .map(t => t.trim().toLowerCase());

    for (const uTerm of unionTerms) {
        // For each intersection token, remove a leading "+" if present
        const intersectionTerms = uTerm.split('&').map(term => {
            term = term.trim();
            if (term.startsWith('+')) {
                return term.slice(1).toLowerCase();
            }
            return term.toLowerCase();
        });
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
    const isRegionalSearch = term === 'regional';
    const isMegaSearch = term === 'mega';

    // Add these:
    const isMaxSearch = term === 'max';
    const isDynaSearch = term === 'dynamax';
    const isGigaSearch = term === 'gigantamax';

    let result = false;

    if (isGenerationSearch) {
        result = pokemon.generation === generationMap[term];
    } else if (isTypeSearch) {
        // Checking type1_name or type2_name
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
        result = pokemon.rarity && pokemon.rarity.toLowerCase().includes('legendary');
    } else if (isMythicalSearch) {
        result = pokemon.rarity && pokemon.rarity.toLowerCase() === 'mythic';
    } else if (isUltraBeastSearch) {
        result = pokemon.rarity && pokemon.rarity.toLowerCase().includes('ultra beast');
    } else if (isRegionalSearch) {
        result = pokemon.rarity && pokemon.rarity.toLowerCase().includes('regional');
    } else if (isMegaSearch) {
        result = (
            Array.isArray(pokemon.megaEvolutions) &&
            pokemon.megaEvolutions.length > 0 &&
            !(pokemon.variantType && pokemon.variantType.includes('shadow'))
        );
    } else if (term === 'fusion') {
        result = Array.isArray(pokemon.fusion) && pokemon.fusion.length > 0;
    } else if (isMaxSearch) {
        // 'max' = dynamax OR gigantamax
        result = pokemon.variantType && (
            pokemon.variantType.includes('dynamax') ||
            pokemon.variantType.includes('gigantamax')
        );
    } else if (isDynaSearch) {
        result = pokemon.variantType && pokemon.variantType.includes('dynamax');
    } else if (isGigaSearch) {
        result = pokemon.variantType && pokemon.variantType.includes('gigantamax');
    } else {
        // Default to searching the species name
        result = (
            pokemon.species_name &&
            typeof pokemon.species_name === 'string' &&
            pokemon.species_name.toLowerCase().includes(term)
        );
    }

    // Negate if the term had a '!'
    return isNegation ? !result : result;
}
