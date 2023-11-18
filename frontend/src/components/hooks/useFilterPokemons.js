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
        const evolutionaryFamily = showEvolutionaryLine ? getEvolutionaryFamily(searchTerm, allPokemons) : [];

        const filteredPokemons = allPokemons.reduce((acc, pokemon) => {
            const isInEvolutionaryFamily = showEvolutionaryLine && evolutionaryFamily.includes(pokemon.pokemon_id);

            // Existing costume and shiny handling logic should apply regardless of the evolutionary line filter
            if (showCostume && pokemon.costumes) {
                pokemon.costumes.forEach(costume => {
                    if ((isInEvolutionaryFamily || shouldAddPokemon(pokemon, costume, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow)) 
                        && (!isShiny || (isShiny && costume.shiny_available))) {
                        const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow, costume);
                        acc.push({
                            ...pokemon,
                            currentImage: imageToUse,
                            currentCostumeName: costume.name
                        });
                    }
                });
            } else if (isInEvolutionaryFamily || shouldAddPokemon(pokemon, null, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow)) {
                const imageToUse = determinePokemonImage(pokemon, isShiny, showShadow);
                acc.push({
                    ...pokemon,
                    currentImage: imageToUse
                });
            }

            return acc;
        }, []);

        return filteredPokemons;
    }, [allPokemons, selectedGeneration, isShiny, searchTerm, showCostume, showShadow, singleFormPokedexNumbers, pokemonTypes, generations, showEvolutionaryLine]);

    return displayedPokemons;
};

export default useFilterPokemons;
