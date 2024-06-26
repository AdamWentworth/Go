// WantedListDisplay.jsx

import React from 'react';
import { updateNotTradeList } from '../ReciprocalUpdate.jsx'; // Make sure the import path matches the file location

const WantedListDisplay = ({ pokemon, lists, localNotWantedList, setLocalNotWantedList, isMirror, mirrorKey, editMode, ownershipData }) => {
    const displayedWantedList = Object.keys(lists.wanted)
        .filter(key => (editMode || !localNotWantedList[key]) && (!isMirror || (isMirror && key === mirrorKey)))
        .reduce((obj, key) => {
            obj[key] = lists.wanted[key];
            return obj;
        }, {});

    const toggleNotWanted = (key) => {
        const updatedNotWanted = !localNotWantedList[key];
        // console.log(`Toggle not wanted: ${key} from ${localNotWantedList[key]} to ${updatedNotWanted}`);
        setLocalNotWantedList({...localNotWantedList, [key]: updatedNotWanted});
        // console.log(`Local not wanted list updated:`, localNotWantedList);
    
        // Call to update reciprocal list, passing ownershipData
        updateNotTradeList(ownershipData, pokemon.pokemonKey, key, updatedNotWanted);
    };
    
    return (
        <div className="wanted-list-container">
            {Object.entries(displayedWantedList).map(([key, details]) => {
                const isNotWanted = localNotWantedList[key];
                const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
                // console.log(`Rendering ${key}, Not Wanted: ${isNotWanted}`);
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
                            <button className="toggle-not-wanted" onClick={() => toggleNotWanted(key)}>
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
