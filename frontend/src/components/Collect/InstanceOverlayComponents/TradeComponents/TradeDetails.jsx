// TradeDetails.jsx
import React, { useState, useCallback, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import { generateUUID } from '../../utils/PokemonIDUtils';
import WantedListDisplay from './WantedListDisplay';
import MirrorManager from './MirrorManager';
import { updateNotTradeList } from '../ReciprocalUpdate.jsx';

const TradeDetails = ({ pokemon, lists, ownershipData, sortType, sortMode }) => {
    const { not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);
    const [isMirror, setIsMirror] = useState(pokemon.ownershipStatus.mirror); // Initialize from pokemon status
    const [mirrorKey, setMirrorKey] = useState(null);
    const [listsState, setListsState] = useState(lists);
    const [pendingUpdates, setPendingUpdates] = useState({});

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
        if (editMode) {
            Object.keys(pendingUpdates).forEach(key => {
                if (localNotWantedList[key] !== not_wanted_list[key]) { // Only update if changed
                    updateNotTradeList(ownershipData, pokemon.pokemonKey, key, localNotWantedList[key], isMirror);
                }
            });
            setPendingUpdates({});
            updateDetails(pokemon.pokemonKey, {
                not_wanted_list: localNotWantedList,
                mirror: isMirror
            });

            if (isMirror && mirrorKey === 'placeholder') {
                const newMirrorKey = createNewMirrorEntry(pokemon);
                setMirrorKey(newMirrorKey);
                updateDisplayedList({ [newMirrorKey]: ownershipData[newMirrorKey] });
            } else if (!isMirror && mirrorKey) {
                // Remove the mirror entry if the mirror is set to false
                delete ownershipData[mirrorKey];
                delete lists.wanted[mirrorKey];
                updateDisplayedList(null); // Update the displayed list to remove the mirror entry
                setMirrorKey(null);
            }
        } else {
            // When toggling edit mode off, if mirror is being disabled, update the original trade instance as well
            if (!isMirror && pokemon.ownershipStatus.mirror) {
                updateDetails(pokemon.pokemonKey, {
                    ...pokemon.ownershipStatus,
                    mirror: false
                });
            }
        }
        setEditMode(!editMode);
    };

    const toggleReciprocalUpdates = (key, updatedNotTrade) => {
        setPendingUpdates(prev => ({ ...prev, [key]: updatedNotTrade }));
    };

    const createNewMirrorEntry = (pokemon) => {
        const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
        const newKey = `${basePrefix}_${generateUUID()}`;
        const newData = {
            ...pokemon.ownershipStatus,
            is_wanted: true,
            is_owned: false,
            is_for_trade: false,
            is_unowned: false,
            mirror: true,
            pref_lucky: false,
            friendship_level: null,
            date_added: new Date().toISOString(),
        };
        ownershipData[newKey] = newData;
        lists.wanted[newKey] = newData;
        updateDetails(newKey, newData);

        // Update the original trade instance to set its mirror value to true
        updateDetails(pokemon.pokemonKey, {
            ...pokemon.ownershipStatus,
            mirror: true
        });

        return newKey;
    };

    return (
        <div className="trade-details-container">
            <div className="top-row">
                <div className="edit-save-container">
                    <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
                </div>
                {!isMirror && (
                    <>
                        <div className="header-group">
                            <h3>Exclude</h3>
                        </div>
                        <div className="header-group">
                            <h3>Include Only</h3>
                        </div>
                    </>
                )}
                <div className="mirror">
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
            </div>

            {!isMirror && (
                <div className="image-row-container">
                    <div className="exclude-header-group image-group">
                        <div className="image-row">
                            <img src="/images/community_day.png" alt="Community Day" />
                            <img src="/images/field_research.png" alt="Research" />
                            <img src="/images/raid_day.png" alt="Raid Day" />
                            <img src="/images/legendary_raid.png" alt="Legendary Raid" />
                            <img src="/images/mega_raid.png" alt="Mega Raid" />
                            <img src="/images/permaboosted.png" alt="Permaboosted" />
                        </div>
                    </div>
                    <div className="include-only-header-group image-group">
                        <div className="image-row">
                            <img src="/images/shiny_icon.png" alt="Shiny Icon" />
                            <img src="/images/costume_icon.png" alt="Costume Icon" />
                            <img src="/images/legendary.png" alt="Legendary" />
                            <img src="/images/regional.png" alt="Regional" />
                            <img src="/images/location.png" alt="Location" />
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2>Wanted List:</h2>
                <WantedListDisplay
                    pokemon={pokemon}
                    lists={listsState}
                    localNotWantedList={localNotWantedList}
                    isMirror={isMirror}
                    mirrorKey={mirrorKey}
                    setLocalNotWantedList={setLocalNotWantedList}
                    editMode={editMode}
                    ownershipData={ownershipData}
                    toggleReciprocalUpdates={toggleReciprocalUpdates}
                    sortType={sortType}
                    sortMode={sortMode}
                />
            </div>
        </div>
    );
};

export default TradeDetails;