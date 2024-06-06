import React from 'react';
import './LuckyComponent.css'

const LuckyComponent = ({ pokemon, onToggleLucky, isLucky }) => {
    // Function to toggle the lucky state
    const toggleLucky = () => {
        onToggleLucky(!isLucky);
    };

    return (
        <div className="lucky-component" onClick={toggleLucky}>
            <img 
                src={process.env.PUBLIC_URL + '/images/lucky-icon.png'} 
                alt="Lucky Icon" 
                className={isLucky ? 'lucky-on' : 'lucky-off'}
            />
        </div>
    );
}

export default LuckyComponent;
