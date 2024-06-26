// WantedListDisplay.jsx
import React from 'react';

const WantedListDisplay = ({ pokemon, lists, localNotWantedList, setLocalNotWantedList, isMirror, mirrorKey, editMode }) => {
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
                const hasLucky = details.pref_lucky; // Assuming `pref_lucky` is a boolean
                return (
                    <div key={key} className="wanted-item" style={{ position: 'relative', overflow: 'hidden' }}>
                        {hasLucky && (
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
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        )}
                        <img 
                            src={details.currentImage || pokemon.currentImage} 
                            className={imageClasses} 
                            alt={`Wanted Pokémon ${key}`} 
                        />
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
