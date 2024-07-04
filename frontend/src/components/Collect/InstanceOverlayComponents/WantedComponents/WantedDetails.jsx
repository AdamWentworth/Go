// WantedDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './WantedDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import TradeListDisplay from './TradeListDisplay';
import { updateNotWantedList } from '../ReciprocalUpdate.jsx';

const WantedDetails = ({ pokemon, lists, ownershipData }) => {
    const [editMode, setEditMode] = useState(false);
    const [localNotTradeList, setLocalNotTradeList] = useState({ ...pokemon.ownershipStatus.not_trade_list });
    const [pendingUpdates, setPendingUpdates] = useState({});
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        if (editMode) {
            // Commit changes when toggling edit mode off
            Object.keys(pendingUpdates).forEach(key => {
                updateNotWantedList(ownershipData, pokemon.pokemonKey, key, pendingUpdates[key]);
            });
            setPendingUpdates({});
            updateDetails(pokemon.pokemonKey, {
                not_trade_list: localNotTradeList
            });
        }
        setEditMode(!editMode);
    };

    const toggleReciprocalUpdates = (key, updatedNotTrade) => {
        setPendingUpdates(prev => ({ ...prev, [key]: updatedNotTrade }));
    };

    return (
        <div className="wanted-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
            </div>
            <h2>For Trade List:</h2>
            <TradeListDisplay
                pokemon={pokemon}
                lists={lists}
                localNotTradeList={localNotTradeList}
                setLocalNotTradeList={setLocalNotTradeList}
                editMode={editMode}
                toggleReciprocalUpdates={toggleReciprocalUpdates}
                ownershipData={ownershipData}
            />
        </div>
    );
};

export default WantedDetails;