// SortOverlay.jsx
import React from 'react';
import './SortOverlay.css'; // Ensure you create a CSS file for styles

const SortOverlay = ({ sortMode, toggleSortMode }) => {
    return (
        <div className="sort-overlay">
            <button onClick={toggleSortMode} className={`sort-button ${sortMode !== 0 ? 'active' : ''}`}>
                Sort: {sortMode === 0 ? 'Off' : sortMode === 1 ? 'New' : 'Old'}
            </button>
        </div>
    );
}

export default SortOverlay;
