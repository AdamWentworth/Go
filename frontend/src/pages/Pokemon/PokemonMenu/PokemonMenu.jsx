// PokemonMenu.jsx

import React, { useState } from 'react';
import { validate as uuidValidate } from 'uuid';
import PokemonCard from './PokemonCard';
import PokedexOverlay from './PokedexOverlay';
import InstanceOverlay from './InstanceOverlay';
import PokemonOptionsOverlay from './PokemonOptionsOverlay';
import './PokemonMenu.css';
import { useModal } from '../../../contexts/ModalContext';
import SearchUI from './SearchUI';
import SortOverlay from './SortOverlay';

function PokemonMenu({
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
  setSortType,
  sortMode,
  toggleSortMode,
  variants,
  username,
  setIsFastSelectEnabled,
  onSwipe,
  searchTerm,
  setSearchTerm,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
}) {
  const { alert } = useModal();
  const [optionsSelectedPokemon, setOptionsSelectedPokemon] = useState(null);

  const handleSelect = (pokemon) => {
    console.log('Pokemon selected:', pokemon.pokemonKey);
    if (!isEditable) {
      setSelectedPokemon({ pokemon, overlayType: 'instance' });
      return;
    }
    if (isFastSelectEnabled) {
      const wasHighlighted = highlightedCards.has(pokemon.pokemonKey);
      toggleCardHighlight(pokemon.pokemonKey);
      if (wasHighlighted && highlightedCards.size === 1) {
        setIsFastSelectEnabled(false);
      }
      return;
    }
    if (pokemon.ownershipStatus?.disabled) {
      alert(
        'This Pokémon is fused with another and is disabled until unfused; no overlay will open.'
      );
      return;
    }
    const keyParts = pokemon.pokemonKey.split('_');
    const possibleUUID = keyParts[keyParts.length - 1];
    const isInstance = uuidValidate(possibleUUID);

    setOptionsSelectedPokemon({ pokemon, isInstance });
  };

  const openOverlay = ({ pokemon, isInstance }) => {
    setSelectedPokemon(
      isInstance ? { pokemon, overlayType: 'instance' } : pokemon
    );
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className={`pokemon-container ${searchTerm.trim() !== '' ? 'has-checkbox' : ''}`}>
      {/* Sticky SearchUI header that stays at the top of this panel only */}
      <header className="search-header">
        <SearchUI
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showEvolutionaryLine={showEvolutionaryLine}
          toggleEvolutionaryLine={toggleEvolutionaryLine}
          totalPokemon={sortedPokemons.length}
          showCount
        />
      </header>
      {/* The grid container for the Pokémon cards */}
      <main className="pokemon-grid">
        {sortedPokemons.map((pokemon) => (
          <PokemonCard
            key={pokemon.pokemonKey}
            pokemon={pokemon}
            onSelect={() => handleSelect(pokemon)}
            onSwipe={onSwipe}
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
      </main>
      {/* Render SortOverlay if no cards are highlighted */}
      {highlightedCards.size === 0 && (
        <SortOverlay
          sortType={sortType}
          setSortType={setSortType}
          sortMode={sortMode}
          setSortMode={toggleSortMode}
        />
      )}
      {/* Options overlay (if isEditable) */}
      {isEditable && optionsSelectedPokemon && (
        <PokemonOptionsOverlay
          pokemon={optionsSelectedPokemon.pokemon}
          isInstance={optionsSelectedPokemon.isInstance}
          ownershipFilter={ownershipFilter}
          onClose={() => setOptionsSelectedPokemon(null)}
          onHighlight={(poke) => {
            toggleCardHighlight(poke.pokemonKey);
            setIsFastSelectEnabled(true);
            setOptionsSelectedPokemon(null);
          }}
          onOpenOverlay={(poke) => {
            openOverlay({
              pokemon: poke,
              isInstance: optionsSelectedPokemon.isInstance,
            });
            setOptionsSelectedPokemon(null);
          }}
        />
      )}
      {/* Instance or Pokedex overlay */}
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
    </div>
  );
}

export default React.memo(PokemonMenu);