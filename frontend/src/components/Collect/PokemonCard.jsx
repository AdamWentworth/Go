//pokemonCard.jsx

import React, { memo } from 'react';
import { formatPokemonName, formatCostumeName } from './utils/formattingHelpers';
import './PokemonCard.css';

const PokemonCard = ({
    pokemon,
    onSelect,
    isShiny,
    showShadow,
    singleFormPokedexNumbers,
    ownershipFilter,
    isFastSelectEnabled,
    isHighlighted
}) => {
    const imageUrl = pokemon.currentImage;

    const getOwnershipClass = () => {
        const filter = ownershipFilter.toLowerCase();
        let ownershipClass = '';
        switch (filter) {
            case 'owned': ownershipClass = 'owned'; break;
            case 'trade': ownershipClass = 'trade'; break;
            case 'wanted': ownershipClass = 'wanted'; break;
            default: ownershipClass = ''; break;
        }
        return ownershipClass;
    };

    const generateH2Content = () => {
        let costumeText = pokemon.currentCostumeName ? formatCostumeName(pokemon.currentCostumeName) : '';
        let nameText;
    
        // Determine if the form should be included in the nameText
        const shouldIncludeForm = pokemon.form && pokemon.form !== 'Average' && !singleFormPokedexNumbers.includes(pokemon.pokedex_number);
    
        // Adjusting logic for handling pokedex_number 710, 711, and 741 with conditions for costume and form
        if (pokemon.pokedex_number === 710 || pokemon.pokedex_number === 711) {
            if (!pokemon.currentCostumeName && shouldIncludeForm) {
                // Include form only if there's no costume and form is not 'Average'
                nameText = formatPokemonName(pokemon.name, pokemon.form);
            } else {
                // Use name only or include costume if available
                nameText = pokemon.name;
            }
        } else if (pokemon.pokedex_number === 741) {
            // Always include the form in the nameText for pokedex_number 741
            nameText = formatPokemonName(pokemon.name, pokemon.form);
        } else {
            // Apply existing logic for other Pokédex numbers
            nameText = shouldIncludeForm ? formatPokemonName(pokemon.name, pokemon.form) : pokemon.name;
        }
    
        return (
            <>
                {costumeText && <span className="pokemon-costume">{costumeText} </span>}
                <span className="pokemon-form">{nameText}</span>
            </>
        );
    };    

    if (isShiny && showShadow && (!pokemon.image_url_shiny_shadow || pokemon.shadow_shiny_available !== 1)) {
        return null;
    }

    if (showShadow && !isShiny && !pokemon.image_url_shadow) {
        return null;
    }

    const cardClass = `pokemon-card ${getOwnershipClass()} ${isHighlighted ? 'highlighted' : ''}`;

    return (
        <div className={cardClass} onClick={() => {
            if (isFastSelectEnabled) {
                console.log(`Card highlighted: ${pokemon.name}`);
            } else {
                onSelect(); // This will call `setSelectedPokemon(pokemon)`
            }
        }}>
            <img src={imageUrl} alt={pokemon.name} loading="lazy" />
            <p>#{pokemon.pokedex_number}</p>
            <div className="type-icons">
                {pokemon.type_1_icon && (
                    <img src={pokemon.type_1_icon} alt={pokemon.type1_name} loading="lazy" />
                )}
                {pokemon.type_2_icon && (
                    <img src={pokemon.type_2_icon} alt={pokemon.type2_name} loading="lazy" />
                )}
            </div>
            <h2>{generateH2Content()}</h2>
        </div>
    );    
};

export default memo(PokemonCard);
