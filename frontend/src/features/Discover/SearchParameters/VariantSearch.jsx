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
import { formatForm } from '../../../utils/formattingHelpers'

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
}) => {
  const { error, handleError, clearError } = useErrorHandler();
  const [availableForms, setAvailableForms] = useState([]);
  const [availableCostumes, setAvailableCostumes] = useState([]);
  const [pokemonData, setPokemonData] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null); // State for selected background
  const [showBackgroundOverlay, setShowBackgroundOverlay] = useState(false); // State for overlay visibility
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const storedData = localStorage.getItem('pokemonData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData && parsedData.data) {
        setPokemonData(parsedData.data);
      } else {
        handleError('No valid Pokémon data found.');
      }
    } else {
      handleError('No Pokémon data found in local storage.');
    }
  }, []);

  const handleValidation = (name, shinyChecked, shadowChecked, selectedCostume, form, selectedGender) => {
    const { error, availableCostumes, availableForms } = validatePokemon(
      pokemonData,
      name,
      shinyChecked,
      shadowChecked,
      selectedCostume,
      form
    );
    if (error) {
      handleError(error);
      setErrorMessage(error); // Pass error message to parent
    } else {
      clearError();
      setErrorMessage(null); // Clear error message in parent
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
      // Update image with selectedGender as a parameter
      const url = updateImage(pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form, selectedGender);
      setImageUrl(url);
      setImageError(false); // Reset the image error when updating the image URL
    }
  };

  const handleGenderChange = (gender) => {
    setSelectedGender(gender); // Update the selectedGender state
  };

  // Use effect to trigger validation when selectedGender changes
  useEffect(() => {
    // Only call handleValidation if a Pokémon is selected
    if (pokemon) {
      handleValidation(pokemon, isShiny, isShadow, costume, selectedForm, selectedGender);
    }
  }, [selectedGender, isShiny, isShadow, costume, selectedForm]);

  const handleBackgroundChange = (background) => {
    setSelectedBackground(background);
    setSelectedBackgroundId(background ? background.background_id : null); // Pass the background_id or null to the parent
    setShowBackgroundOverlay(false); // Hide the overlay when a background is selected
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePokemonChange = (e) => {
    const newPokemon = e.target.value;
    if (newPokemon.length <= 11) {
      setPokemon(newPokemon);
      setSelectedForm('');
      setSelectedGender('Any'); // Reset gender only if new Pokémon is selected.
  
      // Reset selected moves when a new Pokémon is selected
      setSelectedMoves({
        fastMove: null,
        chargedMove1: null,
        chargedMove2: null,
      });
  
      // Generate suggestions if input is 3 or more characters
      if (newPokemon.length >= 3) {
        // Use a Set to ensure unique suggestions
        const filteredSuggestions = Array.from(
          new Set(
            pokemonData
              .filter(pokemon => pokemon.name.toLowerCase().startsWith(newPokemon.toLowerCase()))
              .map(pokemon => pokemon.name)
          )
        );
        setSuggestions(filteredSuggestions);
      } else {
        setSuggestions([]); // Clear suggestions if fewer than 3 characters
      }
  
      if (newPokemon.trim() === "") {
        // Clear the image, costume, background, and any other states when the input is empty
        setImageUrl(null);
        setAvailableForms([]);
        setAvailableCostumes([]);
        setCostume(null); // Reset costume to null
        setSelectedBackground(null); // Reset background to null
      } else {
        handleValidation(newPokemon, isShiny, isShadow, costume, '', selectedGender); // Pass selectedGender
      }
    }
  };
  
  const handleInputFocus = () => {
    // Show suggestions again if any exist
    if (pokemon && pokemon.length >= 3) {
      const filteredSuggestions = Array.from(
        new Set(
          pokemonData
            .filter(pokemonItem => pokemonItem.name.toLowerCase().startsWith(pokemon.toLowerCase()))
            .map(pokemonItem => pokemonItem.name)
        )
      );
      setSuggestions(filteredSuggestions);
    }
  };  
  
  const handleInputBlur = () => {
    // Hide suggestions when the input loses focus
    setSuggestions([]);
  };
   

  const handleShinyChange = () => {
    const shinyChecked = !isShiny;
    setIsShiny(shinyChecked);
    handleValidation(pokemon, shinyChecked, isShadow, costume, selectedForm, selectedGender); // Pass selectedGender
  };  

  const handleShadowChange = () => {
    const shadowChecked = !isShadow;
    setIsShadow(shadowChecked);
    handleValidation(pokemon, isShiny, shadowChecked, costume, selectedForm, selectedGender); // Pass selectedGender
  };

  const handleCostumeToggle = () => {
    const newShowCostumeDropdown = !showCostumeDropdown;
    setShowCostumeDropdown(newShowCostumeDropdown);

    if (!newShowCostumeDropdown) {
      setCostume(null); // Reset costume to null
      clearError();
      handleValidation(pokemon, isShiny, isShadow, '', selectedForm);
      const defaultImageUrl = updateImage(pokemonData, pokemon, isShiny, isShadow, '', selectedForm);
      setImageUrl(defaultImageUrl);
      setImageError(false); // Reset the image error when toggling costume dropdown
    }
  };

  const handleCostumeChange = (e) => {
    const selectedCostume = e.target.value;
    setCostume(selectedCostume);
    handleValidation(pokemon, isShiny, isShadow, selectedCostume, selectedForm, selectedGender); // Pass selectedGender
  };

  const handleFormChange = (e) => {
    setSelectedForm(e.target.value);
    handleValidation(pokemon, isShiny, isShadow, costume, e.target.value, selectedGender); // Pass selectedGender
  };

  const handleMovesChange = (moves) => {
    setSelectedMoves(moves);
  };

  const handleSuggestionClick = (suggestion) => {
    setPokemon(suggestion);
    setSuggestions([]); // Clear suggestions after selection
    handleValidation(suggestion, isShiny, isShadow, costume, selectedForm, selectedGender);
  };  

  // Get the current Pokémon data based on the entered name
  const currentPokemonData = pokemonData.find(
    (p) => p.name.toLowerCase() === (pokemon || '').toLowerCase()
  );

  // Check if the selected costume allows backgrounds or if the backgrounds have null costume_id
  const isBackgroundAllowed = () => {
    if (!currentPokemonData || !currentPokemonData.backgrounds) return false;
    if (!costume) {
      // If no costume is selected, allow backgrounds with null costume_id
      return currentPokemonData.backgrounds.some((background) => background.costume_id === null);
    }
    const selectedCostumeId = availableCostumes.find((c) => c.name === costume)?.costume_id;
    return currentPokemonData.backgrounds.some(
      (background) =>
        background.costume_id === selectedCostumeId || background.costume_id === null
    );
  };

  // Retrieve the costume ID for the currently selected costume
  const selectedCostumeId = availableCostumes.find(c => c.name === costume)?.costume_id;

  return (
    <div className="pokemon-variant-container">
      <div className="main-content">
        {/* Fixed Width Column for Details */}
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
              onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking a suggestion
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
              options={availableCostumes.map((costume) => costume.name)}
              handleChange={handleCostumeChange}
              formatLabel={formatCostumeName}
              className="costume-dropdown"
            />
          )}
        </div>
  
        {/* Fixed Width Column for Image */}
        <div className="pokemon-variant-image">
          {selectedBackground && (
            <div className="background-image" style={{ backgroundImage: `url(${selectedBackground.image_url})` }}></div>
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
        </div>
  
        {/* Fixed Width Column for Moves, Gender, and Background */}
        <div className="pokemon-moves-gender-section">
          <MovesSearch
            pokemon={currentPokemonData || { moves: [{ name: 'Any Move', move_id: 0 }] }} // Always pass default moves even if no Pokémon is selected
            selectedMoves={selectedMoves}
            onMovesChange={handleMovesChange}
          />

            {/* Container for Gender and Background Search */}
            <div className="gender-background-row">
              {/* Gender Search Component */}
              <GenderSearch
                genderRate={currentPokemonData ? currentPokemonData.gender_rate : null}
                selectedGender={selectedGender} // Pass the current selectedGender state
                onGenderChange={handleGenderChange} // Pass handleGenderChange to GenderSearch
              />
              {/* Background Button to Open Overlay */}
              {isBackgroundAllowed() && (
                <div className="background-button-container">
                  <img
                    src="/images/location.png" // Use location.png for the background button
                    alt="Background Selector"
                    className="background-button"
                    onClick={() => setShowBackgroundOverlay(true)}
                  />
                </div>
              )}
            </div>
          </div>
      </div>

      {/* Background Overlay */}
      {showBackgroundOverlay && (
        <div className="background-overlay" onClick={() => setShowBackgroundOverlay(false)}>
          <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowBackgroundOverlay(false)}>Close</button>
            <BackgroundSearch
              pokemon={currentPokemonData}
              onSelectBackground={handleBackgroundChange}
              selectedCostumeId={selectedCostumeId} // Pass the costume ID to BackgroundSearch
            />
          </div>
        </div>
      )}
    </div>
  );  
};

export default VariantSearch;