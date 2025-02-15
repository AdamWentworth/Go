// PokemonCard.jsx

import React, { useEffect, useState, memo, useRef } from 'react';
import { determineImageUrl } from "../../utils/imageHelpers";
import { generateH2Content } from '../../utils/formattingHelpers';
import './PokemonCard.css';

const LONG_PRESS_MS = 300;       // Time threshold for long-press
const SWIPE_THRESHOLD = 50;      // Distance threshold for horizontal swipe
const MOVE_CANCEL_THRESHOLD = 10; // Movement that cancels long-press

const PokemonCard = ({
  pokemon,
  onSelect,
  onSwipe,                  // Called with 'left' or 'right' after a horizontal swipe
  toggleCardHighlight,      // Called on successful long-press OR short tap if fast-select is already on
  setIsFastSelectEnabled,   // Called to enable fast-select
  isEditable,
  isFastSelectEnabled,
  isHighlighted,
  ownershipFilter,
  isShiny,
  showShadow,
  multiFormPokedexNumbers,
  showAll,
  sortType,
}) => {
  // Refs for detecting gestures
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTouchX = useRef(0);
  const isSwiping = useRef(false);
  const isScrolling = useRef(false);
  const longPressTimeout = useRef(null);
  const longPressTriggered = useRef(false);

  // Prevents double-firing on mobile (touch + click)
  const touchHandled = useRef(false);

  // For jiggle animation when highlight changes
  const [shouldJiggle, setShouldJiggle] = useState(false);
  const prevIsHighlighted = useRef(isHighlighted);

  useEffect(() => {
    if (prevIsHighlighted.current !== isHighlighted) {
      setShouldJiggle(true);
      const timer = setTimeout(() => setShouldJiggle(false), 300);
      return () => clearTimeout(timer);
    }
    prevIsHighlighted.current = isHighlighted;
  }, [isHighlighted]);

  // Precompute the image to display
  const [currentImage, setCurrentImage] = useState(pokemon.currentImage);

  const isDisabled = pokemon.ownershipStatus?.disabled === true;
  const isFemale = pokemon.ownershipStatus?.gender === "Female";
  const isMega = pokemon.ownershipStatus?.is_mega === true;
  const megaForm = pokemon.ownershipStatus?.mega_form;
  const isFused = pokemon.ownershipStatus?.is_fused;
  const fusionForm = pokemon.ownershipStatus?.fusion_form;
  const isPurified = pokemon.ownershipStatus?.purified === true;
  const isGigantamax =
    pokemon.ownershipStatus?.gigantamax === true ||
    (pokemon.variantType || '').includes('gigantamax');
  const isDynamax =
    pokemon.ownershipStatus?.dynamax === true ||
    (pokemon.variantType || '').includes('dynamax');

  useEffect(() => {
    if (isDisabled) {
      setCurrentImage(`${process.env.PUBLIC_URL}/images/disabled/disabled_${pokemon.pokemon_id}.png`);
    } else {
      const updated = determineImageUrl(
        isFemale,
        pokemon,
        isMega,
        megaForm,
        isFused,
        fusionForm,
        isPurified,
        isGigantamax
      );
      setCurrentImage(updated || '/images/default_pokemon.png');
    }
  }, [
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isPurified,
    isGigantamax,
    pokemon
  ]);

  // Determine the CSS class for ownership styling
  const getOwnershipClass = () => {
    const f = (ownershipFilter || '').toLowerCase();
    switch (f) {
      case 'owned':   return 'owned';
      case 'trade':   return 'trade';
      case 'wanted':  return 'wanted';
      case 'unowned': return 'unowned';
      default:        return '';
    }
  };

  const cardClass = `
    pokemon-card
    ${getOwnershipClass()}
    ${isHighlighted ? 'highlighted' : ''}
    ${isDisabled ? 'disabled-card' : ''}
    ${shouldJiggle ? 'jiggle' : ''}
  `.trim();

  // Bail out if the combination of shiny+shadow doesn’t exist
  if (
    (isShiny && showShadow && (!pokemon.image_url_shiny_shadow || pokemon.shadow_shiny_available !== 1)) ||
    (showShadow && !isShiny && !pokemon.image_url_shadow)
  ) {
    return null;
  }

  const shouldDisplayLuckyBackdrop =
    (ownershipFilter.toLowerCase() === 'wanted' && pokemon.ownershipStatus?.pref_lucky) ||
    (ownershipFilter.toLowerCase() === 'owned' && pokemon.ownershipStatus?.lucky);

  // ──────────────────────────────────────────────────────────────
  // Touch event handlers
  // ──────────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];

    // Reset flags
    touchHandled.current = false;
    isSwiping.current = false;
    isScrolling.current = false;
    longPressTriggered.current = false;

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    lastTouchX.current = touch.clientX;

    // Set up long-press if editable
    if (isEditable) {
      longPressTimeout.current = setTimeout(() => {
        // If no swiping/scrolling yet and not already in fast-select
        if (!isSwiping.current && !isScrolling.current && !isFastSelectEnabled) {
          toggleCardHighlight(pokemon.pokemonKey);
          setIsFastSelectEnabled(true);
        }
        longPressTriggered.current = true;
        longPressTimeout.current = null;
      }, LONG_PRESS_MS);
    }
  };

  const handleTouchMove = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];

    lastTouchX.current = touch.clientX;
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    // If horizontal movement is larger than vertical, mark as swiping
    if (Math.abs(dx) > Math.abs(dy)) {
      isSwiping.current = true;
    }

    // Cancel long-press if movement is beyond a small threshold
    if (Math.abs(dx) > MOVE_CANCEL_THRESHOLD || Math.abs(dy) > MOVE_CANCEL_THRESHOLD) {
      if (longPressTimeout.current) {
        clearTimeout(longPressTimeout.current);
        longPressTimeout.current = null;
      }
      isScrolling.current = true;
    }
  };

  const handleTouchEnd = () => {
    // Clear any pending long-press timer
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    const dx = lastTouchX.current - touchStartX.current;

    // If a valid horizontal swipe
    if (isSwiping.current && Math.abs(dx) > SWIPE_THRESHOLD) {
      const direction = dx < 0 ? 'left' : 'right';
      onSwipe && onSwipe(direction);
      touchHandled.current = true;
      return;
    }

    // If the user scrolled or did a long-press, skip short-tap
    if (isScrolling.current || longPressTriggered.current) {
      return;
    }

    // Otherwise, treat it as a short tap
    // If fast-select is enabled, short-tap toggles highlight
    if (isFastSelectEnabled) {
      toggleCardHighlight(pokemon.pokemonKey);
    } else {
      onSelect();
    }
    touchHandled.current = true;
  };

  // Prevent duplicate events (e.g., iOS sending click after touch)
  const handleClick = () => {
    if (touchHandled.current) {
      touchHandled.current = false;
      return;
    }
    if (isDisabled) return;

    // If fast-select is enabled, toggling highlight on click
    if (isFastSelectEnabled) {
      toggleCardHighlight(pokemon.pokemonKey);
    } else {
      onSelect();
    }
  };

  return (
    <div
      className={cardClass}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="cp-container">
        <div className="cp-display" style={{ zIndex: 3 }}>
          {ownershipFilter !== "" ? (
            pokemon.ownershipStatus?.cp && (
              <>
                <span className="cp-text">CP</span>
                {pokemon.ownershipStatus.cp}
              </>
            )
          ) : (
            sortType === 'combatPower' && pokemon.cp50 != null && (
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
            src={`${process.env.PUBLIC_URL}/images/dynamax.png`}
            alt="Dynamax Badge"
            className="max-badge"
            draggable="false"
          />
        )}
        {isGigantamax && (
          <img
            src={`${process.env.PUBLIC_URL}/images/gigantamax.png`}
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
          <img
            src={pokemon.type_1_icon}
            alt={pokemon.type1_name}
            loading="lazy"
            draggable="false"
          />
        )}
        {pokemon.type_2_icon && (
          <img
            src={pokemon.type_2_icon}
            alt={pokemon.type2_name}
            loading="lazy"
            draggable="false"
          />
        )}
      </div>

      <h2 className="pokemon-name-display">
        {generateH2Content(pokemon, multiFormPokedexNumbers, showAll)}
      </h2>
    </div>
  );
};

export default memo(PokemonCard);