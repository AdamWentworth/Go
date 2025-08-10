// TagImageDownload.tsx

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import type { TagItem } from '@/types/tags';
import type { AllVariants } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';
import './TagImageDownload.css';

export interface TagImageDownloadProps {
  wantedPokemons?: TagItem[];
  tradePokemons?: TagItem[];
  variants: AllVariants;
}

export interface TagImageDownloadRef {
  getCaptureRef: () => HTMLDivElement | null;
}

const TagImageDownload = forwardRef<TagImageDownloadRef, TagImageDownloadProps>(
  ({ wantedPokemons = [], tradePokemons = [], variants }, ref) => {
    const captureRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => ({ getCaptureRef: () => captureRef.current }));

    const sortedWanted = useMemo(
      () => [...wantedPokemons].sort((a, b) => a.pokedex_number - b.pokedex_number),
      [wantedPokemons]
    );
    const sortedTrade = useMemo(
      () => [...tradePokemons].sort((a, b) => a.pokedex_number - b.pokedex_number),
      [tradePokemons]
    );

    const renderPokemon = (pokemon: TagItem, idx: number) => {
      let locationBackground: VariantBackground | undefined;
      if (pokemon.location_card != null) {
        const cardId = Number(pokemon.location_card);
        if (!Number.isNaN(cardId)) {
          const matchingVariant = variants.find(v => v.pokemon_id === pokemon.pokemon_id);
          if (matchingVariant) {
            locationBackground = matchingVariant.backgrounds.find(bg => bg.background_id === cardId);
          }
        }
      }

      const isGigantamax = pokemon.variantType?.includes('gigantamax');
      const isDynamax = pokemon.variantType?.includes('dynamax');
      const key = pokemon.key ?? pokemon.instance_id ?? idx;

      return (
        <div key={key} className="tag-image-preview">
          <div className="tag-image-container">
            {locationBackground && (
              <img
                src={locationBackground.image_url}
                alt={`Location backdrop for ${locationBackground.name}`}
                className="tag-location-backdrop"
                draggable={false}
              />
            )}
            {pokemon.pref_lucky && (
              <img
                src="/images/lucky.png"
                alt="Lucky backdrop"
                className="tag-lucky-backdrop"
                draggable={false}
              />
            )}
            <img
              className="tag-main-image"
              src={pokemon.currentImage}
              alt={pokemon.name ?? 'Unknown Pokémon'}
              draggable={false}
            />
          </div>
          {(isGigantamax || isDynamax) && (
            <img
              className="tag-variant-icon"
              src={isGigantamax ? '/images/gigantamax.png' : '/images/dynamax.png'}
              alt={isGigantamax ? 'Gigantamax' : 'Dynamax'}
            />
          )}
          <div className="tag-pokemon-name">{pokemon.name ?? 'Unknown Pokémon'}</div>
        </div>
      );
    };

    return (
      <div className="tag-image-download">
        <div ref={captureRef} className="tag-capture-area">
          <h2>Wanted</h2>
          <section className="tag-section-block wanted-section">
            <div className="tag-pokemon-grid">
              {sortedWanted.map(renderPokemon)}
            </div>
          </section>

          <h2>Trade</h2>
          <section className="tag-section-block trade-section">
            <div className="tag-pokemon-grid">
              {sortedTrade.map(renderPokemon)}
            </div>
          </section>
        </div>
      </div>
    );
  }
);

export default TagImageDownload;
