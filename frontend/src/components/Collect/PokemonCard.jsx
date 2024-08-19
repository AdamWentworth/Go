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
            case 'unowned': ownershipClass = 'unowned'; break;
            default: ownershipClass = ''; break;
        }
        return ownershipClass;
    };

    const generateH2Content = () => {
        const nickname = pokemon.ownershipStatus?.nickname;
        if (nickname && nickname.trim()) {
            return nickname;
        }

        let contentParts = [];

        if (pokemon.currentCostumeName) {
            contentParts.push(formatCostumeName(pokemon.currentCostumeName));
        }

        let nameText;
        const isMegaVariant = pokemon.variantType && pokemon.variantType.includes('mega');
        const shouldIncludeForm = !isMegaVariant && pokemon.form && pokemon.form !== 'Average' && (!singleFormPokedexNumbers.includes(pokemon.pokedex_number) || showAll);

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
                onSelect();
            }
        }}>
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
                <div className="cp-placeholder" style={{ zIndex: 3 }}>
                    {sortType === 'combatPower' && (pokemon.ownershipStatus ? pokemon.ownershipStatus.cp : pokemon.cp50) && (
                        <h2 className="cp-display"><span className="cp-text">CP</span>{pokemon.ownershipStatus ? pokemon.ownershipStatus.cp : pokemon.cp50}</h2>
                    )}
                </div>
                <img 
                    src={imageUrl} 
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
                {generateH2Content()}
            </h2>
        </div>
    );
};

export default memo(PokemonCard);