// VariantSearch.jsx

import React, { useState, useEffect } from 'react';
import validatePokemon from '../utils/validatePokemon';
import { updateImage } from '../utils/updateImage';
import { formatCostumeName } from '../utils/formatCostumeName';
import Dropdown from '../components/Dropdown';
import MovesSearch from './VariantComponents/MovesSearch';
import GenderSearch from './VariantComponents/GenderSearch';
import BackgroundSearch from './VariantComponents/BackgroundSearch';
import useErrorHandler from '../hooks/useErrorHandler';
import './VariantSearch.css';
import { formatForm } from '../../../utils/formattingHelpers';

// Removed: IndexedDB helper import
// import { getAllPokedexListsFromDB } from '../../../services/indexedDB';

const VariantSearch = ({
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
  pokemonCache // Passed in default Pokémon list
}) => {
  const { error, handleError, clearError } = useErrorHandler();
  const [availableForms, setAvailableForms] = useState([]);
  const [availableCostumes, setAvailableCostumes] = useState([]);
  
  // Instead of fetching from IndexedDB, we use the passed pokemonCache prop.
  const [pokemonData, setPokemonData] = useState(pokemonCache || []);

  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [showBackgroundOverlay, setShowBackgroundOverlay] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Update local state whenever pokemonCache prop changes
  useEffect(() => {
    setPokemonData(pokemonCache || []);
  }, [pokemonCache]);

  // Determine current Pokémon data from user input
  const currentPokemonData = pokemonData.find(
    (p) => p.name.toLowerCase() === (pokemon || '').toLowerCase()
  );

  // If your data includes "max" fields for Dynamax/Gigantamax:
  const hasDynamax = currentPokemonData?.max?.some((max) => max.dynamax === 1) || false;
  const hasGigantamax = currentPokemonData?.max?.some((max) => max.gigantamax === 1) || false;

  const toggleMax = () => {
    if (!dynamax && !gigantamax) {
      // Start with Dynamax if available, else Gigantamax
      if (hasDynamax) {
        setDynamax(true);
      } else if (hasGigantamax) {
        setGigantamax(true);
      }
    } else if (dynamax) {
      // Switch from Dynamax to Gigantamax
      if (hasGigantamax) {
        setDynamax(false);
        setGigantamax(true);
      } else {
        setDynamax(false);
      }
    } else if (gigantamax) {
      // Reset Gigantamax
      setGigantamax(false);
    }
  };

  // The existing validation logic
  const handleValidation = (
    name,
    shinyChecked,
    shadowChecked,
    selectedCostume,
    form,
    selectedGender,
    dynamaxEnabled,
    gigantamaxEnabled
  ) => {
    const { error, availableCostumes, availableForms } = validatePokemon(
      pokemonData,
      name,
      shinyChecked,
      shadowChecked,
      selectedCostume,
      form,
      dynamaxEnabled,
      gigantamaxEnabled
    );
    if (error) {
      handleError(error);
      setErrorMessage(error);
    } else {
      clearError();
      setErrorMessage(null);
    }

    const sortedCostumes = availableCostumes.sort(
      (a, b) => new Date(a.date_available) - new Date(b.date_available)
    );
    setAvailableCostumes(sortedCostumes);

    const filteredForms = availableForms
      .filter((form) => form && form.trim().toLowerCase() !== '')
      .map((form) => (form.toLowerCase() === 'none' ? 'None' : form));
    setAvailableForms(filteredForms.length > 0 ? filteredForms : []);

    if (!error) {
      const url = updateImage(
        pokemonData,
        name,
        shinyChecked,
        shadowChecked,
        selectedCostume,
        form,
        selectedGender,
        gigantamaxEnabled
      );
      setImageUrl(url);
      setImageError(false);
    }
  };

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
  };

  // Revalidate when these states change
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
        gigantamax
      );
    }
    // eslint-disable-next-line
  }, [selectedGender, isShiny, isShadow, costume, selectedForm, dynamax, gigantamax]);

  const handleBackgroundChange = (background) => {
    setSelectedBackground(background);
    setSelectedBackgroundId(background ? background.background_id : null);
    setShowBackgroundOverlay(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePokemonChange = (e) => {
    const newPokemon = e.target.value;
    if (newPokemon.length <= 11) {
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

      // Auto-suggestions for 3+ chars
      if (newPokemon.length >= 3) {
        const filtered = Array.from(
          new Set(
            pokemonData
              .filter((p) =>
                p.name.toLowerCase().startsWith(newPokemon.toLowerCase())
              )
              .map((p) => p.name)
          )
        );
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
      } else {
        handleValidation(
          newPokemon,
          isShiny,
          isShadow,
          costume,
          '',
          selectedGender,
          dynamax,
          gigantamax
        );
      }
    }
  };

  const handleInputFocus = () => {
    if (pokemon && pokemon.length >= 3) {
      const filtered = Array.from(
        new Set(
          pokemonData
            .filter((pItem) =>
              pItem.name.toLowerCase().startsWith(pokemon.toLowerCase())
            )
            .map((pItem) => pItem.name)
        )
      );
      setSuggestions(filtered);
    }
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
      gigantamax
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
      gigantamax
    );
  };

  const handleCostumeToggle = () => {
    const newShow = !showCostumeDropdown;
    setShowCostumeDropdown(newShow);
    if (!newShow) {
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
        gigantamax
      );
      const defaultImg = updateImage(
        pokemonData,
        pokemon,
        isShiny,
        isShadow,
        '',
        selectedForm,
        selectedGender,
        dynamax,
        gigantamax
      );
      setImageUrl(defaultImg);
      setImageError(false);
    }
  };

  const handleCostumeChange = (e) => {
    const selectedCostume = e.target.value;
    setCostume(selectedCostume);
    handleValidation(
      pokemon,
      isShiny,
      isShadow,
      selectedCostume,
      selectedForm,
      selectedGender,
      dynamax,
      gigantamax
    );
  };

  const handleFormChange = (e) => {
    setSelectedForm(e.target.value);
    handleValidation(
      pokemon,
      isShiny,
      isShadow,
      costume,
      e.target.value,
      selectedGender,
      dynamax,
      gigantamax
    );
  };

  const handleMovesChange = (moves) => {
    setSelectedMoves(moves);
  };

  const handleSuggestionClick = (suggestion) => {
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
      gigantamax
    );
  };

  // Helper to check if backgrounds are allowed for the current selection
  const isBackgroundAllowed = () => {
    if (!currentPokemonData || !currentPokemonData.backgrounds) return false;
    if (!costume) {
      return currentPokemonData.backgrounds.some(
        (bg) => bg.costume_id === null
      );
    }
    const selectedCostumeId = availableCostumes.find((c) => c.name === costume)?.costume_id;
    return currentPokemonData.backgrounds.some(
      (bg) => bg.costume_id === selectedCostumeId || bg.costume_id === null
    );
  };

  const selectedCostumeId = availableCostumes.find((c) => c.name === costume)?.costume_id;
  const canDynamax = hasDynamax || hasGigantamax;

  return (
    <div className="pokemon-variant-container">
      <div className="main-content">
        <div className="pokemon-variant-details">
          <h3>Pokémon Variant</h3>
          <div className="pokemon-search-row">
            <input
              type="text"
              value={pokemon}
              onChange={handlePokemonChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Enter Pokémon name"
            />
            {suggestions.length > 0 && (
              <ul
                className="autocomplete-suggestions"
                onMouseDown={(e) => e.preventDefault()} 
              >
                {suggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="button-container">
            <button
              onClick={handleShinyChange}
              className={`shiny-button ${isShiny ? 'active' : ''}`}
            >
              <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
            </button>
            <button
              onClick={handleCostumeToggle}
              className={`costume-button ${showCostumeDropdown ? 'active' : ''}`}
            >
              <img src="/images/costume_icon.png" alt="Toggle Costume" />
            </button>
            <button
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
              options={availableCostumes.map((c) => c.name)}
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
            ></div>
          )}
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={pokemon}
              onError={handleImageError}
              className="pokemon-image"
            />
          ) : imageError ? (
            <div className="pokemon-variant-image-error">
              This variant doesn't exist.
            </div>
          ) : null}

          {dynamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/dynamax.png'} 
              alt="Dynamax Badge" 
              className="max-badge" 
            />
          )}
          {gigantamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/gigantamax.png'} 
              alt="Gigantamax Badge" 
              className="max-badge" 
            />
          )}
        </div>

        <div className="pokemon-moves-gender-section">
          <MovesSearch
            pokemon={
              currentPokemonData ||
              { moves: [{ name: 'Any Move', move_id: 0 }] }
            }
            selectedMoves={selectedMoves}
            onMovesChange={handleMovesChange}
          />

          <div className="gender-background-row">
            <GenderSearch
              genderRate={currentPokemonData ? currentPokemonData.gender_rate : null}
              selectedGender={selectedGender}
              onGenderChange={handleGenderChange}
            />

            {isBackgroundAllowed() && (
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
                alt={gigantamax ? 'Gigantamax' : dynamax ? 'Dynamax' : 'Dynamax (Desaturated)'}
                className={`max-icon ${!gigantamax && !dynamax ? 'desaturated' : ''}`}
                title={gigantamax ? 'Gigantamax' : dynamax ? 'Dynamax' : 'Dynamax (Desaturated)'}
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
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setShowBackgroundOverlay(false)}
            >
              Close
            </button>
            <BackgroundSearch
              pokemon={currentPokemonData}
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