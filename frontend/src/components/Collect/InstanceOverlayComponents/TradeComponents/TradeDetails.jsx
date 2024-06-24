// TradeDetails.jsx
import React, { useState, useCallback, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';

import WantedListDisplay from './WantedListDisplay';

const TradeDetails = ({ pokemon, lists, ownershipData }) => {
    const { not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        setEditMode(!editMode);
        if (editMode) {
            // Trigger updates only when switching off edit mode
            console.log("Saving changes...");
            updateDetails(pokemon.pokemonKey, {
                not_wanted_list: localNotWantedList
            });
            Object.assign(not_wanted_list, localNotWantedList);
        }
    };

    useEffect(() => {
        // Set local not wanted list to sync with global state when edit mode is turned on
        if (editMode) {
            setLocalNotWantedList({ ...not_wanted_list });
        }
    }, [editMode, not_wanted_list]);

    return (
        <div className="trade-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                <div className="mirror">
                    <img
                        src={process.env.PUBLIC_URL + '/images/mirror.png'}
                        alt="Mirror"
                        // className={isMirror ? '' : 'grey-out'}
                        // onClick={toggleMirror}
                        style={{ cursor: editMode ? 'pointer' : 'default' }}
                    />
                </div>
            </div>
            <div>
                <h2>Wanted List:</h2>
                <WantedListDisplay
                    lists={lists}
                    localNotWantedList={localNotWantedList}
                    setLocalNotWantedList={setLocalNotWantedList}
                    editMode={editMode}
                />
            </div>
        </div>
    );
};

export default TradeDetails;
