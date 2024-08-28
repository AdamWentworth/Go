// PokemonList.jsx

import React from 'react';
import { validate as uuidValidate } from 'uuid';
import PokemonCard from './PokemonCard';
import PokemonOverlay from './PokemonOverlay';
import InstanceOverlay from './InstanceOverlay'; // Import the new overlay
import './PokemonList.css';

function PokemonList({
    sortedPokemons,
    allPokemons,
    loading,
    selectedPokemon,
    setSelectedPokemon,
    isFastSelectEnabled,
    toggleCardHighlight,
    highlightedCards,
    isShiny,
    showShadow,
    singleFormPokedexNumbers,
    ownershipFilter,
    lists,
    ownershipData,
    showAll,
    sortType,
    sortMode,
    variants
}) {

    const handleSelect = (pokemon) => {
        console.log(pokemon.pokemonKey);
        const keyParts = pokemon.pokemonKey.split('_');
        const possibleUUID = keyParts[keyParts.length - 1];
        const hasUUID = uuidValidate(possibleUUID);
    
        if (isFastSelectEnabled) {
            toggleCardHighlight(pokemon.pokemonKey);
        } else {
            setSelectedPokemon(pokemon); // Directly set the Pokémon as in the stable version
            if (hasUUID) {
                // Store additional state for instance overlay if needed
                setSelectedPokemon({ pokemon: pokemon, overlayType: 'instance' });
            }
        }
    };        
    
    return (
        <div className="pokemon-container">
            {loading ? <p>Loading...</p> : (
                <>
                    {sortedPokemons.map(pokemon => (
                        <PokemonCard
                            key={pokemon.pokemonKey}
                            pokemon={pokemon}
                            onSelect={() => handleSelect(pokemon)}
                            isHighlighted={highlightedCards.has(pokemon.pokemonKey)}
                            isShiny={isShiny}
                            showShadow={showShadow}
                            singleFormPokedexNumbers={singleFormPokedexNumbers}
                            ownershipFilter={ownershipFilter}
                            showAll={showAll}
                            sortType={sortType}
                        />
                    ))}
                    {selectedPokemon && (
                        selectedPokemon.overlayType === 'instance' ?
                        <InstanceOverlay
                            pokemon={selectedPokemon.pokemon}
                            onClose={() => setSelectedPokemon(null)}
                            setSelectedPokemon={setSelectedPokemon}
                            allPokemons={sortedPokemons}
                            ownershipFilter={ownershipFilter}
                            lists={lists}
                            ownershipData={ownershipData}
                            sortType={sortType}
                            sortMode={sortMode}
                            variants={variants}
                        /> :
                        <PokemonOverlay
                            pokemon={selectedPokemon.overlayType ? selectedPokemon.pokemon : selectedPokemon}
                            onClose={() => setSelectedPokemon(null)}
                            setSelectedPokemon={setSelectedPokemon}
                            allPokemons={allPokemons}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default React.memo(PokemonList);