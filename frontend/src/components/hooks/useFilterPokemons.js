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

            if (showCostume && pokemon.costumes) {
                pokemon.costumes.forEach(costume => {
                    // Check if a shadow variant of the costume exists
                    const shadowVariantExists = costume.shadow_available !== undefined ? costume.shadow_available : 0;

                    if ((isInEvolutionaryFamily || shouldAddPokemon(pokemon, costume, selectedGeneration, isShiny, pokemonTypes, searchTerm, generations, showShadow))
                        && (!isShiny || (isShiny && costume.shiny_available))
                        && (!showShadow || (showShadow && shadowVariantExists))) {
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
