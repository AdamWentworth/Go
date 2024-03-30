//pokemonCard.jsx

import React, { useContext, memo } from 'react';
import CacheContext from '../../contexts/cacheContext';
import { formatForm, formatCostumeName } from '../../utils/formattingHelpers';
import './pokemonCard.css'

const PokemonCard = ({
    pokemonKey,
    pokemon,
    setSelectedPokemon,
    isShiny,
    showShadow,
    singleFormPokedexNumbers
}) => {
    const cache = useContext(CacheContext);  // Import the cache

    // Check for image visibility
    if (isShiny && showShadow && (!pokemon.image_url_shiny_shadow || pokemon.shadow_shiny_available !== 1)) {
        return null;
    }

    if (showShadow && !isShiny && !pokemon.image_url_shadow) {
        return null;
    }

    // Check if the image is in cache
    const cachedImage = cache.get(pokemonKey);
    if (!cachedImage) {
        // If image is not in cache, save it to cache
        cache.set(pokemonKey, pokemon.currentImage);
    }

    return (
        <div className="pokemon-card" onClick={() => setSelectedPokemon(pokemon)}>
            <img src={cachedImage || pokemon.currentImage} alt={pokemon.name} loading="lazy" />
            <p>#{pokemon.pokedex_number}</p>
            <div className="type-icons">
                {pokemon.type_1_icon && (
                    <img src={pokemon.type_1_icon} alt={pokemon.type1_name} loading="lazy" />
                )}
                {pokemon.type_2_icon && (
                    <img src={pokemon.type_2_icon} alt={pokemon.type2_name} loading="lazy" />
                )}
            </div>
            <h2>
                {pokemon.currentCostumeName && (
                    <span className="pokemon-costume">{formatCostumeName(pokemon.currentCostumeName)} </span>
                )}
                {pokemon.form && !singleFormPokedexNumbers.includes(pokemon.pokedex_number) && (
                    <span className="pokemon-form">{formatForm(pokemon.form)} </span>
                )}
                {pokemon.name}
            </h2>
        </div>
    );    
};

export default memo(PokemonCard);

