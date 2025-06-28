// ListImageDownload.tsx

import React, { forwardRef, useRef, useImperativeHandle, useMemo } from 'react';
import type { TagItem } from '@/types/tags';
import type { AllVariants } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';
import './ListImageDownload.css';

export interface ListImageDownloadProps {
  wantedPokemons?: TagItem[];
  tradePokemons?: TagItem[];
  variants: AllVariants;
}

export interface ListImageDownloadRef {
  getCaptureRef: () => HTMLDivElement | null;
}

const ListImageDownload = forwardRef<ListImageDownloadRef, ListImageDownloadProps>(
  ({ wantedPokemons = [], tradePokemons = [], variants }, ref) => {
    const captureRef = useRef<HTMLDivElement>(null);
    useImperativeHandle(ref, () => ({ getCaptureRef: () => captureRef.current }));

    // Local sorting by pokedex_number
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
        <div key={key} className="pokemon-image-preview">
          <div className="image-container">
            {locationBackground && (
              <img
                src={locationBackground.image_url}
                alt={`Location backdrop for ${locationBackground.name}`}
                className="location-backdrop"
                draggable={false}
              />
            )}
            {pokemon.pref_lucky && (
              <img
                src="/images/lucky.png"
                alt="Lucky backdrop"
                className="lucky-backdrop"
                draggable={false}
              />
            )}
            <img
              className="main-image"
              src={pokemon.currentImage}
              alt={pokemon.name ?? 'Unknown Pokémon'}
              draggable={false}
            />
          </div>
          {(isGigantamax || isDynamax) && (
            <img
              className="variant-icon"
              src={isGigantamax ? '/images/gigantamax.png' : '/images/dynamax.png'}
              alt={isGigantamax ? 'Gigantamax' : 'Dynamax'}
            />
          )}
          <div className="pokemon-name">{pokemon.name ?? 'Unknown Pokémon'}</div>
        </div>
      );
    };

    return (
      <div className="list-image-download">
        <div ref={captureRef} className="capture-area">
          <h2>Wanted</h2>
          <section className="section-block wanted-section">
            <div className="pokemon-grid">
              {sortedWanted.map(renderPokemon)}
            </div>
          </section>

          <h2>Trade</h2>
          <section className="section-block trade-section">
            <div className="pokemon-grid">
              {sortedTrade.map(renderPokemon)}
            </div>
          </section>
        </div>
      </div>
    );
  }
);

export default ListImageDownload;
