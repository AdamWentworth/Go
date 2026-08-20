import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import './Pokemon.css';

import HeaderUI from './components/Header/HeaderUI';
import PokemonViewSlider from './components/PokemonViewSlider';
import PokemonPageOverlays from './components/PokemonPageOverlays';
import { AppLoadingFallback } from '@/contexts/AppLoadingContext';

import {
  getHaveTagsSubLabel,
  getWishlistSubLabel,
} from './utils/pokemonPageHelpers';
import usePokemonPageController from './hooks/usePokemonPageController';

interface PokemonProps {
  isOwnCollection: boolean;
}

const HeaderUIMemo = React.memo(HeaderUI);

function Pokemon({ isOwnCollection }: PokemonProps) {
  const { username: urlUsername } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const controller = usePokemonPageController({
    isOwnCollection,
    urlUsername,
    location,
    navigate,
  });

  if (controller.isPageLoading) {
    return <AppLoadingFallback source="pokemon-page" />;
  }

  return (
    <div className="pokemon-page">
      {controller.isUsernamePath && controller.userExists === false && <h1>User not found</h1>}

      <HeaderUIMemo
        activeView={controller.activeView}
        onWishlistClick={controller.handleListsButtonClick}
        onHaveTagsClick={() =>
          controller.setActiveView((prev) => (prev === 'pokedex' ? 'pokemon' : 'pokedex'))
        }
        onPokemonClick={() => controller.setActiveView('pokemon')}
        catalogOwner={controller.isEditable ? undefined : controller.displayUsername}
        onReturnToContext={controller.returnToContext}
        totalPokemon={controller.sortedPokemons.length}
        highlightedCards={controller.highlightedCards}
        onClearSelection={controller.handleClearSelection}
        onSelectAll={controller.handleSelectAll}
        haveTagsSubLabel={getHaveTagsSubLabel(
          controller.lastMenu,
          controller.sidePanelTagFilter,
        )}
        wishlistSubLabel={getWishlistSubLabel(controller.lastMenu, controller.sidePanelTagFilter)}
      />

      <PokemonViewSlider
        containerRef={controller.containerRef}
        swipeHandlers={controller.swipeHandlers}
        transform={controller.transform}
        isDragging={controller.isDragging}
        variants={controller.variants}
        isEditable={controller.isEditable}
        sortedPokemons={controller.sortedPokemons}
        loading={controller.isPageLoading}
        selectedPokemon={controller.selectedPokemon}
        setSelectedPokemon={controller.setSelectedPokemon}
        isFastSelectEnabled={controller.isFastSelectEnabled}
        toggleCardHighlight={controller.toggleCardHighlight}
        highlightedCards={controller.highlightedCards}
        tagFilter={controller.tagFilter}
        sidePanelTagFilter={controller.sidePanelTagFilter}
        onClearTagFilter={controller.handleClearTagFilter}
        activeTags={controller.activeTags}
        instances={controller.instances}
        sortType={controller.sortType}
        setSortType={controller.setSortType}
        sortMode={controller.sortMode}
        setSortMode={controller.setSortMode}
        username={controller.displayUsername}
        setIsFastSelectEnabled={controller.setIsFastSelectEnabled}
        searchTerm={controller.searchTerm}
        setSearchTerm={controller.setSearchTerm}
        showEvolutionaryLine={controller.showEvolutionaryLine}
        toggleEvolutionaryLine={controller.toggleEvolutionaryLine}
        activeView={controller.activeView}
        onTagSelect={controller.handleTagSelect}
      />

      <PokemonPageOverlays
        isEditable={controller.isEditable}
        highlightedCards={controller.highlightedCards}
        onConfirmChangeTags={controller.handleConfirmChangeTags}
        activeStatusFilter={controller.activeStatusFilter}
        isUpdating={controller.isUpdating}
        isMegaSelectionOpen={controller.isMegaSelectionOpen}
        megaSelectionData={controller.megaSelectionData}
        onMegaResolve={controller.handleMegaSelectionResolve}
        onMegaReject={controller.handleMegaSelectionReject}
        isFusionSelectionOpen={controller.isFusionSelectionOpen}
        fusionSelectionData={controller.fusionSelectionData}
        onFusionResolve={controller.handleFusionSelectionResolve}
        onFusionCancel={controller.closeFusionSelection}
        onCreateNewLeft={controller.handleCreateNewLeft}
        onCreateNewRight={controller.handleCreateNewRight}
      />
    </div>
  );
}

export default Pokemon;
