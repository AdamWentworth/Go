// SortOverlay.jsx
import React, { useState } from 'react';
import './SortOverlay.css';

const SortOverlay = ({ sortType, setSortType, sortMode, setSortMode }) => {
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSortTypeChange = (newSortType) => {
        if (newSortType === 'favorite' || newSortType === 'combatPower') {
            // Handle unimplemented sort types with an error message
            setErrorMessage(`Sorting by ${newSortType} is not implemented yet.`);
            setTimeout(() => setErrorMessage(''), 3000); // Clear message after 3 seconds
            return;
        }

        if (sortType === newSortType) {
            // Toggle between ascending and descending if the same type is clicked again
            setSortMode(sortMode === 'ascending' ? 'descending' : 'ascending');
        } else {
            setSortType(newSortType);
            // Default to descending for HP and Release Date, ascending for others when a new sort type is selected
            if (newSortType === 'hp' || newSortType === 'releaseDate') {
                setSortMode('descending');
            } else {
                setSortMode('ascending');
            }
        }
        setShowSortOptions(false);  // Collapse the options after selection
    };

    return (
        <div className="sort-overlay">
            <button onClick={() => setShowSortOptions(!showSortOptions)} className="sort-button">
                Sort: {sortType.charAt(0).toUpperCase() + sortType.slice(1)} ({sortMode})
            </button>
            {showSortOptions && (
                <div className="sort-list">
                    <button onClick={() => handleSortTypeChange('releaseDate')} className="sort-type-button">Release Date</button>
                    <button onClick={() => handleSortTypeChange('favorite')} className="sort-type-button">Favorite</button>
                    <button onClick={() => handleSortTypeChange('number')} className="sort-type-button">Number</button>
                    <button onClick={() => handleSortTypeChange('hp')} className="sort-type-button">HP</button>
                    <button onClick={() => handleSortTypeChange('name')} className="sort-type-button">Name</button>
                    <button onClick={() => handleSortTypeChange('combatPower')} className="sort-type-button">Combat Power</button>
                </div>
            )}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
}

export default SortOverlay;



