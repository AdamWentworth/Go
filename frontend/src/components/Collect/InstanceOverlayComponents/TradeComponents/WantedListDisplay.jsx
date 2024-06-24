// WantedListDisplay.jsx
import React from 'react';
import NotWantedListManager from './NotWantedListManager';

const WantedListDisplay = ({
    lists,
    localNotWantedList,
    setLocalNotWantedList,
    editMode
}) => {
    const toggleNotWanted = (key) => {
        const updatedList = { ...localNotWantedList };
        if (key in updatedList) {
            delete updatedList[key];
        } else {
            updatedList[key] = true;
        }
        setLocalNotWantedList(updatedList);
    };

    const displayedWantedList = Object.keys(lists.wanted)
        .filter(key => editMode || !(key in localNotWantedList))
        .reduce((res, key) => (res[key] = lists.wanted[key], res), {});

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
                                toggleNotWanted={toggleNotWanted}
                                isNotWanted={isNotWanted}
                            />
                        )}
                        <img 
                            src={details.currentImage || details.fallbackImage} 
                            className={imageClasses} 
                            alt={`Wanted Pokémon ${key}`}
                            onError={(e) => {
                                console.error(`Failed to load image at URL: ${e.target.src}`);
                                e.target.src = '/images/fallback.png'; // Ensure you have a fallback image
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default WantedListDisplay;

