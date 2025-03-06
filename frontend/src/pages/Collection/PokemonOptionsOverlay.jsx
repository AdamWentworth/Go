// PokemonOptionsOverlay.jsx

import React, { useEffect, useRef, useState } from 'react';
import './PokemonOptionsOverlay.css';
import OverlayPortal from '../../components/OverlayPortal';
import PokemonCard from './PokemonCard';
import OwnedInstance from './InstanceOverlayComponents/OwnedInstance';
import TradeInstance from './InstanceOverlayComponents/TradeInstance';
import WantedInstance from './InstanceOverlayComponents/WantedInstance';
import CloseButton from '../../components/CloseButton';

const PokemonOptionsOverlay = ({
  pokemon,
  isInstance,
  ownershipFilter,
  onClose,
  onHighlight,
  onOpenOverlay,
}) => {
  // Determine the dynamic text for the left column
  const openOverlayText = isInstance
    ? `${ownershipFilter} ${pokemon.name}'s Details`
    : `${pokemon.name}'s Pokedex Details`;

  // For consistent text wrapping
  const optionTextRef = useRef(null);
  const previewTextRef = useRef(null);
  const [forceWrap, setForceWrap] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────────
  //  NEW: Temporarily ignore pointer events to avoid immediate accidental click
  // ─────────────────────────────────────────────────────────────────────────────
  const [ignoreInitialPointer, setIgnoreInitialPointer] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIgnoreInitialPointer(false);
    }, 200); // 200ms delay to ignore that immediate pointer-up
    return () => clearTimeout(timer);
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  // This calculates the line count to see if we need "force-wrap"
  const getLineCount = (element) => {
    if (!element) return 0;
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    return Math.round(element.offsetHeight / lineHeight);
  };

  useEffect(() => {
    const optionLines = getLineCount(optionTextRef.current);
    const previewLines = getLineCount(previewTextRef.current);
    if (
      (optionLines === 1 && previewLines > 1) ||
      (previewLines === 1 && optionLines > 1)
    ) {
      setForceWrap(true);
    } else {
      setForceWrap(false);
    }
  }, [openOverlayText]);

  // Choose the correct instance component
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
      {/* 
        1) If ignoreInitialPointer is true, set pointer-events: none
        2) Else pointer-events: auto
      */}
      <div
        className="pokemon-options-overlay"
        style={{
          pointerEvents: ignoreInitialPointer ? 'none' : 'auto',
        }}
      >
        <div className="overlay-content">
          <h2 className="overlay-header">Choose an Action</h2>
          <div className="overlay-body">
            {/* Left column -> Open full overlay */}
            <div className="action-column" onClick={() => onOpenOverlay(pokemon)}>
              {isInstance ? (
                <div className="scale-container">
                  <div className={`option-card ${instanceClass}`}>
                    <InstanceComponent pokemon={pokemon} />
                  </div>
                </div>
              ) : (
                <div className="option-card pokedex">
                  <img
                    src="/images/pokedex.png"
                    alt="Pokedex"
                    className="option-image"
                  />
                </div>
              )}
              <span
                ref={optionTextRef}
                className={`option-text ${forceWrap ? 'force-wrap' : ''}`}
              >
                {openOverlayText}
              </span>
            </div>

            {/* Right column -> Highlight the Pokemon */}
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
          <CloseButton onClick={onClose} />
        </div>
      </div>
    </OverlayPortal>
  );
};

export default PokemonOptionsOverlay;