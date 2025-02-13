// SortOverlay.jsx
import React, { useState } from 'react';
import './SortOverlay.css';

const SortOverlay = ({ sortType, setSortType, sortMode, setSortMode }) => {
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const sortTypeDisplayNames = {
        releaseDate: 'Recent',
        hp: 'HP',
        combatPower: 'Combat Power',
        favorite: 'Favorite',
        number: 'Number',
        name: 'Name'
    };

    // Function to get image path based on sort type
    const getImagePath = (type) => {
        switch (type) {
            case 'releaseDate': return '/images/sorting/recent.png';
            case 'favorite': return '/images/sorting/favorite.png';
            case 'number': return '/images/sorting/number.png';
            case 'hp': return '/images/sorting/hp.png';
            case 'name': return '/images/sorting/name.png';
            case 'combatPower': return '/images/sorting/cp.png';
            default: return '/images/sorting/number.png'; // Default image
        }
    };

    // Function to adjust the arrow icon based on the sort mode
    const getArrowStyle = () => {
        return { 
            transform: sortMode === 'ascending' ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s'
        };
    };

    const handleSortTypeChange = (newSortType) => {

        // Apply sort mode change or sort type and mode change
        if (sortType === newSortType) {
            setSortMode(sortMode === 'ascending' ? 'descending' : 'ascending');
        } else {
            setSortType(newSortType);
            setSortMode('ascending'); // Default to ascending when a new sort type is selected
        }

        // Close the options after a slight delay
        setTimeout(() => setShowSortOptions(false), 500); // 500ms delay
    };

    return (
        <div className="sort-overlay">
            <button onClick={() => setShowSortOptions(!showSortOptions)} className="sort-button">
                <img src={getImagePath(sortType)} alt={sortTypeDisplayNames[sortType]} className="sort-button-img" />
                <img src="/images/sorting/arrow.png" alt="Sort Direction" className="sort-arrow-img" style={getArrowStyle()} />
            </button>
            {showSortOptions && (
                <div className="sort-list">
                    {['releaseDate', 'favorite', 'number', 'hp', 'name', 'combatPower'].map((type) => (
                        <button key={type} onClick={() => handleSortTypeChange(type)} className="sort-type-button">
                            {sortTypeDisplayNames[type]}
                            <img src={getImagePath(type)} alt={sortTypeDisplayNames[type]} />
                            {sortType === type && (
                                <img src="/images/sorting/arrow.png" alt="Sort Direction" className="sort-arrow-img" style={getArrowStyle()} />
                            )}
                        </button>
                    ))}
                </div>
            )}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default React.memo(SortOverlay);

