// OwnershipListsMenu.jsx
import React, { useRef } from 'react';
import './OwnershipListsMenu.css';
import useFavoriteList from '../../../hooks/sort/useFavoriteList';

const OwnershipListsMenu = ({ onSelectList, activeLists, onSwipe }) => {
  const leftColumnLists = ['Caught', 'Trade'];
  const rightColumnLists = ['Wanted', 'Unowned'];

  const sortedOwnedPokemons = useFavoriteList(
    activeLists.owned ? Object.values(activeLists.owned) : []
  );

  // Swipe handlers for Ownership menu: only allow left swipe
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
  
    // Swipe to the right:
    if (dx > SWIPE_THRESHOLD) {
      onSwipe && onSwipe('right');
    }
    // Swipe to the left:
    else if (dx < -SWIPE_THRESHOLD) {
      onSwipe && onSwipe('left');
    }
  };

  const renderListItems = (listNames) => {
    return listNames.map((listName) => {
      let listData = [];
      if (listName === 'Owned') {
        listData = sortedOwnedPokemons;
      } else {
        listData = activeLists[listName.toLowerCase()]
          ? Object.values(activeLists[listName.toLowerCase()])
          : [];
      }
      const previewPokemon = listData.slice(0, 24).map((pokemon, index) => {
        if (!pokemon || !pokemon.currentImage) return null;
        const hasDynamax = pokemon.variantType && pokemon.variantType.includes('dynamax');
        const hasGigantamax = pokemon.variantType && pokemon.variantType.includes('gigantamax');
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
      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => onSelectList(listName)}
          tabIndex="0"
          onKeyPress={(e) => {
            if (e.key === 'Enter') onSelectList(listName);
          }}
        >
          <div className={`list-header ${listName}`}>
            {listName}
          </div>
          <div className="pokemon-preview">
            {previewPokemon.length > 0 ? previewPokemon : <p className="no-pokemon-text">No Pokémon in this list</p>}
          </div>
        </div>
      );
    });
  };

  return (
    <div
      className="lists-menu"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="column">
        {renderListItems(leftColumnLists)}
      </div>
      <div className="column">
        {renderListItems(rightColumnLists)}
      </div>
    </div>
  );
};

export default OwnershipListsMenu;
