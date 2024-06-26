// MirrorManager.jsx
import React, { useEffect, useRef } from 'react';

const MirrorManager = ({
  pokemon, ownershipData, isMirror, setIsMirror, setMirrorKey, editMode, updateDisplayedList, updateDetails
}) => {
    const initialMount = useRef(true);

    // Initial setup only on component mount
    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
            console.log("Initial setup for MirrorManager");
            // Initialize isMirror based on ownershipStatus from props
            setIsMirror(pokemon.ownershipStatus.mirror);
            if (pokemon.ownershipStatus.mirror) {
                enableMirror();  // Directly enable mirror if initially true
            } else {
                disableMirror();  // Ensure mirror is disabled if initially false
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Subsequent updates based on state changes
    useEffect(() => {
        if (!initialMount.current && editMode) {  // Ensure this does not run on initial mount
            console.log("Subsequent update for MirrorManager based on isMirror state change");
            // Update the external ownership status to reflect the state of isMirror
            pokemon.ownershipStatus.mirror = isMirror;
            if (isMirror) {
                enableMirror();
            } else {
                disableMirror();
            }
        }
    }, [isMirror]); // React only to changes in isMirror

    const enableMirror = () => {
        const existingMirrorKey = findExistingMirrorKey();
        console.log("Existing mirror key found:", existingMirrorKey);
        if (existingMirrorKey) {
            setMirrorKey(existingMirrorKey);
            updateDisplayedList({ [existingMirrorKey]: ownershipData[existingMirrorKey] });
            console.log("Mirror enabled with existing key");
        } else {
            console.log("No existing mirror key, setting new mirror");
            const placeholderData = {
                ...pokemon,
                currentImage: pokemon.currentImage,
                mirror: true
            };
            setMirrorKey('placeholder');
            updateDisplayedList({ 'placeholder': placeholderData });
        }
        updateDetails(pokemon.pokemonKey, { mirror: true });
    };

    const disableMirror = () => {
        console.log("Disabling mirror functionality");
        setMirrorKey(null);
        updateDisplayedList({});
        updateDetails(pokemon.pokemonKey, { mirror: false });
    };

    const toggleMirror = () => {
        if (!editMode) {
            console.log("Attempt to toggle mirror in view mode, action blocked");
            return;
        }
        const shouldEnableMirror = !isMirror;
        console.log("Toggling mirror from", isMirror, "to", shouldEnableMirror);
        setIsMirror(shouldEnableMirror); // This change will trigger the second useEffect
    };

    const findExistingMirrorKey = () => {
        const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
        const foundKey = Object.keys(ownershipData).find(key => key.startsWith(basePrefix) &&
            ownershipData[key].is_wanted &&
            !ownershipData[key].is_owned &&
            !ownershipData[key].is_for_trade &&
            ownershipData[key].pokemon_id === pokemon.pokemon_id &&
            ownershipData[key].mirror);
        console.log("findExistingMirrorKey:", foundKey || "No key found");
        return foundKey;
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