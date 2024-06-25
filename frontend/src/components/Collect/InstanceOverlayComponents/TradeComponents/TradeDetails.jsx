// TradeDetails.jsx
import React, { useState, useCallback, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import { generateUUID } from '../../utils/PokemonIDUtils';

import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';

const TradeDetails = ({ pokemon, lists, ownershipData }) => {
    const { not_wanted_list, mirror } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(false);
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);

    // Function to update the displayed list based on the mirror status
    const updateDisplayedList = useCallback((newData) => {
        setListsState(prevLists => {
            console.log("Updating displayed list with new data:", newData);
            return {
                ...prevLists,
                wanted: newData ? { ...prevLists.wanted, ...newData } : revertWantedList(prevLists)
            };
        });
    }, []);

    const revertWantedList = (prevLists) => {
        console.log("Reverting wanted list based on not wanted list:", localNotWantedList);
        return Object.keys(prevLists.wanted).reduce((acc, key) => {
            if (!localNotWantedList[key]) {
                acc[key] = prevLists.wanted[key];
            }
            return acc;
        }, {});
    };

    const toggleEditMode = () => {
        console.log("Toggling edit mode from", editMode, "to", !editMode);
        setEditMode(!editMode);
        if (editMode) {
            console.log("Exiting edit mode. Current state:", {
                localNotWantedList,
                isMirror,
                mirrorKey
            });
            // Persist not wanted list and mirror state
            updateDetails(pokemon.pokemonKey, {
                not_wanted_list: localNotWantedList,
                mirror: isMirror
            });

            // Create a new mirror entry if necessary
            if (isMirror && mirrorKey === 'placeholder') {
                console.log("Creating new mirror entry as none exists yet.");
                const newMirrorKey = createNewMirrorEntry(pokemon);
                setMirrorKey(newMirrorKey);
                updateDisplayedList({ [newMirrorKey]: ownershipData[newMirrorKey] });
            } else {
                console.log("Mirror key was not placeholder or mirror is not enabled. No new mirror entry created.");
                Object.assign(not_wanted_list, localNotWantedList);
            }
        }
    };

    const createNewMirrorEntry = (pokemon) => {
        console.log("Generating new mirror entry for pokemon:", pokemon);
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
        lists.wanted[newKey] = newData
        updateDetails(pokemon.pokemonKey, {
            newData
        });
        console.log("New mirror entry created:", newKey, newData);
        return newKey;
    };

    useEffect(() => {
        // Sync local state with context or props if necessary
        console.log("Syncing local lists state with external lists prop", lists);
        setListsState(lists);
    }, [lists]);

    useEffect(() => {
        console.log("Edit mode changed. Setting local not wanted list to:", not_wanted_list);
        if (!editMode) {
            setLocalNotWantedList({ ...not_wanted_list });
        }
    }, [editMode, not_wanted_list]);

    useEffect(() => {
        console.log("Pokemon ownership status mirror changed. Setting local isMirror to:", pokemon.ownershipStatus.mirror);
        setIsMirror(pokemon.ownershipStatus.mirror);
    }, [pokemon.ownershipStatus.mirror]);

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