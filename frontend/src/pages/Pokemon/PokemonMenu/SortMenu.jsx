// SortMenu.jsx
import React, { useState, useEffect } from 'react';
import OverlayPortal from '../../../components/OverlayPortal';
import WindowOverlay from '../../../components/WindowOverlay';
import CloseButton from '../../../components/CloseButton';
import './SortMenu.css';

const SortMenu = ({ sortType, setSortType, sortMode, setSortMode }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Combined state for in/out animation

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

  const handleToggleSortMenu = () => {
    if (isMenuVisible) {
      // Start fade-out
      setIsAnimating(false); // Trigger fade-out
    } else {
      // Start fade-in
      setIsMenuVisible(true);
      setTimeout(() => setIsAnimating(true), 10); // Small delay for fade-in
    }
  };

  const handleSortTypeChange = (newSortType) => {
    if (sortType === newSortType) {
      setSortMode(sortMode === 'ascending' ? 'descending' : 'ascending');
    } else {
      setSortType(newSortType);
      setSortMode('ascending');
    }
    setIsAnimating(false); // Trigger fade-out
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      setIsAnimating(false); // Trigger fade-out
    }
  };

  useEffect(() => {
    if (!isAnimating && isMenuVisible) {
      // When fade-out starts and isMenuVisible is still true, wait for animation to finish
      const timer = setTimeout(() => setIsMenuVisible(false), 250); // Match CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating, isMenuVisible]);

  return (
    <>
      {/* Sort Overlay Button */}
      <div className="sort-overlay">
        <button onClick={handleToggleSortMenu} className="sort-button">
          <div className="icon-circle sort-type-circle">
            <img
              src={getImagePath(sortType)}
              alt={sortTypeDisplayNames[sortType]}
              className="sort-button-img"
            />
          </div>
          <div className="icon-circle sort-mode-circle">
            <img
              src="/images/sorting/arrow.png"
              alt="Sort Direction"
              className="sort-arrow-img"
              style={getArrowStyle()}
            />
          </div>
        </button>
      </div>

      {/* Sort Menu */}
      {isMenuVisible && (
        <OverlayPortal>
          <div className={`sort-menu-overlay ${isAnimating ? 'visible' : ''}`} onClick={handleBackdropClick}>
            <WindowOverlay onClose={() => setIsAnimating(false)} className="sort-menu-content">
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
                      <span className="sort-type-arrow"></span>
                    )}
                  </button>
                ))}
              </div>
              <CloseButton onClick={() => setIsAnimating(false)} className="sort-menu-close-button" />
            </WindowOverlay>
          </div>
        </OverlayPortal>
      )}
    </>
  );
};

export default React.memo(SortMenu);