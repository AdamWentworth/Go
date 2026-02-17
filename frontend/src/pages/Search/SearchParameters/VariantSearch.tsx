import React from 'react';

import { formatCostumeName } from '../utils/formatCostumeName';
import { formatForm } from '@/utils/formattingHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { SelectedMoves } from './VariantComponents/MovesSearch';
import VariantSearchInput from './VariantSearchInput';
import VariantSearchTogglePanel from './VariantSearchTogglePanel';
import VariantSearchPreviewPanel from './VariantSearchPreviewPanel';
import VariantSearchBackgroundOverlay from './VariantSearchBackgroundOverlay';
import useVariantSearchController from './useVariantSearchController';
import './VariantSearch.css';

type VariantSearchProps = {
  pokemon: string;
  setPokemon: React.Dispatch<React.SetStateAction<string>>;
  isShiny: boolean;
  setIsShiny: React.Dispatch<React.SetStateAction<boolean>>;
  isShadow: boolean;
  setIsShadow: React.Dispatch<React.SetStateAction<boolean>>;
  costume: string | null;
  setCostume: React.Dispatch<React.SetStateAction<string | null>>;
  selectedForm: string;
  setSelectedForm: React.Dispatch<React.SetStateAction<string>>;
  selectedMoves: SelectedMoves;
  setSelectedMoves: React.Dispatch<React.SetStateAction<SelectedMoves>>;
  selectedGender: string | null;
  setSelectedGender: React.Dispatch<React.SetStateAction<string | null>>;
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedBackgroundId: React.Dispatch<React.SetStateAction<number | null>>;
  dynamax: boolean;
  setDynamax: React.Dispatch<React.SetStateAction<boolean>>;
  gigantamax: boolean;
  setGigantamax: React.Dispatch<React.SetStateAction<boolean>>;
  pokemonCache: PokemonVariant[] | null;
};

const VariantSearch: React.FC<VariantSearchProps> = ({
  pokemon,
  setPokemon,
  isShiny,
  setIsShiny,
  isShadow,
  setIsShadow,
  costume,
  setCostume,
  selectedForm,
  setSelectedForm,
  selectedMoves,
  setSelectedMoves,
  selectedGender,
  setSelectedGender,
  setErrorMessage,
  setSelectedBackgroundId,
  dynamax,
  setDynamax,
  gigantamax,
  setGigantamax,
  pokemonCache,
}) => {
  const {
    currentPokemonData,
    availableForms,
    availableCostumes,
    imageUrl,
    imageError,
    showCostumeDropdown,
    selectedBackground,
    showBackgroundOverlay,
    suggestions,
    backgroundAllowed,
    selectedCostumeId,
    canDynamax,
    toggleMax,
    setShowBackgroundOverlay,
    handleImageError,
    handleBackgroundChange,
    handleGenderChange,
    handlePokemonChange,
    handleInputFocus,
    handleInputBlur,
    handleShinyChange,
    handleShadowChange,
    handleCostumeToggle,
    handleCostumeChange,
    handleFormChange,
    handleMovesChange,
    handleSuggestionClick,
  } = useVariantSearchController({
    pokemon,
    setPokemon,
    isShiny,
    setIsShiny,
    isShadow,
    setIsShadow,
    costume,
    setCostume,
    selectedForm,
    setSelectedForm,
    selectedMoves,
    setSelectedMoves,
    selectedGender,
    setSelectedGender,
    setErrorMessage,
    setSelectedBackgroundId,
    dynamax,
    setDynamax,
    gigantamax,
    setGigantamax,
    pokemonCache,
  });

  return (
    <div className="pokemon-variant-container">
      <div className="main-content">
        <div className="pokemon-variant-details">
          <h3>Pokemon Variant</h3>
          <VariantSearchInput
            pokemon={pokemon}
            suggestions={suggestions}
            onPokemonChange={handlePokemonChange}
            onInputFocus={handleInputFocus}
            onInputBlur={handleInputBlur}
            onSuggestionClick={handleSuggestionClick}
          />

          <VariantSearchTogglePanel
            isShiny={isShiny}
            isShadow={isShadow}
            showCostumeDropdown={showCostumeDropdown}
            onShinyToggle={handleShinyChange}
            onCostumeToggle={handleCostumeToggle}
            onShadowToggle={handleShadowChange}
            availableForms={availableForms}
            selectedForm={selectedForm}
            onFormChange={handleFormChange}
            availableCostumeNames={availableCostumes.map((entry) => entry.name)}
            costume={costume}
            onCostumeChange={handleCostumeChange}
            formatCostumeLabel={formatCostumeName}
            formatFormLabel={formatForm}
          />
        </div>

        <VariantSearchPreviewPanel
          selectedBackground={selectedBackground}
          imageUrl={imageUrl}
          imageError={imageError}
          pokemon={pokemon}
          onImageError={handleImageError}
          dynamax={dynamax}
          gigantamax={gigantamax}
          currentPokemonData={currentPokemonData}
          selectedMoves={selectedMoves}
          onMovesChange={handleMovesChange}
          onGenderChange={handleGenderChange}
          backgroundAllowed={backgroundAllowed}
          onOpenBackgroundOverlay={() => setShowBackgroundOverlay(true)}
          canDynamax={canDynamax}
          onToggleMax={toggleMax}
        />
      </div>

      <VariantSearchBackgroundOverlay
        isOpen={showBackgroundOverlay}
        onClose={() => setShowBackgroundOverlay(false)}
        currentPokemonData={currentPokemonData}
        onSelectBackground={handleBackgroundChange}
        selectedCostumeId={selectedCostumeId}
      />
    </div>
  );
};

export default VariantSearch;
