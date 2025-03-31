// SortMenu.jsx

import React, { useState, useEffect } from 'react';
import OverlayPortal from '../../../components/OverlayPortal';
import WindowOverlay from '../../../components/WindowOverlay';
import CloseButton from '../../../components/CloseButton';
import './SortMenu.css';

const SortMenu = ({ sortType, setSortType, sortMode, setSortMode, onClose, isVisible }) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAnimateIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [isVisible]);

  const sortTypeDisplayNames = {
    releaseDate: 'RECENT',
    hp: 'HP',
    combatPower: 'COMBAT POWER',
    favorite: 'FAVORITE',
    number: 'NUMBER',
    name: 'NAME',
  };

  const getImagePath = (type) => {
    switch (type) {
      case 'releaseDate': return '/images/sorting/recent.png';
      case 'favorite': return '/images/sorting/favorite.png';
      case 'number': return '/images/sorting/number.png';
      case 'hp': return '/images/sorting/hp.png';
      case 'name': return '/images/sorting/name.png';
      case 'combatPower': return '/images/sorting/cp.png';
      default: return '/images/sorting/number.png';
    }
  };

  const getArrowStyle = () => ({
    transform: sortMode === 'ascending' ? 'rotate(0deg)' : 'rotate(180deg)',
    transition: 'transform 0.2s',
  });

  const handleSortTypeChange = (newSortType) => {
    if (sortType === newSortType) {
      setSortMode(sortMode === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortType(newSortType);
      setSortMode('ascending');
    }
    onClose();
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <OverlayPortal>
      <div className={`sort-menu-overlay ${animateIn ? 'visible' : ''}`} onClick={handleBackdropClick}>
        <WindowOverlay onClose={onClose} className="sort-menu-content">
          {/* Header with CloseButton */}
          <div className="sort-menu-header">
            <CloseButton onClick={onClose} />
          </div>
          <div className="sort-menu">
            {['releaseDate', 'favorite', 'number', 'hp', 'name', 'combatPower'].map((type) => (
              <button
                key={type}
                onClick={() => handleSortTypeChange(type)}
                className="sort-type-button"
              >
                <span className="sort-type-text">{sortTypeDisplayNames[type]}</span>
                <img className="sort-type-image" src={getImagePath(type)} alt={sortTypeDisplayNames[type]} />
                {sortType === type ? (
                  <img
                    className="sort-type-arrow"
                    src="/images/sorting/arrow.png"
                    alt="Sort Direction"
                    style={getArrowStyle()}
                  />
                ) : (
                  // Keep an empty placeholder for the third column when not selected
                  <span className="sort-type-arrow"></span>
                )}
              </button>
            ))}
          </div>
        </WindowOverlay>
      </div>
    </OverlayPortal>
  );
};

export default React.memo(SortMenu);
