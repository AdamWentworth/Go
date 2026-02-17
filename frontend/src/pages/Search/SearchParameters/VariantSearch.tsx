import React, { useEffect, useState } from 'react';

import Dropdown from '../components/Dropdown';
import MovesSearch, { type SelectedMoves } from './VariantComponents/MovesSearch';
import validatePokemon from '../utils/validatePokemon';
import { updateImage } from '../utils/updateImage';
import { formatCostumeName } from '../utils/formatCostumeName';
import useErrorHandler from '../hooks/useErrorHandler';
import Gender from '@/components/pokemonComponents/Gender';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';
import { formatForm } from '@/utils/formattingHelpers';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  computeMaxAvailability,
  cycleMaxState,
  getPokemonSuggestions,
  getSelectedCostumeId,
  isBackgroundAllowedForSelection,
  normalizeAvailableForms,
  sortCostumesByDate,
  type SortableCostume,
} from './variantSearchHelpers';
import './VariantSearch.css';

type BackgroundSelection = {
  background_id: number;
  image_url: string;
  name: string;
  location: string;
  date: string;
  costume_id?: number;
};

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
  const { handleError, clearError } = useErrorHandler<string>();
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [availableCostumes, setAvailableCostumes] = useState<SortableCostume[]>([]);
  const [pokemonData, setPokemonData] = useState<PokemonVariant[]>(pokemonCache || []);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false);
  const [selectedBackground, setSelectedBackground] =
    useState<BackgroundSelection | null>(null);
  const [showBackgroundOverlay, setShowBackgroundOverlay] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    setPokemonData(pokemonCache || []);
  }, [pokemonCache]);

  const currentPokemonData = pokemonData.find(
    (entry) => entry.name.toLowerCase() === (pokemon || '').toLowerCase(),
  );

  const { hasDynamax, hasGigantamax } = computeMaxAvailability(currentPokemonData);

  const toggleMax = () => {
    const next = cycleMaxState({
      dynamax,
      gigantamax,
      hasDynamax,
      hasGigantamax,
    });

    if (next.dynamax !== dynamax) {
      setDynamax(next.dynamax);
    }
    if (next.gigantamax !== gigantamax) {
      setGigantamax(next.gigantamax);
    }
  };

  const handleValidation = (
    name: string,
    shinyChecked: boolean,
    shadowChecked: boolean,
    selectedCostume: string | null,
    form: string,
    selectedGenderValue: string | null,
    dynamaxEnabled: boolean,
    gigantamaxEnabled: boolean,
  ) => {
    const {
      error,
      availableCostumes: validatedCostumes,
      availableForms: validatedForms,
    } = validatePokemon(
      pokemonData as unknown as Parameters<typeof validatePokemon>[0],
      name,
      shinyChecked,
      shadowChecked,
      selectedCostume,
      form,
      dynamaxEnabled,
      gigantamaxEnabled,
    );

    if (error) {
      handleError(error);
      setErrorMessage(error);
    } else {
      clearError();
      setErrorMessage(null);
    }

    const sortedCostumes = sortCostumesByDate(
      validatedCostumes as unknown as SortableCostume[],
    );
    setAvailableCostumes(sortedCostumes);

    const filteredForms = normalizeAvailableForms(validatedForms);
    setAvailableForms(filteredForms);

    if (!error) {
      const nextImageUrl = updateImage(
        pokemonData,
        name,
        shinyChecked,
        shadowChecked,
        selectedCostume,
        form,
        selectedGenderValue,
        gigantamaxEnabled,
      );
      setImageUrl(nextImageUrl);
      setImageError(false);
    }
  };

  const handleGenderChange = (gender: string | null) => {
    setSelectedGender(gender);
  };

  useEffect(() => {
    if (pokemon) {
      handleValidation(
        pokemon,
        isShiny,
        isShadow,
        costume,
        selectedForm,
        selectedGender,
        dynamax,
        gigantamax,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGender, isShiny, isShadow, costume, selectedForm, dynamax, gigantamax]);

  const handleBackgroundChange = (background: BackgroundSelection | null) => {
    setSelectedBackground(background);
    setSelectedBackgroundId(background ? background.background_id : null);
    setShowBackgroundOverlay(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePokemonChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPokemon = event.target.value;

    if (newPokemon.length > 11) {
      return;
    }

    setPokemon(newPokemon);
    setSelectedForm('');
    setSelectedGender('Any');
    setSelectedMoves({
      fastMove: null,
      chargedMove1: null,
      chargedMove2: null,
    });
    setDynamax(false);
    setGigantamax(false);

    if (newPokemon.length >= 3) {
      const filtered = getPokemonSuggestions(pokemonData, newPokemon);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }

    if (newPokemon.trim() === '') {
      setImageUrl(null);
      setAvailableForms([]);
      setAvailableCostumes([]);
      setCostume(null);
      setSelectedBackground(null);
      return;
    }

    handleValidation(
      newPokemon,
      isShiny,
      isShadow,
      costume,
      '',
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleInputFocus = () => {
    if (!pokemon || pokemon.length < 3) {
      return;
    }

    const filtered = getPokemonSuggestions(pokemonData, pokemon);
    setSuggestions(filtered);
  };

  const handleInputBlur = () => {
    setSuggestions([]);
  };

  const handleShinyChange = () => {
    const shinyChecked = !isShiny;
    setIsShiny(shinyChecked);
    handleValidation(
      pokemon,
      shinyChecked,
      isShadow,
      costume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleShadowChange = () => {
    const shadowChecked = !isShadow;
    setIsShadow(shadowChecked);
    handleValidation(
      pokemon,
      isShiny,
      shadowChecked,
      costume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleCostumeToggle = () => {
    const nextShow = !showCostumeDropdown;
    setShowCostumeDropdown(nextShow);

    if (!nextShow) {
      setCostume(null);
      clearError();
      handleValidation(
        pokemon,
        isShiny,
        isShadow,
        '',
        selectedForm,
        selectedGender,
        dynamax,
        gigantamax,
      );
      const defaultImage = updateImage(
        pokemonData,
        pokemon,
        isShiny,
        isShadow,
        '',
        selectedForm,
        selectedGender,
        dynamax,
      );
      setImageUrl(defaultImage);
      setImageError(false);
    }
  };

  const handleCostumeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCostume = event.target.value;
    setCostume(selectedCostume);
    handleValidation(
      pokemon,
      isShiny,
      isShadow,
      selectedCostume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextForm = event.target.value;
    setSelectedForm(nextForm);
    handleValidation(
      pokemon,
      isShiny,
      isShadow,
      costume,
      nextForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const handleMovesChange = (moves: SelectedMoves) => {
    setSelectedMoves(moves);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPokemon(suggestion);
    setSuggestions([]);
    handleValidation(
      suggestion,
      isShiny,
      isShadow,
      costume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax,
    );
  };

  const backgroundAllowed = isBackgroundAllowedForSelection(
    currentPokemonData,
    costume,
    availableCostumes,
  );
  const selectedCostumeId = getSelectedCostumeId(availableCostumes, costume);
  const canDynamax = hasDynamax || hasGigantamax;

  return (
    <div className="pokemon-variant-container">
      <div className="main-content">
        <div className="pokemon-variant-details">
          <h3>Pokemon Variant</h3>
          <div className="pokemon-search-row">
            <input
              type="text"
              value={pokemon}
              onChange={handlePokemonChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter Pokemon name"
            />
            {suggestions.length > 0 && (
              <ul
                className="autocomplete-suggestions"
                onMouseDown={(event) => event.preventDefault()}
              >
                {suggestions.map((suggestion) => (
                  <li key={suggestion} onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="button-container">
            <button
              type="button"
              onClick={handleShinyChange}
              className={`shiny-button ${isShiny ? 'active' : ''}`}
            >
              <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
            </button>
            <button
              type="button"
              onClick={handleCostumeToggle}
              className={`costume-button ${showCostumeDropdown ? 'active' : ''}`}
            >
              <img src="/images/costume_icon.png" alt="Toggle Costume" />
            </button>
            <button
              type="button"
              onClick={handleShadowChange}
              className={`shadow-button ${isShadow ? 'active' : ''}`}
            >
              <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
            </button>
          </div>

          {availableForms.length > 0 && (
            <Dropdown
              label="Form"
              value={selectedForm}
              options={availableForms}
              handleChange={handleFormChange}
              formatLabel={formatForm}
              className="form-dropdown"
            />
          )}
          {showCostumeDropdown && availableCostumes.length > 0 && (
            <Dropdown
              label="Costume"
              value={costume}
              options={availableCostumes.map((entry) => entry.name)}
              handleChange={handleCostumeChange}
              formatLabel={formatCostumeName}
              className="costume-dropdown"
            />
          )}
        </div>

        <div className="pokemon-variant-image">
          {selectedBackground && (
            <div
              className="background-image"
              style={{ backgroundImage: `url(${selectedBackground.image_url})` }}
            />
          )}
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={pokemon}
              onError={handleImageError}
              className="pokemon-image"
            />
          ) : imageError ? (
            <div className="pokemon-variant-image-error">This variant doesn't exist.</div>
          ) : null}

          {dynamax && (
            <img
              src="/images/dynamax.png"
              alt="Dynamax Badge"
              className="max-badge"
            />
          )}
          {gigantamax && (
            <img
              src="/images/gigantamax.png"
              alt="Gigantamax Badge"
              className="max-badge"
            />
          )}
        </div>

        <div className="pokemon-moves-gender-section">
          <MovesSearch
            pokemon={currentPokemonData}
            selectedMoves={selectedMoves}
            onMovesChange={handleMovesChange}
          />

          <div className="gender-background-row">
            <Gender
              genderRate={currentPokemonData?.gender_rate}
              editMode={true}
              searchMode={true}
              onGenderChange={handleGenderChange}
            />
            {backgroundAllowed && (
              <div className="background-button-container">
                <img
                  src="/images/location.png"
                  alt="Background Selector"
                  className="background-button"
                  onClick={() => setShowBackgroundOverlay(true)}
                />
              </div>
            )}

            {canDynamax && (
              <img
                onClick={toggleMax}
                src={
                  gigantamax
                    ? '/images/gigantamax-icon.png'
                    : dynamax
                      ? '/images/dynamax-icon.png'
                      : '/images/dynamax-icon.png'
                }
                alt={
                  gigantamax
                    ? 'Gigantamax'
                    : dynamax
                      ? 'Dynamax'
                      : 'Dynamax (Desaturated)'
                }
                className={`max-icon ${!gigantamax && !dynamax ? 'desaturated' : ''}`}
                title={
                  gigantamax
                    ? 'Gigantamax'
                    : dynamax
                      ? 'Dynamax'
                      : 'Dynamax (Desaturated)'
                }
              />
            )}
          </div>
        </div>
      </div>

      {showBackgroundOverlay && (
        <div
          className="background-overlay"
          onClick={() => setShowBackgroundOverlay(false)}
        >
          <div
            className="background-overlay-content"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => setShowBackgroundOverlay(false)}
            >
              Close
            </button>
            <BackgroundLocationCard
              pokemon={currentPokemonData ?? {}}
              onSelectBackground={handleBackgroundChange}
              selectedCostumeId={selectedCostumeId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantSearch;
