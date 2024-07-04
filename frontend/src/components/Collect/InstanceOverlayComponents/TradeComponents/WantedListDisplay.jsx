// WantedListDisplay.jsx

import React from 'react';
import './WantedListDisplay.css'

const WantedListDisplay = ({ pokemon, lists, localNotWantedList, setLocalNotWantedList, isMirror, mirrorKey, editMode, ownershipData, toggleReciprocalUpdates}) => {
    const displayedWantedList = Object.keys(lists.wanted)
        .filter(key => (editMode || !localNotWantedList[key]) && (!isMirror || (isMirror && key === mirrorKey)))
        .reduce((obj, key) => {
            obj[key] = lists.wanted[key];
            return obj;
        }, {});

    const handleNotWantedToggle = (key) => {
        if (editMode) {
            const updatedNotWanted = !(localNotWantedList[key] || false);
            setLocalNotWantedList({...localNotWantedList, [key]: updatedNotWanted});
            toggleReciprocalUpdates(key, updatedNotWanted);
        }
    };
    
    return (
        <div className="wanted-list-container">
            {Object.entries(displayedWantedList).map(([key, details]) => {
                const isNotWanted = localNotWantedList[key];
                const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
                return (
                    <div key={key} className="wanted-item" style={{ position: 'relative', overflow: 'hidden' }}>
                        {details.pref_lucky && (
                            <img 
                                src={`${process.env.PUBLIC_URL}/images/lucky.png`} 
                                className="lucky-backdrop" 
                                alt="Lucky backdrop" 
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '75%',
                                    height: 'auto',
                                    transform: 'translate(-50%, -50%)',
                                    zIndex: 1 // Ensure the backdrop is behind the image
                                }}
                            />
                        )}
                        <img 
                            src={details.currentImage || pokemon.currentImage} 
                            className={imageClasses} 
                            alt={`Wanted Pokémon ${key}`} 
                            style={{ zIndex: 2 }} // Ensure the image is in front of the backdrop
                        />
                        {editMode && (
                            <button className="toggle-not-wanted" onClick={() => handleNotWantedToggle(key)} style={{ zIndex: 3 }}>
                                {isNotWanted ? '✓' : 'X'}
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default WantedListDisplay;