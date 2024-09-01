// MirrorManager.jsx
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { createMirrorEntry } from '../utils/createMirrorEntry';
import './MirrorManager.css';

const MirrorManager = ({
  pokemon, ownershipData, lists, isMirror, setIsMirror, setMirrorKey, editMode, updateDisplayedList, updateDetails
}) => {
    const initialMount = useRef(true);
    const [hovered, setHovered] = useState(false);
    const tooltipRef = useRef(null);

    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
            setIsMirror(pokemon.ownershipStatus.mirror);
            if (pokemon.ownershipStatus.mirror) {
                enableMirror();
            } else {
                disableMirror();
            }
        }
    }, []);

    useEffect(() => {
        if (!initialMount.current && editMode) {
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
                shiny_rarity: pokemon.shiny_rarity,
                rarity: pokemon.rarity,
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
                shiny_rarity: pokemon.shiny_rarity,
                rarity: pokemon.rarity,
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
            ownershipData[key].pokemon_id === pokemon.pokemon_id
        );
        ownershipData[foundKey].mirror = true
        console.log("findExistingMirrorKey:", foundKey || "No key found");
        return foundKey;
    };

    // Dynamically insert the Pokémon's name into the tooltip text
    const dynamicTooltipText = `Toggle Mirror<br>This will create or reference a "Wanted" Pokemon<br>Limiting your Wanted List to a <b><u>${pokemon.name}</u></b> only`;

    // Render the tooltip using a portal to a higher-level element (like document.body)
    const renderTooltip = () => {
        if (!hovered || !tooltipRef.current) return null;
    
        const rect = tooltipRef.current.getBoundingClientRect();
        const tooltipHeight = 50; // Set this value based on the expected height of your tooltip
        const extraSpace = 30; // Add extra space to move the tooltip higher
    
        return ReactDOM.createPortal(
            <div
                className="tooltip"
                style={{
                    position: 'fixed',
                    top: `${rect.top - tooltipHeight - extraSpace}px`, // Move the tooltip higher above the image
                    left: `${rect.left + rect.width / 2}px`, // Center horizontally above the image
                    transform: 'translateX(-50%)', // Adjust for centering
                    zIndex: 100000,
                    backgroundColor: 'black', 
                    padding: '10px',
                    color: 'white',
                    whiteSpace: 'pre', // Prevent breaking lines unless specified by \n
                    borderRadius: '5px',
                    textAlign: 'center',
                    opacity: 0.9
                }}
                dangerouslySetInnerHTML={{ __html: dynamicTooltipText }}
            />,
            document.body
        );
    };    

    return (
        <div
            className="mirror"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            ref={tooltipRef}
        >
            <img
                src={process.env.PUBLIC_URL + '/images/mirror.png'}
                alt="Mirror"
                className={isMirror ? '' : 'grey-out'}
                onClick={toggleMirror}
                style={{ cursor: 'pointer' }}
            />
            {renderTooltip()}
        </div>
    );
};

export default MirrorManager;