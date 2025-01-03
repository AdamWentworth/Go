// PokemonCard.jsx

import React, { useEffect, useState, memo } from 'react';
import { determineImageUrl } from "../../utils/imageHelpers";
import { generateH2Content } from '../../utils/formattingHelpers';
import './PokemonCard.css';


const PokemonCard = ({
    pokemon,
    onSelect,
    isShiny,
    showShadow,
    multiFormPokedexNumbers,
    ownershipFilter,
    isFastSelectEnabled,
    isHighlighted,
    showAll,
    sortType,
    lists
}) => {
    const [currentImage, setCurrentImage] = useState(pokemon.currentImage);

    // Check if ownershipFilter is not an empty string
    useEffect(() => {
        if (ownershipFilter !== "") {
            const lowercasedFilter = ownershipFilter.toLowerCase();
            if (lists[lowercasedFilter]) {
                const relevantList = lists[lowercasedFilter];

                // Ensure the relevant list is an object and find the matching key
                if (relevantList[pokemon.pokemonKey]) {
                    const matchingItem = relevantList[pokemon.pokemonKey];
                    setCurrentImage(matchingItem.currentImage);
                } else {
                    console.warn(`No matching item found for pokemonKey: ${pokemon.pokemonKey}`);
                }
            } else {
                console.warn(`No list found for ownershipFilter: ${lowercasedFilter}`);
            }
        }
    }, [ownershipFilter, lists, pokemon.pokemonKey]);

    const isFemale = pokemon.ownershipStatus?.gender === "Female";
    const isMega = pokemon.ownershipStatus?.mega === true; // Determine if the Pokémon is Mega Evolved

    useEffect(() => {
        // Ensure that 'pokemon' is defined before calling 'determineImageUrl'
        if (pokemon) {
            const updatedImage = determineImageUrl(isFemale, isMega, pokemon);
            if (updatedImage) {
                setCurrentImage(updatedImage);
            } else {
                // Fallback to a default image if 'determineImageUrl' returns undefined
                setCurrentImage('/images/default_pokemon.png');
            }
        }
    }, [isFemale, isMega, pokemon]);

    const getOwnershipClass = () => {
        const filter = ownershipFilter?.toLowerCase() || '';
        let ownershipClass = '';
        switch (filter) {
            case 'owned': ownershipClass = 'owned'; break;
            case 'trade': ownershipClass = 'trade'; break;
            case 'wanted': ownershipClass = 'wanted'; break;
            case 'unowned': ownershipClass = 'unowned'; break;
            default: ownershipClass = ''; break;
        }
        return ownershipClass;
    };

    if (isShiny && showShadow && (!pokemon.image_url_shiny_shadow || pokemon.shadow_shiny_available !== 1)) {
        return null;
    }

    if (showShadow && !isShiny && !pokemon.image_url_shadow) {
        return null;
    }

    const cardClass = `pokemon-card ${getOwnershipClass()} ${isHighlighted ? 'highlighted' : ''}`;

    const shouldDisplayLuckyBackdrop =
        (ownershipFilter.toLowerCase() === 'wanted' && pokemon.ownershipStatus && pokemon.ownershipStatus.pref_lucky) ||
        (ownershipFilter.toLowerCase() === 'owned' && pokemon.ownershipStatus && pokemon.ownershipStatus.lucky);

    return (
        <div className={cardClass} onClick={() => {
            if (isFastSelectEnabled) {
                console.log(`Card highlighted: ${pokemon.name}`);
            } else {
                onSelect();
            }
        }}> 
            <div className="cp-container">
                <div className="cp-placeholder" style={{ zIndex: 3 }}>
                    {sortType === 'combatPower' && (pokemon.ownershipStatus ? pokemon.ownershipStatus.cp : pokemon.cp50) && (
                        <h2 className="cp-display"><span className="cp-text">CP</span>{pokemon.ownershipStatus ? pokemon.ownershipStatus.cp : pokemon.cp50}</h2>
                    )}
                </div>
            </div>
            <div className="fav-container">
                {pokemon.ownershipStatus?.favorite && (
                    <img 
                        src={`${process.env.PUBLIC_URL}/images/fav_pressed.png`} 
                        alt="Favorite" 
                        className="favorite-icon" 
                    />
                )}
            </div>
            <div className="pokemon-image-container" style={{ position: 'relative' }}>
                {shouldDisplayLuckyBackdrop && (
                    <div className="lucky-backdrop-wrapper">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                            alt="Lucky backdrop"
                            className="lucky-backdrop"
                        />
                    </div>
                )}
                <img 
                    src={currentImage}
                    alt={pokemon.name} 
                    loading="lazy" 
                    className="pokemon-image"
                    style={{ zIndex: 4 }} 
                />
            </div>
            <p>#{pokemon.pokedex_number}</p>
            <div className="type-icons">
                {pokemon.type_1_icon && (
                    <img src={pokemon.type_1_icon} alt={pokemon.type1_name} loading="lazy" />
                )}
                {pokemon.type_2_icon && (
                    <img src={pokemon.type_2_icon} alt={pokemon.type2_name} loading="lazy" />
                )}
            </div>
            <h2 className="pokemon-name-display">
                {generateH2Content(pokemon, multiFormPokedexNumbers, showAll)}
            </h2>
        </div>
    );
};

export default memo(PokemonCard);
