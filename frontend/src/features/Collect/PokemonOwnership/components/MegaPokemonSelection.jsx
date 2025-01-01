// MegaPokemonSelection.jsx

import React from 'react';
import './MegaPokemonSelection.css';

const MegaPokemonSelection = ({ baseKey, closeModal, onAssignExisting, onCreateNew }) => {
    return (
        <div className="mega-pokemon-selection-overlay">
            <div className="modal">
                <h2>Mega Pokémon Selection</h2>
                <p>Base Key: {baseKey}</p>
                <p>Select an option:</p>
                <button onClick={onAssignExisting}>Assign to Existing</button>
                <button onClick={onCreateNew}>Create New</button>
                <button onClick={closeModal}>Close</button>
            </div>
        </div>
    );
};

export default MegaPokemonSelection;