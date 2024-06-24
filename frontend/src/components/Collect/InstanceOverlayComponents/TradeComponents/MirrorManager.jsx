//MirrorManager.jsx

import React, { useEffect } from 'react';
import { generateUUID } from '../../utils/PokemonIDUtils';

const MirrorManager = ({ pokemon, ownershipData, isMirror, setDisplayedWantedList }) => {
    useEffect(() => {
        if (!isMirror) return;

        const initializeMirror = () => {
            const originalData = ownershipData[pokemon.pokemonKey];
            let basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
            let existingMirrorKey = Object.keys(ownershipData).find(key => {
                const targetData = ownershipData[key];
                return key.startsWith(basePrefix) &&
                       targetData.is_wanted &&
                       !targetData.is_owned &&
                       !targetData.is_for_trade &&
                       targetData.pokemon_id === originalData.pokemon_id;
            });

            if (existingMirrorKey) {
                setDisplayedWantedList({ [existingMirrorKey]: ownershipData[existingMirrorKey] });
            } else {
                const newKey = `${basePrefix}_${generateUUID()}`;
                const newData = {
                    ...originalData,
                    is_wanted: true,
                    is_owned: false,
                    is_for_trade: false,
                    is_unowned: false,
                    mirror: true
                };
                ownershipData[newKey] = newData;
                setDisplayedWantedList({ [newKey]: newData });
            }
        };

        initializeMirror(); // Correctly defining and calling within the useEffect
    }, [isMirror, pokemon, ownershipData, setDisplayedWantedList]);

    return null; // This component does not render UI
};

export default MirrorManager;



