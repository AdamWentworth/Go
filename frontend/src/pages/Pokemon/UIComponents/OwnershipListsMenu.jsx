// OwnershipListsMenu.jsx
import React, { useRef, useState } from 'react';
import './OwnershipListsMenu.css';
import html2canvas from 'html2canvas';

// Your custom hook
import useFavoriteList from '../../../hooks/sort/useFavoriteList';
// The display-only preview component
import ListImageDownload from './ListImageDownload';
// The loading spinner
import LoadingSpinner from './../../../components/LoadingSpinner';

const OwnershipListsMenu = ({ onSelectList, activeLists, onSwipe }) => {
  const leftColumnLists = ['Caught', 'Trade'];
  const rightColumnLists = ['Wanted', 'Unowned'];

  // Sorted 'owned' Pokémons using your custom hook
  const sortedOwnedPokemons = useFavoriteList(
    activeLists.owned ? Object.values(activeLists.owned) : []
  );

  // States for toggling the preview mode and loading spinner
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Ref to the child component exposing a capture area
  const downloadRef = useRef(null);

  // Swipe logic
  const SWIPE_THRESHOLD = 50;
  const touchStartX = useRef(0);
  const lastTouchX = useRef(0);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    lastTouchX.current = touch.clientX;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    lastTouchX.current = touch.clientX;
  };

  const handleTouchEnd = () => {
    const dx = lastTouchX.current - touchStartX.current;
    if (dx > SWIPE_THRESHOLD) {
      onSwipe && onSwipe('right');
    } else if (dx < -SWIPE_THRESHOLD) {
      onSwipe && onSwipe('left');
    }
  };

  // Trigger the screenshot/download
  const handleDownload = async () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    if (!captureArea) return;
  
    // Show spinner IMMEDIATELY
    setIsDownloading(true);
    
    // Force synchronous layout update
    const rafPromise = () => new Promise(resolve => requestAnimationFrame(resolve));
    await rafPromise(); // First frame: React state updates
    await rafPromise(); // Second frame: Browser paints
    
    try {
      const canvas = await html2canvas(captureArea);
      const dataURL = canvas.toDataURL('image/png');
  
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = isPreviewMode
        ? 'preview-wanted-trade.png'
        : 'wanted-trade-pokemons.png';
  
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      // Hide spinner when done
      setIsDownloading(false);
    }
  };

  // Render the specified lists (Caught/Trade/Wanted/Unowned)
  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      let listData = [];
      if (listName === 'Owned' || listName === 'Caught') {
        listData = sortedOwnedPokemons;
      } else {
        const lower = listName.toLowerCase();
        listData = activeLists[lower] ? Object.values(activeLists[lower]) : [];
      }

      const previewPokemon = listData.slice(0, 24).map((pokemon, index) => {
        if (!pokemon || !pokemon.currentImage) return null;

        const hasDynamax = pokemon.variantType?.includes('dynamax');
        const hasGigantamax = pokemon.variantType?.includes('gigantamax');
        let overlaySrc = '';

        if (hasGigantamax) {
          overlaySrc = `${process.env.PUBLIC_URL}/images/gigantamax.png`;
        } else if (hasDynamax) {
          overlaySrc = `${process.env.PUBLIC_URL}/images/dynamax.png`;
        }

        const isUnowned = listName === 'Unowned';

        return (
          <div key={pokemon.id || index} className="pokemon-list-container">
            <img
              src={pokemon.currentImage}
              alt={pokemon.name || 'Unknown Pokémon'}
              className={`preview-image ${isUnowned ? 'unowned' : ''}`}
            />
            {overlaySrc && (
              <img
                src={overlaySrc}
                alt={hasGigantamax ? 'Gigantamax' : 'Dynamax'}
                className={`variant-overlay ${isUnowned ? 'unowned' : ''}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      });

      // "Caught" is effectively "Owned"
      const filterName = listName === 'Caught' ? 'Owned' : listName;

      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => onSelectList(filterName)}
          tabIndex="0"
          onKeyPress={(e) => {
            if (e.key === 'Enter') onSelectList(filterName);
          }}
        >
          <div className={`list-header ${listName}`}>{listName}</div>
          <div className="pokemon-preview">
            {previewPokemon.length > 0 ? (
              previewPokemon
            ) : (
              <p className="no-pokemon-text">No Pokémon in this list</p>
            )}
          </div>
        </div>
      );
    });
  };

  // Prepare data for Wanted/Trade
  const wantedPokemons = activeLists.wanted
    ? Object.values(activeLists.wanted)
    : [];
  const tradePokemons = activeLists.trade
    ? Object.values(activeLists.trade)
    : [];

  return (
    <div
      className="lists-menu"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isPreviewMode ? (
        <div className="preview-container">
          {/* Hide header buttons during download */}
          {!isDownloading && (
            <div className="preview-header">
              <button
                className="preview-toggle-button"
                onClick={() => setIsPreviewMode(false)}
              >
                Back to Lists
              </button>

              <button className="preview-toggle-button" onClick={handleDownload}>
                <img
                  src="/images/download-icon.png"
                  alt="Download Icon"
                  className="button-icon"
                />
                Download Preview Image
              </button>
            </div>
          )}

          {/* Rest of the preview content remains the same */}
          <div className="preview-content-wrapper">
            <div className={`capture-container ${isDownloading ? 'hidden-capture' : ''}`}>
              <ListImageDownload
                ref={downloadRef}
                wantedPokemons={wantedPokemons}
                tradePokemons={tradePokemons}
                previewMode={true}
              />
            </div>
            
            {isDownloading && (
              <div className="spinner-overlay">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="toggle-row">
            <button
              className="preview-toggle-button"
              onClick={() => setIsPreviewMode(true)}
            >
              <img
                src="/images/image-icon.png"
                alt="Image Icon"
                className="button-icon"
              />
              Preview Trade / Wanted Image
            </button>
          </div>

          <div className="columns-wrapper">
            <div className="column">{renderListItems(leftColumnLists)}</div>
            <div className="column">{renderListItems(rightColumnLists)}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnershipListsMenu;