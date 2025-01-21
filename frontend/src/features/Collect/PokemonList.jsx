// PokemonList.jsx

import React from 'react';
import { validate as uuidValidate } from 'uuid';
import PokemonCard from './PokemonCard';
import PokemonOverlay from './PokedexOverlay';
import InstanceOverlay from './InstanceOverlay';
import './PokemonList.css';
import { useModal } from '../../contexts/ModalContext';

function PokemonList({
  isEditable,
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
  multiFormPokedexNumbers,
  ownershipFilter,
  lists,
  ownershipData,
  showAll,
  sortType,
  sortMode,
  variants,
  username,
}) {
  const { alert } = useModal();

  const handleSelect = (pokemon) => {
    console.log('Pokemon selected:', pokemon.pokemonKey);

    // Step 1) If user is in multi-select mode, just highlight
    if (isFastSelectEnabled) {
      toggleCardHighlight(pokemon.pokemonKey);
      return;
    }

    // Step 2) If the Pokémon is disabled, do nothing (no overlays)
    if (pokemon.ownershipStatus?.disabled) {
      alert('This Pokémon is fused with another and is disabled until unfused; no overlay will open.');
      return;
    }

    // Step 3) Otherwise, check if it's an instance (uuid => overlayType: 'instance')
    const keyParts = pokemon.pokemonKey.split('_');
    const possibleUUID = keyParts[keyParts.length - 1];
    const isInstance = uuidValidate(possibleUUID);

    if (isInstance) {
      // Show the InstanceOverlay
      setSelectedPokemon({ pokemon, overlayType: 'instance' });
    } else {
      // Non-instance => show the standard PokemonOverlay
      setSelectedPokemon(pokemon);
    }
  };

  return (
    <div className="pokemon-container">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {sortedPokemons.map((pokemon) => (
            <PokemonCard
              key={pokemon.pokemonKey}
              pokemon={pokemon}
              onSelect={() => handleSelect(pokemon)}
              isHighlighted={highlightedCards.has(pokemon.pokemonKey)}
              isShiny={isShiny}
              showShadow={showShadow}
              multiFormPokedexNumbers={multiFormPokedexNumbers}
              ownershipFilter={ownershipFilter}
              showAll={showAll}
              sortType={sortType}
              isEditable={isEditable}
            />
          ))}
          {selectedPokemon && (
            selectedPokemon.overlayType === 'instance' ? (
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
                isEditable={isEditable}
                username={username}
              />
            ) : (
              <PokemonOverlay
                pokemon={
                  selectedPokemon.overlayType
                    ? selectedPokemon.pokemon
                    : selectedPokemon
                }
                onClose={() => setSelectedPokemon(null)}
                setSelectedPokemon={setSelectedPokemon}
                allPokemons={allPokemons}
              />
            )
          )}
        </>
      )}
    </div>
  );
}

export default React.memo(PokemonList);
