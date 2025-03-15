// PokemonList.jsx

import React, { useState } from 'react';
import { validate as uuidValidate } from 'uuid';
import PokemonCard from './PokemonCard';
import PokedexOverlay from './PokedexOverlay';
import InstanceOverlay from './InstanceOverlay';
import PokemonOptionsOverlay from './PokemonOptionsOverlay';
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
  setIsFastSelectEnabled,
  onSwipe
}) {
  const { alert } = useModal();
  const [optionsSelectedPokemon, setOptionsSelectedPokemon] = useState(null);

  // ---------------------------------------
  // Step A) On user click
  // ---------------------------------------
  const handleSelect = (pokemon) => {
    console.log('Pokemon selected:', pokemon.pokemonKey);

    // If not editable, skip options overlay and go directly into the Instance Overlay.
    if (!isEditable) {
      setSelectedPokemon({ pokemon, overlayType: 'instance' });
      return;
    }

    // 1) If user is in multi-select (fast-select) mode, just highlight/unhighlight:
    if (isFastSelectEnabled) {
      const wasHighlighted = highlightedCards.has(pokemon.pokemonKey);
      toggleCardHighlight(pokemon.pokemonKey);

      if (wasHighlighted && highlightedCards.size === 1) {
        setIsFastSelectEnabled(false);
      }
      return;
    }

    // 2) If the Pokémon is disabled, show alert & do nothing:
    if (pokemon.ownershipStatus?.disabled) {
      alert(
        'This Pokémon is fused with another and is disabled until unfused; no overlay will open.'
      );
      return;
    }

    // 3) Compute whether this Pokémon is an instance only once.
    const keyParts = pokemon.pokemonKey.split('_');
    const possibleUUID = keyParts[keyParts.length - 1];
    const isInstance = uuidValidate(possibleUUID);

    // 4) Open the options overlay and pass along the isInstance flag.
    setOptionsSelectedPokemon({ pokemon, isInstance });
  };

  // ---------------------------------------
  // Step B) If the user chooses "Open Overlay"
  // ---------------------------------------
  // Note: Now we expect an object that contains both the Pokémon and isInstance.
  const openOverlay = ({ pokemon, isInstance }) => {
    setSelectedPokemon(
      isInstance ? { pokemon, overlayType: 'instance' } : pokemon
    );
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
              onSwipe={onSwipe} // <-- pass the onSwipe prop down to each card
              isHighlighted={highlightedCards.has(pokemon.pokemonKey)}
              isShiny={isShiny}
              showShadow={showShadow}
              multiFormPokedexNumbers={multiFormPokedexNumbers}
              ownershipFilter={ownershipFilter}
              showAll={showAll}
              sortType={sortType}
              isEditable={isEditable}
              toggleCardHighlight={toggleCardHighlight}
              setIsFastSelectEnabled={setIsFastSelectEnabled}
              isFastSelectEnabled={isFastSelectEnabled}
              variants={allPokemons}
            />
          ))}

          {/* Only render the options overlay if isEditable is true */}
          {isEditable && optionsSelectedPokemon && (
            <PokemonOptionsOverlay
              // Pass both the raw Pokémon and the computed isInstance flag.
              pokemon={optionsSelectedPokemon.pokemon}
              isInstance={optionsSelectedPokemon.isInstance}
              ownershipFilter={ownershipFilter}
              onClose={() => setOptionsSelectedPokemon(null)}
              // If user chooses "Highlight":
              onHighlight={(poke) => {
                toggleCardHighlight(poke.pokemonKey);
                setIsFastSelectEnabled(true);
                setOptionsSelectedPokemon(null);
              }}
              // If user chooses "Open Overlay":
              onOpenOverlay={(poke) => {
                openOverlay({
                  pokemon: poke,
                  isInstance: optionsSelectedPokemon.isInstance,
                });
                setOptionsSelectedPokemon(null);
              }}
            />
          )}

          {selectedPokemon &&
            (selectedPokemon.overlayType === 'instance' ? (
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
              <PokedexOverlay
                pokemon={
                  selectedPokemon.overlayType
                    ? selectedPokemon.pokemon
                    : selectedPokemon
                }
                onClose={() => setSelectedPokemon(null)}
                setSelectedPokemon={setSelectedPokemon}
                allPokemons={allPokemons}
              />
            ))}
        </>
      )}
    </div>
  );
}

export default React.memo(PokemonList);
