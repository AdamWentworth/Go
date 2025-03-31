// SortOverlay.jsx
import React from 'react'; // Removed unused useState
import './SortOverlay.css';

const SortOverlay = ({ sortType, setSortType, sortMode, setSortMode, onToggleSortMenu }) => {
  const sortTypeDisplayNames = {
    releaseDate: 'Recent',
    hp: 'HP',
    combatPower: 'Combat Power',
    favorite: 'Favorite',
    number: 'Number',
    name: 'Name',
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

  const getArrowStyle = () => {
    return {
      transform: sortMode === 'ascending' ? 'rotate(0deg)' : 'rotate(180deg)',
      transition: 'transform 0.2s',
    };
  };

  const handleClick = () => {
    console.log('SortOverlay button clicked'); // Debug log
    onToggleSortMenu();
  };

  return (
    <div className="sort-overlay">
      <button onClick={handleClick} className="sort-button">
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
  );
};

export default React.memo(SortOverlay);