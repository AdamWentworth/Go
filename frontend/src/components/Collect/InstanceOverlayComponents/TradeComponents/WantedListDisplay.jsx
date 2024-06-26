// WantedListDisplay.jsx
import React from 'react';

const WantedListDisplay = ({ lists, localNotWantedList, setLocalNotWantedList, isMirror, mirrorKey, editMode }) => {

    const displayedWantedList = Object.keys(lists.wanted)
        .filter(key => (editMode || !localNotWantedList[key]) && (!isMirror || (isMirror && key === mirrorKey)))
        .reduce((obj, key) => {
            obj[key] = lists.wanted[key];
            return obj;
        }, {});
    
    return (
        <div className="wanted-list-container">
            {Object.entries(displayedWantedList).map(([key, details]) => {
                const isNotWanted = localNotWantedList[key];
                const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
                return (
                    <div key={key} className="wanted-item">
                        <img src={details.currentImage || details.fallbackImage} className={imageClasses} alt={`Wanted Pokémon ${key}`} />
                        {editMode && (
                            <button className="toggle-not-wanted" onClick={() => setLocalNotWantedList({...localNotWantedList, [key]: !isNotWanted})}>
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