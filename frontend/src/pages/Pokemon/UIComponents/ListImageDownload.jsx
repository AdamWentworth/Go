// ListImageDownload.jsx
import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import './ListImageDownload.css';

/**
 * Displays "Wanted" and "Trade" Pokémon in a capture-ready area.
 * Exposes a `getCaptureRef()` method to the parent via `forwardRef`.
 */
const ListImageDownload = forwardRef(
  ({
    wantedPokemons = [],
    tradePokemons = [],
    previewMode = false,
    // These props are no longer used directly for styling because we rely on CSS variables,
    // but we now use inline styles for html2canvas compatibility.
    previewBgColor = "#fff",
    sectionFrameBgColor = "#f0f0f0"
  }, ref) => {
    const captureRef = useRef(null);

    useImperativeHandle(ref, () => ({
      getCaptureRef: () => captureRef.current
    }));

    return (
      <div className="list-image-download">
        <div
          ref={captureRef}
          className="capture-area"
          style={{ backgroundColor: previewBgColor }}
        >
          <section
            className="section-block"
            style={{ backgroundColor: sectionFrameBgColor }}
          >
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

          <section
            className="section-block"
            style={{ backgroundColor: sectionFrameBgColor }}
          >
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