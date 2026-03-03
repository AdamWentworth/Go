import React from 'react';

import PokedexFiltersMenu from './Menus/PokedexMenu/PokedexListsMenu';
import PokemonMenu from './Menus/PokemonMenu/PokemonMenu';
import TagsMenu from './Menus/TagsMenu/TagsMenu';
import type { SwipeHandlers } from '../hooks/useSwipeHandler';
import type { PokemonOverlaySelection } from '../hooks/useInstanceIdProcessor';
import type { ActiveView } from '../utils/pokemonPageHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { SortMode, SortType } from '@/types/sort';
import type { TagBuckets } from '@/types/tags';
import type { PokedexLists } from '@/types/pokedex';

type PokemonViewSliderProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  swipeHandlers: SwipeHandlers;
  transform: string;
  isDragging: boolean;
  setTagFilter: React.Dispatch<React.SetStateAction<string>>;
  onPokedexHighlightedCardsChange: (cards: Set<number | string>) => void;
  onPokedexActiveViewChange: (view: string) => void;
  onPokedexListSelect: (list: PokemonVariant[], key: string) => void;
  pokedexLists: PokedexLists;
  variants: PokemonVariant[];
  isEditable: boolean;
  sortedPokemons: PokemonVariant[];
  loading: boolean;
  selectedPokemon: PokemonOverlaySelection;
  setSelectedPokemon: (pokemon: PokemonOverlaySelection) => void;
  isFastSelectEnabled: boolean;
  toggleCardHighlight: (key: string) => void;
  highlightedCards: Set<string>;
  tagFilter: string;
  activeTags: TagBuckets;
  instances: Instances;
  sortType: SortType;
  setSortType: React.Dispatch<React.SetStateAction<SortType>>;
  sortMode: SortMode;
  setSortMode: React.Dispatch<React.SetStateAction<SortMode>>;
  username: string;
  setIsFastSelectEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  showEvolutionaryLine: boolean;
  toggleEvolutionaryLine: () => void;
  activeView: ActiveView;
  onTagSelect: (filter: string) => void;
};

const PokemonViewSlider: React.FC<PokemonViewSliderProps> = ({
  containerRef,
  swipeHandlers,
  transform,
  isDragging,
  setTagFilter,
  onPokedexHighlightedCardsChange,
  onPokedexActiveViewChange,
  onPokedexListSelect,
  pokedexLists,
  variants,
  isEditable,
  sortedPokemons,
  loading,
  selectedPokemon,
  setSelectedPokemon,
  isFastSelectEnabled,
  toggleCardHighlight,
  highlightedCards,
  tagFilter,
  activeTags,
  instances,
  sortType,
  setSortType,
  sortMode,
  setSortMode,
  username,
  setIsFastSelectEnabled,
  searchTerm,
  setSearchTerm,
  showEvolutionaryLine,
  toggleEvolutionaryLine,
  activeView,
  onTagSelect,
}) => (
  <div
    className="view-slider-container"
    ref={containerRef}
    {...swipeHandlers}
    style={{
      overflow: 'hidden',
      touchAction: 'pan-y',
      willChange: 'transform',
    }}
  >
    <div
      className="view-slider"
      style={{
        transform,
        transition: isDragging
          ? 'none'
          : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
      }}
    >
      <div className="slider-panel">
        <PokedexFiltersMenu
          setTagFilter={setTagFilter}
          setHighlightedCards={onPokedexHighlightedCardsChange}
          setActiveView={onPokedexActiveViewChange}
          onListSelect={onPokedexListSelect}
          pokedexLists={pokedexLists}
          variants={variants}
        />
      </div>

      <div className="slider-panel">
        <PokemonMenu
          isEditable={isEditable}
          sortedPokemons={sortedPokemons}
          allPokemons={variants}
          loading={loading}
          selectedPokemon={selectedPokemon}
          setSelectedPokemon={setSelectedPokemon}
          isFastSelectEnabled={isFastSelectEnabled}
          toggleCardHighlight={toggleCardHighlight}
          highlightedCards={highlightedCards}
          tagFilter={tagFilter}
          lists={activeTags}
          instances={instances}
          sortType={sortType}
          setSortType={setSortType}
          sortMode={sortMode}
          setSortMode={setSortMode}
          variants={variants}
          username={username}
          setIsFastSelectEnabled={setIsFastSelectEnabled}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showEvolutionaryLine={showEvolutionaryLine}
          toggleEvolutionaryLine={toggleEvolutionaryLine}
          activeView={activeView}
        />
      </div>

      <div className="slider-panel">
        <TagsMenu
          onSelectTag={onTagSelect}
          activeTags={activeTags}
          variants={variants}
        />
      </div>
    </div>
  </div>
);

export default PokemonViewSlider;
