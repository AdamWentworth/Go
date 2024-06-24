// MirrorManager.jsx
import React, { useEffect } from 'react';
import { generateUUID } from '../../utils/PokemonIDUtils';

const MirrorManager = ({ pokemon, ownershipData, isMirror, updateDisplayedList }) => {
    useEffect(() => {
        if (!isMirror) return;

        const initializeMirror = () => {
            const originalData = ownershipData[pokemon.pokemonKey];
            const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
            const existingMirrorKey = Object.keys(ownershipData).find(key => {
                const targetData = ownershipData[key];
                return key.startsWith(basePrefix) &&
                       targetData.is_wanted &&
                       !targetData.is_owned &&
                       !targetData.is_for_trade &&
                       targetData.pokemon_id === originalData.pokemon_id &&
                       targetData.mirror; // Ensure we're checking for mirrored entries
            });

            if (!existingMirrorKey) {
                // Create mirror only if it doesn't exist
                const newKey = `${basePrefix}_${generateUUID()}`;
                const newData = {
                    ...originalData,
                    is_wanted: true,
                    is_owned: false,
                    is_for_trade: false,
                    is_unowned: false,
                    mirror: true,
                    currentImage: originalData.currentImage // Assumed correct image path from original data
                };
                ownershipData[newKey] = newData;
                updateDisplayedList({ [newKey]: newData });
            }
        };

        if (isMirror) {
            initializeMirror();
        }
    }, [isMirror, pokemon, ownershipData, updateDisplayedList]);

    return null;
};

export default MirrorManager;



