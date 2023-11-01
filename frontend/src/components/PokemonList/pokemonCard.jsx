import React, { useContext, memo } from 'react';
import CacheContext from '../../contexts/cacheContext';
import { formatForm } from '../../utils/formattingHelpers';
import { determinePokemonKey } from '../../utils/imageHelpers';

const PokemonCard = ({
    pokemon,
    setSelectedPokemon,
    isShiny,
    showShadow,
    singleFormPokedexNumbers
}) => {
    const cache = useContext(CacheContext);  // Import the cache

    // Check for image visibility
    if (isShiny && showShadow && (!pokemon.shiny_shadow_image || pokemon.shadow_shiny_available !== 1)) {
        return null;
    }

    if (showShadow && !isShiny && !pokemon.shadow_image) {
        return null;
    }

    let pokemonKey = determinePokemonKey(pokemon, isShiny, showShadow);

    // Check if the image is in cache
    const cachedImage = cache.get(pokemonKey);
    if (!cachedImage) {
        // If image is not in cache, save it to cache
        cache.set(pokemonKey, pokemon.currentImage);
    }

    return (
        <div className="pokemon-card"
            key={pokemonKey}
            onClick={() => setSelectedPokemon(pokemon)}
        >
            <img src={cachedImage || pokemon.currentImage} alt={pokemon.name} />
            <p>#{pokemon.pokedex_number}</p>
            <div className="type-icons">
                {pokemon.type_1_icon && <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />}
                {pokemon.type_2_icon && <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />}
            </div>
            <h2>
                {showShadow && pokemon.currentCostumeName
                    ? <span className="pokemon-form">{formatForm(pokemon.currentCostumeName)} </span>
                    : pokemon.form && !singleFormPokedexNumbers.includes(pokemon.pokedex_number) &&
                    <span className="pokemon-form">{formatForm(pokemon.form)} </span>}
                {pokemon.name}
            </h2>
        </div>
    );
};

export default memo(PokemonCard);

