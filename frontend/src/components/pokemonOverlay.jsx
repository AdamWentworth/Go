import React, { useState } from 'react';
import './pokemonOverlay.css';

function formatShinyRarity(rarity) {
    switch(rarity) {
        case "community_day":
            return "Community Day ~1/25";
        case "research_day":
            return "Research Day ~1/10";
        case "mega_raid":
            return "Mega Raid ~1/60";
        case "permaboosted":
            return "Permaboosted ~1/64";
        case "raid_day":
            return "Raid Day ~1/10";
        case "egg":
            return "Egg ~1/10 - 1/64";
        default:
            return "Full Odds ~1/500";
    }
}

function formatCostumeName(name) {
    return name
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function WindowOverlay({ title, children, onClose, position }) {
    const handleBackgroundClick = (event) => {
        onClose();
    }

    const handleContentClick = (event) => {
        event.stopPropagation();
    }

    return (
        <div className={`pokemon-overlay ${position}`} onClick={handleBackgroundClick}>
            <div className="overlay-content" onClick={handleContentClick}>
                <button onClick={onClose} className="close-button">X</button>
                {children}
            </div>
        </div>
    );
}

function PokemonOverlay({ pokemon, onClose }) { // Added the onClose prop
    return (
        <div className="pokemon-overlay" onClick={onClose}>
            <div className="background"></div>
            <div className="overlay-windows">
                    <WindowOverlay onClose={onClose} position="bottom-left">
                        <div className="column moves-column">
                        {/* Placeholder for Moves */}
                        <h1>Moves</h1>
                        <ul>
                            {/* Example */}
                            <li>Move 1</li>
                            <li>Move 2</li>
                            <li>Move 3</li>
                            {/* Add the real moves here */}
                        </ul>
                    </div>
                    </WindowOverlay>

                    <WindowOverlay onClose={onClose} position="top-left">
                        <div className="column main-info-column">
                        <h1>Main Info</h1>
                        <img src={pokemon.currentImage} alt={pokemon.name} />
                        <p>#{pokemon.pokedex_number}</p>
                        <div className="type-section"> 
                            <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />
                            {pokemon.type2_name && (
                                <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />
                            )}
                        </div>
                        <h2>{pokemon.name}</h2>

                        <div>
                            <strong>Attack:</strong> {pokemon.attack}
                        </div>
                        <div>
                            <strong>Defense:</strong> {pokemon.defense}
                        </div>
                        <div>
                            <strong>Stamina:</strong> {pokemon.stamina}
                        </div>
                    </div>

                    </WindowOverlay>
                    
                    <WindowOverlay onClose={onClose} position="top-right">
                        <div className="column images-column">
                            <h1>Shiny Info</h1>
                        <img src={pokemon.shiny_image} alt={`${pokemon.name} Shiny`} />
                        <div>
                            <strong>Shiny Rarity:</strong> {formatShinyRarity(pokemon.shiny_rarity)}
                        </div>
                    </div>

                    </WindowOverlay>

                {pokemon.costumes && pokemon.costumes.length > 0 && (
                    <WindowOverlay onClose={onClose} position="bottom-right">
                        <div className="column costume-column">
                        <h1>Costumes</h1>
                    <ul>
                        {pokemon.costumes.map((costume, index) => (
                            <li key={index}>
                                <div className="costume-images">
                                    <img src={costume.image} alt={`Costume - ${formatCostumeName(costume.name)}`} />
                                    {costume.shiny_available === 1 && (
                                        <img src={costume.shiny_image} alt={`Shiny Costume - ${formatCostumeName(costume.name)}`} />
                                    )}
                                </div>
                                {formatCostumeName(costume.name)}
                            </li>
                        ))}
                    </ul>
                    </div>  
                    </WindowOverlay>
            )}
        </div>
        </div>
    );
}

export default PokemonOverlay;
