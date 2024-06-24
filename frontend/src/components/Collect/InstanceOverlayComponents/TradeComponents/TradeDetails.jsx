// TradeDetails.jsx
import React, { useState, useContext, useEffect } from 'react';
import './TradeDetails.css';
import EditSaveComponent from '../EditSaveComponent';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';

import MirrorManager from './MirrorManager';
import WantedListDisplay from './WantedListDisplay';

const TradeDetails = ({ pokemon, lists, ownershipData }) => {
    const { mirror, not_wanted_list } = pokemon.ownershipStatus;
    const [editMode, setEditMode] = useState(false);
    const [isMirror, setIsMirror] = useState(mirror);
    const [displayedWantedList, setDisplayedWantedList] = useState(lists.wanted);
    const [localNotWantedList, setLocalNotWantedList] = useState({ ...not_wanted_list });
    const { updateDetails } = useContext(PokemonDataContext);

    const toggleEditMode = () => {
        if (editMode) {
            console.log("Saving changes...");
            updateDetails(pokemon.pokemonKey, { 
                mirror: isMirror,
                not_wanted_list: localNotWantedList
            });
            Object.assign(not_wanted_list, localNotWantedList);
        } else {
            setLocalNotWantedList({ ...not_wanted_list });
        }
        setEditMode(!editMode);
    };

    useEffect(() => {
        const cleanNotWantedList = () => {
            Object.keys(localNotWantedList).forEach(key => {
                if (!(key in lists.wanted)) {
                    delete localNotWantedList[key];
                }
            });
        };
        cleanNotWantedList();
        setDisplayedWantedList(lists.wanted);
    }, []);    

    useEffect(() => {
        if (!isMirror) {
            setDisplayedWantedList(lists.wanted);
        }
    }, [isMirror, lists.wanted]);

    useEffect(() => {
        if (!editMode) {
            const filteredList = Object.keys(lists.wanted)
                .filter(key => !(key in not_wanted_list))
                .reduce((res, key) => (res[key] = lists.wanted[key], res), {});
            setDisplayedWantedList(filteredList);
        } else {
            setDisplayedWantedList(lists.wanted);
        }
    }, [editMode, lists.wanted, not_wanted_list]);

    const toggleMirror = () => {
        if (editMode) {
            setIsMirror(!isMirror);
        }
    };

    const toggleNotWanted = (key) => {
        const updatedList = { ...localNotWantedList };
        if (key in updatedList) {
            delete updatedList[key];
        } else {
            updatedList[key] = true;
        }
        setLocalNotWantedList(updatedList);
        if (!editMode) {
            const filteredList = Object.keys(lists.wanted)
                .filter(k => !(k in updatedList))
                .reduce((res, k) => (res[k] = lists.wanted[k], res), {});
            setDisplayedWantedList(filteredList);
        }
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
                <WantedListDisplay
                    displayedWantedList={displayedWantedList}
                    toggleNotWanted={toggleNotWanted}
                    editMode={editMode}
                    localNotWantedList={localNotWantedList}
                    setLocalNotWantedList={setLocalNotWantedList}
                />
            </div>
            <MirrorManager
                pokemon={pokemon}
                ownershipData={ownershipData}
                isMirror={isMirror}
                setDisplayedWantedList={setDisplayedWantedList}
            />
        </div>
    );
};

export default TradeDetails;
