export function determinePokemonImage(pokemon, isShiny, showShadow, costume) {
    let image;
    if (costume) {
        if (isShiny && showShadow) {
            image = costume.shiny_shadow_image;
        } else if (isShiny) {
            image = costume.shiny_image;
        } else if (showShadow) {
            image = costume.shadow_image;
        } else {
            image = costume.image;
        }
    } else {
        if (isShiny && showShadow) {
            image = pokemon.shiny_shadow_image;
        } else if (isShiny) {
            image = pokemon.shiny_image;
        } else if (showShadow) {
            image = pokemon.shadow_image;
        } else {
            image = pokemon.image;
        }
    }
    return image;
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

    const terms = searchTerm.includes('&') 
        ? searchTerm.split('&').map(term => term.trim().toLowerCase()) 
        : [searchTerm.toLowerCase()];

    for (const term of terms) {
        const isTypeSearch = pokemonTypes.includes(term);
        const isGenerationSearch = generations.includes(term.charAt(0).toUpperCase() + term.slice(1)); // Check if the term is a generation

        if (isGenerationSearch) {
            if (pokemon.generation !== generationMap[term]) {
                return false;
            }
        } else if (isTypeSearch) {
            if (!(pokemon.type1_name && pokemon.type1_name.toLowerCase() === term) && 
                !(pokemon.type2_name && pokemon.type2_name.toLowerCase() === term)) {
                return false;
            }
        } else {
            if (!pokemon.name || typeof pokemon.name !== 'string' || !pokemon.name.toLowerCase().includes(term)) {
                return false;
            }
        }
    }

    return true;
}


export function formatForm(form) {
    if (!form) return "";

    const words = form
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

    // If there are only 2 words, just return as they are already capitalized
    if (words.length === 2) {
        return words.join(' ');
    }

    return words.join(' ');
}