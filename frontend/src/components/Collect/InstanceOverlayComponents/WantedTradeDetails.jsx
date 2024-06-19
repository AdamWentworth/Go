// WantedTradeDetails.jsx
import React, { useState, useContext } from 'react';
import './WantedTradeDetails.css';
import EditSaveComponent from './EditSaveComponent';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';

const WantedTradeDetails = ({ pokemon }) => {
    const { friendship_level, pref_lucky, mirror, trade_list } = pokemon.ownershipStatus;
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
        if (editMode) {
            const newLuckyStatus = !isLucky;
            setIsLucky(newLuckyStatus);
            if (newLuckyStatus) {
                setFriendship(4); // Automatically set to max friendship if lucky is toggled on
            }
        }
    };

    const toggleMirror = () => {
        if (editMode) {
            setIsMirror(!isMirror);
        }
    };

    const renderTradeListDetails = () => {
        const keys = Object.keys(trade_list);
        if (keys.length === 0) {
            return "No trades listed.";
        }
        return keys.map(key => (
            <div key={key}>{key}: {trade_list[key]}</div>
        ));
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
                    src={`${process.env.PUBLIC_URL}/images/${i < friendship ? 'heart-filled' : 'heart-unfilled'}.png`}
                    alt={`Friendship Level ${i < friendship ? 'Filled' : 'Unfilled'}`}
                    className="heart"
                />
            );
        }

        return (
            <div className="friendship-level-container">
                <div className="hearts">
                    {hearts}
                </div>
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
            </div>
            <h2>Trade Details</h2>
            <div className="icon-row">
                <img 
                    src={process.env.PUBLIC_URL + '/images/mirror.png'} 
                    alt="Mirror" 
                    className={isMirror ? '' : 'grey-out'} 
                    onClick={toggleMirror}
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                />
                <img 
                    src={process.env.PUBLIC_URL + '/images/lucky_friend_icon.png'} 
                    alt="Lucky Friend" 
                    className={isLucky ? '' : 'grey-out'}
                    onClick={toggleLucky}
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                />
            </div>
            {renderFriendshipLevel()}
            <div><strong>Trade List:</strong> {renderTradeListDetails()}</div>
        </div>
    );
};

export default WantedTradeDetails;