import { useState, useEffect } from 'react';
import { shouldAddPokemon } from '../../utils/searchFunctions';
import { determinePokemonImage } from '../../utils/imageHelpers';

const useFilterPokemons = (allPokemons, filters) => {
    const [displayedPokemons, setDisplayedPokemons] = useState([]);
    const {
        selectedGeneration,
        isShiny,
        searchTerm,
        showCostume,
        showShadow,
        singleFormPokedexNumbers,
        pokemonTypes,
        generations
    } = filters;

    useEffect(() => {
        const filteredPokemons = allPokemons.reduce((acc, pokemon) => {
            const shadowCostumes = [20, 33, 143, 403];

            if (!singleFormPokedexNumbers.includes(pokemon.pokedex_number) || !acc.some(p => p.pokedex_number === pokemon.pokedex_number)) {
                if (showCostume && pokemon.costumes) {
                    pokemon.costumes.forEach(costume => {
                        if (shouldAddPokemon(pokemon, costume, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow)) {
                            const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow, costume);
                            acc.push({
                                ...pokemon,
                                currentImage: imageToUse,
                                currentCostumeName: costume.name
                            });
                        }
                    });
                } else {
                    if (shouldAddPokemon(pokemon, null, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow)) {
                        const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow);
                        acc.push({
                            ...pokemon,
                            currentImage: imageToUse
                        });
                    }
                }
            }
            return acc;
        }, []);

        setDisplayedPokemons(filteredPokemons);
    }, [allPokemons, selectedGeneration, isShiny, searchTerm, showCostume, showShadow, singleFormPokedexNumbers, pokemonTypes, generations]);

    return displayedPokemons;
};

export default useFilterPokemons;
