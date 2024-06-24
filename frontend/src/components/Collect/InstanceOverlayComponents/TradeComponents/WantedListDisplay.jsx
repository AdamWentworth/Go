// WantedListDisplay.jsx
import React from 'react';
import NotWantedListManager from './NotWantedListManager';

const WantedListDisplay = ({ 
    displayedWantedList, 
    toggleNotWanted, 
    editMode, 
    localNotWantedList, 
    setLocalNotWantedList 
}) => {
    return (
        <div className="wanted-list-container">
            {Object.entries(displayedWantedList).map(([key, details]) => {
                const isNotWanted = localNotWantedList[key];
                const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;

                return (
                    <div key={key} className="wanted-item">
                        {editMode && (
                            <NotWantedListManager
                                pokemonKey={key}
                                localNotWantedList={localNotWantedList}
                                setLocalNotWantedList={setLocalNotWantedList}
                                toggleNotWanted={toggleNotWanted}
                            />
                        )}
                        <img src={details.currentImage || details.fallbackImage} className={imageClasses} alt={`Wanted Pokémon ${key}`} />
                    </div>
                );
            })}
        </div>
    );
};

export default WantedListDisplay;

