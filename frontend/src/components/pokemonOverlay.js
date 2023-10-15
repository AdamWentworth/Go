import React from 'react';
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


function PokemonOverlay({ pokemon, onClose }) {

    const handleBackgroundClick = (event) => {
        // If the background is clicked, close the overlay
        onClose();
    }

    const handleContentClick = (event) => {
        // Prevent the click from propagating to the background
        event.stopPropagation();
    }
    

    return (
        <div className="pokemon-overlay" onClick={handleBackgroundClick}>
            <div className="overlay-content" onClick={handleContentClick}>
                <button onClick={onClose} className="close-button">X</button>
                
                <div className="column moves-column">
                    {/* Placeholder for Moves */}
                    <strong>Moves:</strong>
                    <ul>
                        {/* Example */}
                        <li>Move 1</li>
                        <li>Move 2</li>
                        <li>Move 3</li>
                        {/* Add the real moves here */}
                    </ul>
                </div>

                <div className="column main-info-column">
                    <img src={pokemon.currentImage} alt={pokemon.name} />
                    <p>#{pokemon.pokedex_number}</p>
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

                    <div className="type-section"> 
                        <img src={pokemon.type_1_icon} alt={pokemon.type1_name} />
                        {pokemon.type2_name && (
                            <img src={pokemon.type_2_icon} alt={pokemon.type2_name} />
                        )}
                    </div>
                </div>

                <div className="column images-column">
                    <img src={pokemon.shiny_image} alt={`${pokemon.name} Shiny`} />
                    <div>
                        <strong>Shiny Rarity:</strong> {formatShinyRarity(pokemon.shiny_rarity)}
                    </div>
                </div>

                {pokemon.costumes && pokemon.costumes.length > 0 && (
                    <div className="column costume-column">
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
                )}
            </div>
        </div>
    );
}

export default PokemonOverlay;
