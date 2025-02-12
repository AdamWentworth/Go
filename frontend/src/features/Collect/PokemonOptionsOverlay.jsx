// PokemonOptionsOverlay.jsx

import React, { useEffect, useRef, useState } from 'react';
import './PokemonOptionsOverlay.css';
import OverlayPortal from '../../components/OverlayPortal';
import PokemonCard from './PokemonCard'; // Adjust the import path as necessary
import OwnedInstance from './InstanceOverlayComponents/OwnedInstance';
import TradeInstance from './InstanceOverlayComponents/TradeInstance';
import WantedInstance from './InstanceOverlayComponents/WantedInstance';
import CloseButton from '../../components/CloseButton'; // Import the CloseButton

/**
 * An "intermediate" popup that gives the user two options:
 *  - Open the real overlay (Pokedex or Instance)
 *  - Highlight this card (fast-select mode)
 *
 * The Pokémon object and a precomputed `isInstance` flag are passed from PokemonList.
 */
const PokemonOptionsOverlay = ({
  pokemon,
  isInstance,
  ownershipFilter,
  onClose,
  onHighlight,
  onOpenOverlay,
}) => {
  // Determine the dynamic text for the left column.
  const openOverlayText = isInstance
    ? `${ownershipFilter} ${pokemon.name}'s Details`
    : `${pokemon.name}'s Pokedex Details`;

  // Create refs for the text elements.
  const optionTextRef = useRef(null);
  const previewTextRef = useRef(null);
  // State to trigger a style adjustment if needed.
  const [forceWrap, setForceWrap] = useState(false);

  // Helper function to calculate number of lines.
  const getLineCount = (element) => {
    if (!element) return 0;
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    return Math.round(element.offsetHeight / lineHeight);
  };

  useEffect(() => {
    const optionLines = getLineCount(optionTextRef.current);
    const previewLines = getLineCount(previewTextRef.current);

    // If one text is on one line and the other wraps (i.e. more than one line),
    // we decide to “force wrap” (apply a CSS class) on both so that they match.
    if ((optionLines === 1 && previewLines > 1) || (previewLines === 1 && optionLines > 1)) {
      setForceWrap(true);
    } else {
      setForceWrap(false);
    }
  }, [openOverlayText /*, any other dependencies if needed */]);

  // Choose the appropriate instance component.
  let InstanceComponent = OwnedInstance;
  if (isInstance) {
    const filter = ownershipFilter.toLowerCase();
    if (filter === 'trade') {
      InstanceComponent = TradeInstance;
    } else if (filter === 'wanted') {
      InstanceComponent = WantedInstance;
    } else {
      InstanceComponent = OwnedInstance;
    }
  }

  const instanceClass = isInstance ? ownershipFilter.toLowerCase() + '-instance' : '';

  return (
    <OverlayPortal>
      <div className="pokemon-options-overlay">
        <div className="overlay-content">
          <h2 className="overlay-header">Choose an Action</h2>
          <div className="overlay-body">
            {/* Left column */}
            <div className="action-column" onClick={() => onOpenOverlay(pokemon)}>
              {isInstance ? (
                <div className="scale-container">
                  <div className={`option-card ${instanceClass}`}>
                    <InstanceComponent pokemon={pokemon} />
                  </div>
                </div>
              ) : (
                <div className="option-card pokedex">
                  <img src="/images/pokedex.png" alt="Pokedex" className="option-image" />
                </div>
              )}
              <span
                ref={optionTextRef}
                className={`option-text ${forceWrap ? 'force-wrap' : ''}`}
              >
                {openOverlayText}
              </span>
            </div>
            {/* Right column */}
            <div className="preview-column" onClick={() => onHighlight(pokemon)}>
              <div className="preview-card-container">
                <PokemonCard
                  key={pokemon.pokemonKey}
                  pokemon={pokemon}
                  onSelect={() => {}}
                  ownershipFilter={ownershipFilter}
                />
              </div>
              <span
                ref={previewTextRef}
                className={`preview-text ${forceWrap ? 'force-wrap' : ''}`}
              >
                Highlight this Pokémon
              </span>
            </div>
          </div>
          {/* Replace the Cancel button with the CloseButton */}
          <CloseButton 
            onClick={onClose}
          />
        </div>
      </div>
    </OverlayPortal>
  );
};

export default PokemonOptionsOverlay;
