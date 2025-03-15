// ListImageDownload.jsx
// ListImageDownload.jsx
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import useNumberPokemons from '../../../hooks/sort/useNumberPokemons';
import { generateH2Content } from '../../../utils/formattingHelpers';
import './ListImageDownload.css';

/**
 * Displays "Wanted" and "Trade" Pokémon in a capture-ready area.
 * Exposes a `getCaptureRef()` method to the parent via `forwardRef`.
 */
const ListImageDownload = forwardRef(
  ({ wantedPokemons = [], tradePokemons = [], variants }, ref) => {
    const captureRef = useRef(null);

    console.log('Variants:', variants);

    useImperativeHandle(ref, () => ({
      getCaptureRef: () => captureRef.current,
    }));

    // Sort the wanted and trade arrays using useNumberPokemons
    const sortedWanted = useNumberPokemons(
      wantedPokemons,
      'ascending',
      { isShiny: false, showShadow: false, showCostume: false, showAll: true }
    );
    const sortedTrade = useNumberPokemons(
      tradePokemons,
      'ascending',
      { isShiny: false, showShadow: false, showCostume: false, showAll: true }
    );

    return (
      <div className="list-image-download">
        <div ref={captureRef} className="capture-area">
          <h2>Wanted</h2>
          <section className="section-block wanted-section">
            <div className="pokemon-grid">
              {sortedWanted.map((pokemon, idx) => {
                let locationBackground = null;
                if (pokemon.location_card != null) {
                  const matchingVariant = variants.find(
                    (variant) => variant.pokemon_id === pokemon.pokemon_id
                  );
                  if (matchingVariant) {
                    locationBackground = matchingVariant.backgrounds.find(
                      (background) =>
                        background.background_id === pokemon.location_card
                    );
                    if (locationBackground) {
                      console.log(
                        `Wanted: Found matching location background for ${pokemon.name} (id: ${pokemon.pokemon_id}):`,
                        locationBackground
                      );
                    } else {
                      console.log(
                        `Wanted: No matching location background found for ${pokemon.name} (id: ${pokemon.pokemon_id}).`
                      );
                    }
                  } else {
                    console.log(
                      `Wanted: No matching variant found for ${pokemon.name} (id: ${pokemon.pokemon_id}).`
                    );
                  }
                }
                
                const isGigantamax = pokemon.variantType && pokemon.variantType.includes('gigantamax');
                const isDynamax = pokemon.variantType && pokemon.variantType.includes('dynamax');

                return (
                  <div key={pokemon.id || idx} className="pokemon-image-preview">
                    <div className="image-container">
                      {/* Render location backdrop if available (lowest z-index) */}
                      {locationBackground && (
                        <img
                          src={locationBackground.image_url}
                          alt={`Location backdrop for ${locationBackground.name}`}
                          className="location-backdrop"
                          draggable="false"
                        />
                      )}
                      {/* Render lucky backdrop if applicable (above location backdrop) */}
                      {pokemon.pref_lucky && (
                        <img
                          src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                          alt="Lucky backdrop"
                          className="lucky-backdrop"
                          draggable="false"
                        />
                      )}
                      <img
                        className="main-image"
                        src={pokemon.currentImage}
                        alt={pokemon.name || 'Unknown Pokémon'}
                        draggable="false"
                      />
                    </div>
                    {(isGigantamax || isDynamax) && (
                      <img
                        className="variant-icon"
                        src={
                          isGigantamax 
                            ? `${process.env.PUBLIC_URL}/images/gigantamax.png` 
                            : `${process.env.PUBLIC_URL}/images/dynamax.png`
                        }
                        alt={isGigantamax ? 'Gigantamax' : 'Dynamax'}
                      />
                    )}
                    <div className="pokemon-name">
                      {pokemon.name || 'Unknown Pokémon'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <h2>Trade</h2>
          <section className="section-block trade-section">
            <div className="pokemon-grid">
              {sortedTrade.map((pokemon, idx) => {
                let locationBackground = null;
                if (pokemon.location_card != null) {
                  const matchingVariant = variants.find(
                    (variant) => variant.pokemon_id === pokemon.pokemon_id
                  );
                  if (matchingVariant) {
                    locationBackground = matchingVariant.backgrounds.find(
                      (background) =>
                        background.background_id === pokemon.location_card
                    );
                    if (locationBackground) {
                      console.log(
                        `Trade: Found matching location background for ${pokemon.name} (id: ${pokemon.pokemon_id}):`,
                        locationBackground
                      );
                    } else {
                      console.log(
                        `Trade: No matching location background found for ${pokemon.name} (id: ${pokemon.pokemon_id}).`
                      );
                    }
                  } else {
                    console.log(
                      `Trade: No matching variant found for ${pokemon.name} (id: ${pokemon.pokemon_id}).`
                    );
                  }
                }
                
                const isGigantamax = pokemon.variantType && pokemon.variantType.includes('gigantamax');
                const isDynamax = pokemon.variantType && pokemon.variantType.includes('dynamax');

                return (
                  <div key={pokemon.id || idx} className="pokemon-image-preview">
                    <div className="image-container">
                      {locationBackground && (
                        <img
                          src={locationBackground.image_url}
                          alt={`Location backdrop for ${locationBackground.name}`}
                          className="location-backdrop"
                          draggable="false"
                        />
                      )}
                      <img
                        className="main-image"
                        src={pokemon.currentImage}
                        alt={pokemon.name || 'Unknown Pokémon'}
                        draggable="false"
                      />
                    </div>
                    {(isGigantamax || isDynamax) && (
                      <img
                        className="variant-icon"
                        src={
                          isGigantamax 
                            ? `${process.env.PUBLIC_URL}/images/gigantamax.png` 
                            : `${process.env.PUBLIC_URL}/images/dynamax.png`
                        }
                        alt={isGigantamax ? 'Gigantamax' : 'Dynamax'}
                      />
                    )}
                    <div className="pokemon-name">
                      {generateH2Content(pokemon)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  }
);

export default ListImageDownload;