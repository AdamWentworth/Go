// LuckyComponent.jsx

import React from 'react';
import './LuckyComponent.css'

const LuckyComponent = ({ pokemon, onToggleLucky, isLucky, editMode }) => {
    const toggleLucky = () => {
        if (editMode) {
            onToggleLucky(!isLucky);
        }
    };

    return (
        <div className={`lucky-component ${editMode ? 'editable' : ''}`} onClick={toggleLucky}>
            <img 
                src={process.env.PUBLIC_URL + '/images/lucky-icon.png'} 
                alt="Lucky Icon" 
                className={isLucky ? 'lucky-on' : 'lucky-off'}
            />
        </div>
    );
}

export default LuckyComponent;

