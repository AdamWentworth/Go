// PokemonMenu.jsx

import React, { useState, useEffect, useRef } from 'react';
import { validate as uuidValidate } from 'uuid';
import PokemonCard from './PokemonCard';
import PokedexOverlay from './PokedexOverlay';
import InstanceOverlay from './InstanceOverlay';
import PokemonOptionsOverlay from './PokemonOptionsOverlay';
import './PokemonMenu.css';
import { useModal } from '../../../contexts/ModalContext';
import SearchUI from './SearchUI';
import SearchMenu from './SearchMenu';
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
  searchTerm,
  setSearchTerm,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
  onSearchMenuStateChange,
}) {
  // Track whether the input is focused and whether the search menu is visible.
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { alert } = useModal();
  const [optionsSelectedPokemon, setOptionsSelectedPokemon] = useState(null);
  const searchAreaRef = useRef(null);

  // Hide menu (and mark input as unfocused) if clicking outside the search area.
  useEffect(() => {
    function handleDocumentClick(e) {
      if (searchAreaRef.current && !searchAreaRef.current.contains(e.target)) {
        setIsInputFocused(false);
        setIsMenuVisible(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  // When a filter is clicked, update the search term, blur the input, and hide the menu.
  const handleFilterClick = (filterText) => {
    const newValue = searchTerm.trim() ? `${searchTerm}&${filterText}` : filterText;
    setSearchTerm(newValue);
    const searchInput = searchAreaRef.current?.querySelector('input');
    searchInput?.blur(); // blur to hide the menu and show the grid
    setIsMenuVisible(false);
  };

  // Update the search term as the user types.
  const handleSearchChange = (val) => {
    setIsMenuVisible(false);
    setSearchTerm(val);
  };

  // When the input is focused, mark it as focused and show the menu.
  const handleFocusChange = (focused) => {
    setIsInputFocused(focused);
    if (focused) {
      setIsMenuVisible(true);
    }
  };

  // Optionally close the menu and blur the input when the arrow is clicked.
  const handleCloseMenu = () => {
    setIsMenuVisible(false);
    setSearchTerm('')
  };

  const handleSelect = (pokemon) => {
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
      alert('This Pokémon is fused with another and is disabled until unfused.');
      return;
    }
    const keyParts = pokemon.pokemonKey.split('_');
    const possibleUUID = keyParts[keyParts.length - 1];
    const isInstance = uuidValidate(possibleUUID);
    setOptionsSelectedPokemon({ pokemon, isInstance });
  };

  const openOverlay = ({ pokemon, isInstance }) => {
    setSelectedPokemon(isInstance ? { pokemon, overlayType: 'instance' } : pokemon);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  // Inform any parent about the menu visibility.
  useEffect(() => {
    if (onSearchMenuStateChange) {
      onSearchMenuStateChange(isMenuVisible);
    }
  }, [isMenuVisible, onSearchMenuStateChange]);

  return (
    <div className={`pokemon-container ${searchTerm.trim() !== '' ? 'has-checkbox' : ''}`}>
      <header className="search-header" ref={searchAreaRef}>
        <SearchUI
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showEvolutionaryLine={showEvolutionaryLine}
          toggleEvolutionaryLine={toggleEvolutionaryLine}
          onFocusChange={handleFocusChange}
          onArrowClick={handleCloseMenu}
        />

        {isMenuVisible && (
          <SearchMenu onFilterClick={handleFilterClick} onCloseMenu={handleCloseMenu} />
        )}
      </header>

      {/* When the menu is hidden, show the filtered Pokémon grid */}
      {!isMenuVisible && (
        <main className="pokemon-grid">
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
              toggleCardHighlight={toggleCardHighlight}
              setIsFastSelectEnabled={setIsFastSelectEnabled}
              isFastSelectEnabled={isFastSelectEnabled}
              variants={allPokemons}
            />
          ))}
        </main>
      )}

      {highlightedCards.size === 0 && (
        <SortOverlay
          sortType={sortType}
          setSortType={setSortType}
          sortMode={sortMode}
          setSortMode={toggleSortMode}
        />
      )}

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
            openOverlay({ pokemon: poke, isInstance: optionsSelectedPokemon.isInstance });
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
            pokemon={selectedPokemon.overlayType ? selectedPokemon.pokemon : selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
            setSelectedPokemon={setSelectedPokemon}
            allPokemons={allPokemons}
          />
        ))}
    </div>
  );
}

export default React.memo(PokemonMenu);
