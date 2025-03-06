// LuckyComponent.jsx

import React from 'react';
import './LuckyComponent.css';

const LuckyComponent = ({ pokemon, onToggleLucky, isLucky, editMode, isShadow }) => {
    // Move all the rendering conditions inside the component
    if (
        isShadow || 
        pokemon.ownershipStatus.is_for_trade || 
        pokemon.rarity === "Mythic" || 
        !editMode
    ) {
        return null; // Do not render the component if any of these conditions are met
    }

    const toggleLucky = () => {
        if (editMode) {
            onToggleLucky(!isLucky);
        }
    };

    return (
        <div className="lucky-component editable">
            <img 
                src={process.env.PUBLIC_URL + '/images/lucky-icon.png'} 
                alt="Lucky Icon" 
                className={isLucky ? 'lucky-on' : 'lucky-off'}
                onClick={toggleLucky} 
            />
        </div>
    );
};

export default LuckyComponent;
