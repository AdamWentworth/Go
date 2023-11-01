import React from 'react';
import { formatForm } from '../../utils/formattingHelpers';

const PokemonCard = ({
    pokemon,
    setSelectedPokemon,
    isShiny,
    showShadow,
    singleFormPokedexNumbers
}) => {
    // logic related to rendering a single Pokemon card

    // Check for image visibility
    if (isShiny && showShadow && (!pokemon.shiny_shadow_image || pokemon.shadow_shiny_available !== 1)) {
        return null;
    }

    if (showShadow && !isShiny && !pokemon.shadow_image) {
        return null;
    }

    // Calculate a unique key for each Pokemon
    const apexSuffix = pokemon.shadow_apex === 1 ? `-apex` : `-default`;
    const costumeSuffix = `-${pokemon.currentCostumeName || 'default'}`;

    let pokemonKey = [249, 250].includes(pokemon.pokemon_id)
        ? `${pokemon.pokemon_id}${apexSuffix}`
        : `${pokemon.pokemon_id}${costumeSuffix}`;

    return (
        <div className="pokemon-card"
            key={pokemonKey}
            onClick={() => setSelectedPokemon(pokemon)}
        >
            <img src={pokemon.currentImage} alt={pokemon.name} />
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

export default PokemonCard;
