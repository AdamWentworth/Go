//NotWantedListManager.jsx

import React from 'react';

const NotWantedListManager = ({ 
    pokemonKey, 
    localNotWantedList, 
    toggleNotWanted 
}) => {
    const isNotWanted = localNotWantedList[pokemonKey];

    return (
        <button className="toggle-not-wanted" onClick={() => toggleNotWanted(pokemonKey)}>
            {isNotWanted ? '✓' : 'X'}
        </button>
    );
};

export default NotWantedListManager;



