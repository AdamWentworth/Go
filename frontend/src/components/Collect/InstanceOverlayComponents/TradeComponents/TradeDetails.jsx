// TradeDetails.jsx
import React, { useState, useCallback, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import { generateUUID } from '../../utils/PokemonIDUtils';

import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';

const TradeDetails = ({ pokemon, lists, ownershipData }) => {
    const { not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror); // Initialize from pokemon status
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);

    useEffect(() => {
        // Synchronize isMirror with external mirror status after component mount
        setIsMirror(pokemon.ownershipStatus.mirror);
    }, [pokemon.ownershipStatus.mirror]);

    const updateDisplayedList = useCallback((newData) => {
        setListsState(prevLists => ({
            ...prevLists,
            wanted: newData ? { ...prevLists.wanted, ...newData } : revertWantedList(prevLists)
        }));
    }, [listsState]);

    const revertWantedList = (prevLists) => {
        return Object.keys(prevLists.wanted).reduce((acc, key) => {
            if (!localNotWantedList[key]) {
                acc[key] = prevLists.wanted[key];
            }
            return acc;
        }, {});
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
        if (!editMode) {
            updateDetails(pokemon.pokemonKey, {
                not_wanted_list: localNotWantedList,
                mirror: isMirror
            });
            if (isMirror && mirrorKey === 'placeholder') {
                const newMirrorKey = createNewMirrorEntry(pokemon);
                setMirrorKey(newMirrorKey);
                updateDisplayedList({ [newMirrorKey]: ownershipData[newMirrorKey] });
            }
        }
    };

    const createNewMirrorEntry = (pokemon) => {
        const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
        const newKey = `${basePrefix}_${generateUUID()}`;
        const newData = {
            ...pokemon,
            is_wanted: true,
            is_owned: false,
            is_for_trade: false,
            is_unowned: false,
            mirror: true,
            currentImage: pokemon.currentImage
        };
        ownershipData[newKey] = newData;
        lists.wanted[newKey] = newData;
        updateDetails(newKey, newData);
        return newKey;
    };

    return (
        <div className="trade-details-container">
            <div className="top-row">
                <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                <MirrorManager
                    pokemon={pokemon}
                    ownershipData={ownershipData}
                    isMirror={isMirror}
                    setIsMirror={setIsMirror}
                    setMirrorKey={setMirrorKey}
                    editMode={editMode}
                    updateDisplayedList={updateDisplayedList}
                    updateDetails={updateDetails}
                />
            </div>
            <div>
                <h2>Wanted List:</h2>
                <WantedListDisplay
                    lists={listsState}
                    localNotWantedList={localNotWantedList}
                    isMirror={isMirror}
                    mirrorKey={mirrorKey}
                    setLocalNotWantedList={setLocalNotWantedList}
                    editMode={editMode}
                />
            </div>
        </div>
    );
};

export default TradeDetails;