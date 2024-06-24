// WantedTradeDetails.jsx
import React, { useState, useContext } from 'react';
import './WantedTradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';

const WantedTradeDetails = ({ pokemon, lists }) => {
    const { friendship_level, pref_lucky, not_trade_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [isLucky, setIsLucky] = useState(pref_lucky);
    const [friendship, setFriendship] = useState(friendship_level);
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        if (editMode) {
            console.log("Saving changes...");
            updateDetails(pokemon.pokemonKey, { pref_lucky: isLucky, friendship_level: friendship });
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

    // const toggleMirror = () => {
    //     if (editMode) {
    //         setIsMirror(!isMirror);
    //     }
    // };

    const renderTradeListDetails = () => {
        if (!lists || Object.keys(lists.trade).length === 0) {
            return <div>No Pokémon currently for trade.</div>;
        }

        return (
            <div className="trade-list-container">
                {Object.entries(lists.trade).map(([key, details]) => (
                    <div key={key} className="trade-item">
                        <img 
                            src={details.currentImage} // Use the image URL from the details object
                            alt={`Trade Pokémon ${key}`} // Provide a meaningful alternative text
                        />
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
                    key={`heart-${i}`}  // Use loop index as key
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
        <div className="wanted-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
            </div>
            <h2>Wanted Trade Details</h2>
            <div className="icon-row">
                {renderFriendshipLevel()}
                <img 
                    src={process.env.PUBLIC_URL + '/images/lucky_friend_icon.png'} 
                    alt="Lucky Friend" 
                    className={isLucky ? '' : 'grey-out'}
                    onClick={toggleLucky}
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                />
            </div>
            <div><strong>For Trade:</strong> {renderTradeListDetails()}</div>
        </div>
    );
};

export default WantedTradeDetails;