import { useMemo } from 'react';
import { shouldAddPokemon, getEvolutionaryFamily } from '../../utils/searchFunctions';
import { determinePokemonImage } from '../../utils/imageHelpers';

const useFilterPokemons = (allPokemons, filters, showEvolutionaryLine) => {
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

    const displayedPokemons = useMemo(() => {
        const evolutionaryFamily = showEvolutionaryLine ? getEvolutionaryFamily(filters.searchTerm, allPokemons) : [];

        const filteredPokemons = allPokemons.reduce((acc, pokemon) => {
            // When showEvolutionaryLine is true, include all Pokémon in the evolutionary family
            if (showEvolutionaryLine) {
                if (evolutionaryFamily.includes(pokemon.pokemon_id)) {
                    const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow);
                    acc.push({
                        ...pokemon,
                        currentImage: imageToUse
                    });
                }
            } else {
                // Apply regular filters if showEvolutionaryLine is not active
                const shouldInclude = shouldAddPokemon(pokemon, null, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow);
                if (shouldInclude) {
                    const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow);
                    acc.push({
                        ...pokemon,
                        currentImage: imageToUse
                    });
                }
            }
            return acc;
        }, []);

        return filteredPokemons;
    }, [
        allPokemons, 
        selectedGeneration, 
        isShiny, 
        searchTerm, 
        showCostume, 
        showShadow, 
        singleFormPokedexNumbers, 
        pokemonTypes, 
        generations, 
        showEvolutionaryLine
    ]);

    return displayedPokemons;
};

export default useFilterPokemons;
