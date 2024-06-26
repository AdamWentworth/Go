// WantedDetails.jsx
import React, { useState, useContext } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import FriendshipManager from './FriendshipManager';
import TradeListDisplay from './TradeListDisplay';

const WantedDetails = ({ pokemon, lists, ownershipData }) => {
    const { pref_lucky } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotTradeList, setLocalNotTradeList] = useState({ ...pokemon.ownershipStatus.not_trade_list });
    const [isLucky, setIsLucky] = useState(pref_lucky);
    const [friendship, setFriendship] = useState(pokemon.ownershipStatus.friendship_level || 0);
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        setEditMode(!editMode);
        if (!editMode) { // If we're entering edit mode, do nothing else
            return;
        }
        // Save changes when exiting edit mode
        console.log("Saving changes...");
        updateDetails(pokemon.pokemonKey, {
            pref_lucky: isLucky,
            friendship_level: friendship,
            not_trade_list: localNotTradeList
        });
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

    return (
        <div className="wanted-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
            </div>
            <h2>Wanted Trade Details</h2>
            <div className="icon-row">
                <FriendshipManager friendship={friendship} setFriendship={setFriendship} editMode={editMode} />
                <img 
                    src={process.env.PUBLIC_URL + '/images/lucky_friend_icon.png'} 
                    alt="Lucky Friend" 
                    className={isLucky ? '' : 'grey-out'}
                    onClick={toggleLucky}
                    style={{ cursor: editMode ? 'pointer' : 'default' }}
                />
            </div>
            <TradeListDisplay
                pokemon={pokemon}
                lists={lists} 
                localNotTradeList={localNotTradeList} 
                setLocalNotTradeList={setLocalNotTradeList} 
                editMode={editMode}
                ownershipData={ownershipData}
            />
        </div>
    );
};

export default WantedDetails;