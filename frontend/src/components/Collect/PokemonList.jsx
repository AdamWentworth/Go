// PokemonList.jsx

import React from 'react';
import PokemonCard from './PokemonCard';
import PokemonOverlay from './PokemonOverlay';

function PokemonList({
    sortedPokemons,
    loading,
    selectedPokemon,
    setSelectedPokemon,
    isFastSelectEnabled,
    toggleCardHighlight,
    isShiny,
    showShadow,
    singleFormPokedexNumbers,
    ownershipFilter
}) {
    return (
        <div className="pokemon-container">
            {loading ? <p>Loading...</p> : (
                <>
                    {sortedPokemons.map(pokemon => (
                        <PokemonCard
                            key={pokemon.pokemonKey}
                            pokemon={pokemon}
                            onSelect={() => {
                                if (isFastSelectEnabled) {
                                    toggleCardHighlight(pokemon.pokemonKey);
                                } else {
                                    setSelectedPokemon(pokemon);
                                }
                            }}
                            isHighlighted={selectedPokemon && selectedPokemon.pokemonKey === pokemon.pokemonKey}
                            isShiny={isShiny}
                            showShadow={showShadow}
                            singleFormPokedexNumbers={singleFormPokedexNumbers}
                            ownershipFilter={ownershipFilter}
                        />
                    ))}
                    {selectedPokemon && (
                        <PokemonOverlay
                            pokemon={selectedPokemon}
                            onClose={() => setSelectedPokemon(null)}
                            setSelectedPokemon={setSelectedPokemon}
                            allPokemons={sortedPokemons} // Assuming all variants are required here
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default PokemonList;
