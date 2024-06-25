// MirrorManager.jsx
import React, { useEffect } from 'react';

const MirrorManager = ({
  pokemon, ownershipData, isMirror, setIsMirror, setMirrorKey, editMode, updateDisplayedList, updateDetails
}) => {
    // Effect for initial mirror status check and setup
    useEffect(() => {
        if (!editMode && pokemon.ownershipStatus.mirror) {
            const existingMirrorKey = findExistingMirrorKey();
            if (existingMirrorKey) {
                setMirrorKey(existingMirrorKey);
                setIsMirror(true);
                updateDisplayedList({ [existingMirrorKey]: ownershipData[existingMirrorKey] });
            } else {
                setIsMirror(false);
                setMirrorKey(null);
                updateDisplayedList({});
                updateDetails(pokemon.pokemonKey, {
                    mirror: false
                }); // Update mirror status in context or state management.
            }
        }
    }, [pokemon, ownershipData, setIsMirror, setMirrorKey, updateDisplayedList, editMode, updateDetails]);    

    // Toggling mirror functionality
    const toggleMirror = () => {
        if (!editMode) return; // Only allow toggling in edit mode
        const shouldEnableMirror = !isMirror;
        setIsMirror(shouldEnableMirror);
    
        if (shouldEnableMirror) {
            // If enabling mirror, find existing or use placeholder
            const existingMirrorKey = findExistingMirrorKey();
            if (existingMirrorKey) {
                setMirrorKey(existingMirrorKey);
                updateDisplayedList({ [existingMirrorKey]: ownershipData[existingMirrorKey] });
            } else {
                const placeholderData = {
                    ...pokemon,
                    currentImage: pokemon.currentImage,
                    mirror: true
                };
                setMirrorKey('placeholder');
                updateDisplayedList({ 'placeholder': placeholderData });
            }
        } else {
            // If disabling mirror, clear the display list
            setMirrorKey(null);
            updateDisplayedList({});
        }
    };    

    // Find an existing mirror entry
    const findExistingMirrorKey = () => {
        const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
        return Object.keys(ownershipData).find(key => key.startsWith(basePrefix) &&
            ownershipData[key].is_wanted &&
            !ownershipData[key].is_owned &&
            !ownershipData[key].is_for_trade &&
            ownershipData[key].pokemon_id === pokemon.pokemon_id &&
            ownershipData[key].mirror);
    };

    return (
        <div className="mirror">
            <img
                src={process.env.PUBLIC_URL + '/images/mirror.png'}
                alt="Mirror"
                className={isMirror ? '' : 'grey-out'}
                onClick={toggleMirror}
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
};

export default MirrorManager;
