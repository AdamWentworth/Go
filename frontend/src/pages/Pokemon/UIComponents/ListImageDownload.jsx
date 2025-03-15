// ListImageDownload.jsx
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import useNumberPokemons from '../../../hooks/sort/useNumberPokemons';
import './ListImageDownload.css';

/**
 * Displays "Wanted" and "Trade" Pokémon in a capture-ready area.
 * Exposes a `getCaptureRef()` method to the parent via `forwardRef`.
 */
const ListImageDownload = forwardRef(
  ({ wantedPokemons = [], tradePokemons = [] }, ref) => {
    const captureRef = useRef(null);

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
                const isGigantamax = pokemon.variantType && pokemon.variantType.includes('gigantamax');
                const isDynamax = pokemon.variantType && pokemon.variantType.includes('dynamax');
                return (
                  <div key={pokemon.id || idx} className="pokemon-image-preview">
                    <img
                      className="main-image"
                      src={pokemon.currentImage}
                      alt={pokemon.name || 'Unknown Pokémon'}
                    />
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
                const isGigantamax = pokemon.variantType && pokemon.variantType.includes('gigantamax');
                const isDynamax = pokemon.variantType && pokemon.variantType.includes('dynamax');
                return (
                  <div key={pokemon.id || idx} className="pokemon-image-preview">
                    <img
                      className="main-image"
                      src={pokemon.currentImage}
                      alt={pokemon.name || 'Unknown Pokémon'}
                    />
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
        </div>
      </div>
    );
  }
);

export default ListImageDownload;