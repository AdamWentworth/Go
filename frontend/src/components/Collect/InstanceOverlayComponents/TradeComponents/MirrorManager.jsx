// MirrorManager.jsx
import React, { useEffect, useRef } from 'react';
import { createMirrorEntry } from './utils/createMirrorEntry';

const MirrorManager = ({
  pokemon, ownershipData, lists, isMirror, setIsMirror, setMirrorKey, editMode, updateDisplayedList, updateDetails
}) => {
    const initialMount = useRef(true);

    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
            console.log("Initial setup for MirrorManager");
            setIsMirror(pokemon.ownershipStatus.mirror);
            if (pokemon.ownershipStatus.mirror) {
                enableMirror();  // Enable mirror if initially true
            } else {
                disableMirror();  // Disable mirror if initially false
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    useEffect(() => {
        if (!initialMount.current && editMode) {
            console.log("Subsequent update for MirrorManager based on isMirror state change");
            pokemon.ownershipStatus.mirror = isMirror;
            if (isMirror) {
                enableMirror();
            } else {
                disableMirror();
            }
        }
    }, [isMirror]);

    const enableMirror = () => {
        const existingMirrorKey = findExistingMirrorKey();
        if (existingMirrorKey) {
            setMirrorKey(existingMirrorKey);

            // Enrich the existing mirror entry with additional properties
            const enrichedMirrorEntry = {
                ...ownershipData[existingMirrorKey],
                variantType: pokemon.variantType,
                pokedex_number: pokemon.pokedex_number,
                currentImage: pokemon.currentImage,
                name: pokemon.name,
                date_available: pokemon.date_available,
                date_shiny_available: pokemon.date_shiny_available,
                date_shadow_available: pokemon.date_shadow_available,
                date_shiny_shadow_available: pokemon.date_shiny_shadow_available,
                costumes: pokemon.costumes,
            };

            updateDisplayedList({ [existingMirrorKey]: enrichedMirrorEntry });
        } else {
            const newMirrorKey = createMirrorEntry(pokemon, ownershipData, lists, updateDetails);
            setMirrorKey(newMirrorKey);

            const enrichedMirrorEntry = {
                ...ownershipData[newMirrorKey],
                variantType: pokemon.variantType,
                pokedex_number: pokemon.pokedex_number,
                currentImage: pokemon.currentImage,
                name: pokemon.name,
                date_available: pokemon.date_available,
                date_shiny_available: pokemon.date_shiny_available,
                date_shadow_available: pokemon.date_shadow_available,
                date_shiny_shadow_available: pokemon.date_shiny_shadow_available,
                costumes: pokemon.costumes,
            };

            updateDisplayedList({ [newMirrorKey]: enrichedMirrorEntry });
        }
    };

    const disableMirror = () => {
        setMirrorKey(null);
        updateDisplayedList({});
    };

    const toggleMirror = () => {
        setIsMirror(prevIsMirror => !prevIsMirror);
    };

    const findExistingMirrorKey = () => {
        const basePrefix = pokemon.pokemonKey.split('_').slice(0, -1).join('_');
        const foundKey = Object.keys(ownershipData).find(key =>
            key.startsWith(basePrefix) &&
            ownershipData[key].is_wanted &&
            !ownershipData[key].is_owned &&
            !ownershipData[key].is_for_trade &&
            ownershipData[key].pokemon_id === pokemon.pokemon_id &&
            ownershipData[key].mirror
        );
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