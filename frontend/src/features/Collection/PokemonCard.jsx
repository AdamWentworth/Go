// PokemonCard.jsx

import React, { useEffect, useState, memo, useRef } from 'react';
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
  toggleCardHighlight,
  setIsFastSelectEnabled,
  isEditable,
  onSwipe // new prop for swipe events
}) => {
  // Refs for touch coordinates and flags
  const touchTimeoutRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTouchX = useRef(0);
  const isSwiping = useRef(false);
  const isScrolling = useRef(false);
  const touchHandled = useRef(false);

  // --- Touch Handlers for tap/long-press and swipe detection ---
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    lastTouchX.current = touch.clientX;
    isSwiping.current = false;
    isScrolling.current = false;
    touchHandled.current = false;

    // Long press detection (300ms)
    touchTimeoutRef.current = setTimeout(() => {
      if (!isSwiping.current && !isFastSelectEnabled && isEditable) {
        toggleCardHighlight(pokemon.pokemonKey);
        setIsFastSelectEnabled(true);
      }
      touchTimeoutRef.current = null;
    }, 300);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    lastTouchX.current = touch.clientX;
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Determine if the gesture is mostly horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping.current = true;
    } else {
      isSwiping.current = false;
    }

    // If the user moves enough in any direction, cancel the long press timer
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
      isScrolling.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    const deltaX = lastTouchX.current - touchStartX.current;

    // If a horizontal swipe is detected (e.g. more than 50px), fire the onSwipe callback.
    if (isSwiping.current && Math.abs(deltaX) > 50) {
      const direction = deltaX < 0 ? 'left' : 'right';
      if (onSwipe) onSwipe(direction);
      touchHandled.current = true; // prevent onClick from also firing
      isSwiping.current = false;
      return;
    }

    // If no swipe was detected and the gesture wasn’t a scroll, treat it as a tap.
    if (!isScrolling.current) {
      onSelect();
    }
    isScrolling.current = false;
  };

  const [shouldJiggle, setShouldJiggle] = useState(false);
  const prevIsHighlighted = useRef();

  useEffect(() => {
    if (prevIsHighlighted.current !== undefined && 
        prevIsHighlighted.current !== isHighlighted) {
      setShouldJiggle(true);
      const timer = setTimeout(() => setShouldJiggle(false), 300);
      return () => clearTimeout(timer);
    }
    prevIsHighlighted.current = isHighlighted;
  }, [isHighlighted])

  const [currentImage, setCurrentImage] = useState(pokemon.currentImage);

  const isFemale = pokemon.ownershipStatus?.gender === "Female";
  const isMega = pokemon.ownershipStatus?.is_mega === true;
  const megaForm = pokemon.ownershipStatus?.mega_form;
  const isFused = pokemon.ownershipStatus?.is_fused;
  const fusionForm = pokemon.ownershipStatus?.fusion_form;
  const isDisabled = pokemon.ownershipStatus?.disabled === true;
  const isPurified = pokemon.ownershipStatus?.purified === true;
  const isGigantamax = (pokemon.ownershipStatus?.gigantamax === true || pokemon.variantType.includes('gigantamax'));
  const isDynamax = (pokemon.ownershipStatus?.dynamax === true || pokemon.variantType.includes('dynamax'));

  useEffect(() => {
    if (pokemon) {
      if (isDisabled) {
        // If disabled, load the special disabled image
        setCurrentImage(`${process.env.PUBLIC_URL}/images/disabled/disabled_${pokemon.pokemon_id}.png`);
      } else {
        // Otherwise, use the regular logic to determine the image
        const updatedImage = determineImageUrl(isFemale, pokemon, isMega, megaForm, isFused, fusionForm, isPurified, isGigantamax);
        setCurrentImage(updatedImage || '/images/default_pokemon.png');
      }
    }
  }, [isDisabled, isFemale, isMega, isFused, megaForm, fusionForm, pokemon, isPurified, isGigantamax]);

  // Determine the ownership class
  const getOwnershipClass = () => {
    const filter = ownershipFilter?.toLowerCase() || '';
    switch (filter) {
      case 'owned':   return 'owned';
      case 'trade':   return 'trade';
      case 'wanted':  return 'wanted';
      case 'unowned': return 'unowned';
      default:        return '';
    }
  };

  // Build the card's main CSS class:
  // Add "disabled-card" if isDisabled is true
  const cardClass = `
    pokemon-card
    ${getOwnershipClass()}
    ${isHighlighted ? 'highlighted' : ''}
    ${isDisabled ? 'disabled-card' : ''}
    ${shouldJiggle ? 'jiggle' : ''}
  `.trim();

  // Early returns if images for shiny+shadow do not exist, etc.
  if (isShiny && showShadow && (!pokemon.image_url_shiny_shadow || pokemon.shadow_shiny_available !== 1)) {
    return null;
  }
  if (showShadow && !isShiny && !pokemon.image_url_shadow) {
    return null;
  }

  const shouldDisplayLuckyBackdrop =
    (ownershipFilter.toLowerCase() === 'wanted' && pokemon.ownershipStatus?.pref_lucky) ||
    (ownershipFilter.toLowerCase() === 'owned' && pokemon.ownershipStatus?.lucky);

  return (
    <div
      className={cardClass}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (isDisabled || touchHandled.current) {
          touchHandled.current = false;
          return;
        }
        onSelect();
      }}
    >
      <div className="cp-container">
        <div className="cp-display" style={{ zIndex: 3 }}>
          {ownershipFilter !== "" ? (
            // Condition 1: ownershipFilter is not empty
            pokemon.ownershipStatus?.cp && (
              <>
                <span className="cp-text">CP</span>
                {pokemon.ownershipStatus.cp}
              </>
            )
          ) : (
            // Condition 2: ownershipFilter is empty && sortType is 'combatPower'
            sortType === 'combatPower' && pokemon.cp50 !== undefined && (
              <>
                <span className="cp-text">CP</span>
                {pokemon.cp50}
              </>
            )
          )}
        </div>
      </div>
      <div className="fav-container">
        {pokemon.ownershipStatus?.favorite && (
          <img
            src={`${process.env.PUBLIC_URL}/images/fav_pressed.png`}
            alt="Favorite"
            className="favorite-icon"
            draggable="false"
          />
        )}
      </div>
      <div className="pokemon-image-container">
        {shouldDisplayLuckyBackdrop && (
          <div className="lucky-backdrop-wrapper">
            <img
              src={`${process.env.PUBLIC_URL}/images/lucky.png`}
              alt="Lucky backdrop"
              className="lucky-backdrop"
              draggable="false"
            />
          </div>
        )}
        <img
          src={currentImage}
          alt={pokemon.name}
          loading="lazy"
          className="pokemon-image"
          draggable="false"
        />
        {isDynamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/dynamax.png'} 
              alt="Dynamax Badge" 
              className="max-badge" 
              draggable="false"
            />
          )}
          {isGigantamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/gigantamax.png'} 
              alt="Gigantamax Badge" 
              className="max-badge" 
              draggable="false"
            />
          )}
        {isPurified && (
          <div className="purified-badge">
            <img
              src={`${process.env.PUBLIC_URL}/images/purified.png`}
              alt={`${pokemon.name} is purified`}
              className="purified-badge-image"
              draggable="false"
            />
          </div>
        )}
      </div>
      <p>#{pokemon.pokedex_number}</p>
      <div className="type-icons">
        {pokemon.type_1_icon && (
          <img src={pokemon.type_1_icon} alt={pokemon.type1_name} loading="lazy" draggable="false" />
        )}
        {pokemon.type_2_icon && (
          <img src={pokemon.type_2_icon} alt={pokemon.type2_name} loading="lazy" draggable="false"/>
        )}
      </div>
      <h2 className="pokemon-name-display">
        {generateH2Content(pokemon, multiFormPokedexNumbers, showAll)}
      </h2>
    </div>
  );
};

export default memo(PokemonCard);
