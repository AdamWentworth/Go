// PokemonCard.jsx

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
    isHighlighted,
    showAll,
    sortType
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
        let contentParts = [];

        if (pokemon.currentCostumeName) {
            contentParts.push(formatCostumeName(pokemon.currentCostumeName));
        }

        let nameText;
        const shouldIncludeForm = pokemon.form && pokemon.form !== 'Average' && (!singleFormPokedexNumbers.includes(pokemon.pokedex_number) || showAll);

        if (shouldIncludeForm) {
            nameText = formatPokemonName(pokemon.name, pokemon.form);
        } else {
            nameText = pokemon.name;
        }

        contentParts.push(nameText);

        return (
            <>
                {contentParts.map((part, index) => (
                    <span key={index} className="pokemon-detail">{part} </span>
                ))}
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

    const shouldDisplayLuckyBackdrop = 
        (ownershipFilter.toLowerCase() === 'wanted' && pokemon.ownershipStatus && pokemon.ownershipStatus.pref_lucky) ||
        (ownershipFilter.toLowerCase() === 'owned' && pokemon.ownershipStatus && pokemon.ownershipStatus.lucky);

    return (
        <div className={cardClass} onClick={() => {
            if (isFastSelectEnabled) {
                console.log(`Card highlighted: ${pokemon.name}`);
            } else {
                onSelect(); // This will call setSelectedPokemon(pokemon)
            }
        }}>
            <div className="pokemon-image-container" style={{ position: 'relative' }}>
                {shouldDisplayLuckyBackdrop && (
                    <img
                        src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                        alt="Lucky backdrop"
                        className="lucky-backdrop"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '150px', // Double the original width of 91px
                            height: '100px', // Double the original height of 63px
                            transform: 'translate(-50%, -50%)',
                            zIndex: 2, // Ensure the backdrop is behind the image
                        }}
                    />
                )}
                <div className="cp-placeholder" style={{ zIndex: 3 }}>
                    {sortType === 'combatPower' && (pokemon.ownershipStatus ? pokemon.ownershipStatus.cp : pokemon.cp50) && (
                        <p className="cp-display"><span className="cp-text">CP</span>{pokemon.ownershipStatus ? pokemon.ownershipStatus.cp : pokemon.cp50}</p>
                    )}
                </div>
                <img 
                    src={imageUrl} 
                    alt={pokemon.name} 
                    loading="lazy" 
                    style={{ zIndex: 4, filter: ownershipFilter.toLowerCase() === 'unowned' ? 'brightness(0)' : 'none' }} 
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
            <h2>
                {generateH2Content()}
            </h2>
        </div>
    );
};

export default memo(PokemonCard);
