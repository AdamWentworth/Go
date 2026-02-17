// PokemonOptionsOverlay.tsx

import React, { useEffect, useRef, useState } from 'react';
import './PokemonOptionsOverlay.css';
import OverlayPortal from '@/components/OverlayPortal';
import PokemonCard from './PokemonCard';
import CaughtInstance from '@/pages/Pokemon/features/instances/CaughtInstance';
import TradeInstance from '@/pages/Pokemon/features/instances/TradeInstance';
import WantedInstance from '@/pages/Pokemon/features/instances/WantedInstance';
import CloseButton from '@/components/CloseButton';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

interface PokemonOptionsOverlayProps {
  pokemon: PokemonVariant;
  isInstance: boolean;
  tagFilter: string;
  onClose: () => void;
  onHighlight: (p: PokemonVariant) => void;
  onOpenOverlay: (p: PokemonVariant) => void;
}

// Hook to decide if text needs forced wrapping
const useForceWrap = (
  optionRef: React.RefObject<HTMLElement | null>,
  previewRef: React.RefObject<HTMLElement | null>,
  trigger: string
): boolean => {
  const [forceWrap, setForceWrap] = useState(false);

  useEffect(() => {
    const getLines = (el: HTMLElement | null): number => {
      if (!el) return 0;
      const style = window.getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight || '0');
      return lineHeight > 0 ? Math.round(el.offsetHeight / lineHeight) : 0;
    };
    const optionLines = getLines(optionRef.current);
    const previewLines = getLines(previewRef.current);
    setForceWrap(
      (optionLines === 1 && previewLines > 1) ||
      (previewLines === 1 && optionLines > 1)
    );
  }, [optionRef, previewRef, trigger]);

  return forceWrap;
};

const PokemonOptionsOverlay: React.FC<PokemonOptionsOverlayProps> = ({
  pokemon,
  isInstance,
  tagFilter,
  onClose,
  onHighlight,
  onOpenOverlay,
}) => {
  const openText = isInstance
    ? `${tagFilter} ${pokemon.name}'s Details`
    : `${pokemon.name}'s Pokedex Details`;

  const optionRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<HTMLSpanElement>(null);
  const forceWrap = useForceWrap(optionRef, previewRef, openText);

  const [ignorePointer, setIgnorePointer] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setIgnorePointer(false), 200);
    return () => window.clearTimeout(id);
  }, []);

  // Determine which instance component to use
  let InstanceComponent: React.ComponentType<{ pokemon: unknown; isEditable: boolean }> =
    CaughtInstance as React.ComponentType<{ pokemon: unknown; isEditable: boolean }>;
  if (isInstance) {
    const filter = tagFilter.toLowerCase();
    if (filter === 'trade') {
      InstanceComponent =
        TradeInstance as React.ComponentType<{ pokemon: unknown; isEditable: boolean }>;
    } else if (filter === 'wanted') {
      InstanceComponent =
        WantedInstance as React.ComponentType<{ pokemon: unknown; isEditable: boolean }>;
    }
  }
  const instanceClass = isInstance ? `${tagFilter.toLowerCase()}-instance` : '';

  // Build minimal props for PokemonCard
  const cardPokemon: PokemonVariant & { instanceData?: Partial<PokemonInstance>; currentImage: string } = {
    ...pokemon,
    instanceData: pokemon.instanceData ?? undefined,
    currentImage: pokemon.currentImage ?? pokemon.image_url ?? ''
  };

  return (
    <OverlayPortal>
      <div
        className="pokemon-options-overlay"
        style={{ pointerEvents: ignorePointer ? 'none' : 'auto' }}
      >
        <div className="overlay-content">
          <h2 className="overlay-header">Choose an Action</h2>
          <div className="overlay-body">
            {/* Left: open overlay */}
            <div className="action-column" onClick={() => onOpenOverlay(pokemon)}>
              {isInstance ? (
                <div className="scale-container">
                  <div className={`option-card ${instanceClass}`}> 
                    <InstanceComponent pokemon={pokemon} isEditable={false} />
                  </div>
                </div>
              ) : (
                <div className="option-card pokedex">
                  <img src="/images/pokedex.png" alt="Pokedex" className="option-image" />
                </div>
              )}
              <span ref={optionRef} className={`option-text ${forceWrap ? 'force-wrap' : ''}`}>{openText}</span>
            </div>

            {/* Right: highlight */}
            <div className="preview-column" onClick={() => onHighlight(pokemon)}>
              <div className="preview-card-container">
                <PokemonCard
                  key={pokemon.variant_id}
                  pokemon={cardPokemon}
                  onSelect={() => {}}
                  onSwipe={() => {}}
                  toggleCardHighlight={() => {}}
                  setIsFastSelectEnabled={() => {}}
                  isEditable={false}
                  isFastSelectEnabled={false}
                  isHighlighted={false}
                  tagFilter={tagFilter}
                  sortType=""
                  variantByPokemonId={new Map([[pokemon.pokemon_id, { backgrounds: pokemon.backgrounds }]])}
                />
              </div>
              <span ref={previewRef} className={`preview-text ${forceWrap ? 'force-wrap' : ''}`}>Highlight this Pokémon</span>
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </div>
      </div>
    </OverlayPortal>
  );
};

export default React.memo(PokemonOptionsOverlay);
