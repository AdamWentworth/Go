//NotWantedListManager.jsx

import React from 'react';

const NotWantedListManager = ({ pokemonKey, toggleNotWanted, isNotWanted }) => {
    return (
        <button className="toggle-not-wanted" onClick={() => toggleNotWanted(pokemonKey)}>
            {isNotWanted ? '✓' : 'X'}
        </button>
    );
};

export default NotWantedListManager;



