// ListImageDownload.jsx
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import './ListImageDownload.css';

/**
 * Displays "Wanted" and "Trade" Pokémon in a capture-ready area.
 * Exposes a `getCaptureRef()` method to the parent via `forwardRef`.
 */
const ListImageDownload = forwardRef(
  ({ wantedPokemons = [], tradePokemons = [], previewMode = false }, ref) => {
    const captureRef = useRef(null);

    // Expose the DOM node of the capture area to the parent
    useImperativeHandle(ref, () => ({
      getCaptureRef: () => captureRef.current
    }));

    return (
      <div className="list-image-download">
        {/* No download button here; we only render the sections to be captured */}
        <div ref={captureRef} className="capture-area">
          <section className="section-block">
            <h2>Wanted</h2>
            <div className="pokemon-grid">
              {wantedPokemons.map((pokemon, idx) => (
                <div key={pokemon.id || idx} className="pokemon-card">
                  <img
                    src={pokemon.currentImage}
                    alt={pokemon.name || 'Unknown Pokémon'}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="section-block">
            <h2>Trade</h2>
            <div className="pokemon-grid">
              {tradePokemons.map((pokemon, idx) => (
                <div key={pokemon.id || idx} className="pokemon-card">
                  <img
                    src={pokemon.currentImage}
                    alt={pokemon.name || 'Unknown Pokémon'}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }
);

export default ListImageDownload;