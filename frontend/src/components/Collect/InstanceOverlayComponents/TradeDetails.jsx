// TradeDetails.jsx
import React, { useState, useContext } from 'react';
import './TradeDetails.css';
import EditSaveComponent from './EditSaveComponent';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';

const TradeDetails = ({ pokemon, lists }) => {
    const { friendship_level, pref_lucky, mirror, not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [isLucky, setIsLucky] = useState(pref_lucky);
    const [isMirror, setIsMirror] = useState(mirror);
    const [friendship, setFriendship] = useState(friendship_level);
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        if (editMode) {
            console.log("Saving changes...");
            updateDetails(pokemon.pokemonKey, { pref_lucky: isLucky, mirror: isMirror, friendship_level: friendship });
        }
        setEditMode(!editMode);
    };

    const toggleLucky = () => {
        setIsLucky(!isLucky);
        if (!isLucky) {  // If becoming lucky
            setFriendship(4); // Automatically set to max friendship if lucky is toggled on
        }
    };

    const toggleMirror = () => {
        setIsMirror(!isMirror);
    };

    const renderWantedListDetails = () => {
        if (!lists || Object.keys(lists.wanted).length === 0) {
            return <div>No Pokémon currently wanted.</div>;
        }

        return (
            <div className="wanted-list-container">
                {Object.entries(lists.wanted).map(([key, details]) => (
                    <div key={key} className="wanted-item">
                        <img src={details.currentImage} alt={`Wanted Pokémon ${key}`} />
                    </div>
                ))}
            </div>
        );
    }; 

    const handleFriendshipChange = (e) => {
        const newFriendshipLevel = parseInt(e.target.value, 10);
        setFriendship(newFriendshipLevel);
        // Automatically disable 'Lucky' if friendship level is less than maximum
        if (newFriendshipLevel < 4) {
            setIsLucky(false);
        }
    };

    const renderFriendshipLevel = () => {
        const hearts = [];
        for (let i = 0; i < 4; i++) {
            hearts.push(
                <img 
                    key={i}
                    src={`${process.env.PUBLIC_URL}/images/${i < friendship ? 'heart-filled' : 'heart-unfilled'}.png`}
                    alt={`Friendship Level ${i < friendship ? 'Filled' : 'Unfilled'}`}
                    className="heart"
                />
            );
        }

        return (
            <div className="friendship-level-container">
                <div className="hearts">{hearts}</div>
                {editMode && (
                    <input
                        type="range"
                        min="0"
                        max="4"
                        value={friendship}
                        onChange={handleFriendshipChange}
                        className="friendship-slider"
                    />
                )}
            </div>
        );
    };

    return (
        <div className="trade-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                <div className="mirror">
                    <img 
                        src={process.env.PUBLIC_URL + '/images/mirror.png'} 
                        alt="Mirror" 
                        className={isMirror ? '' : 'grey-out'} 
                        onClick={toggleMirror}
                        style={{ cursor: editMode ? 'pointer' : 'default' }}
                    />
                </div>
            </div>         
            <div>
                <h2>Wanted List:</h2>
                {renderWantedListDetails()}
            </div>
        </div>
    );
};

export default TradeDetails;