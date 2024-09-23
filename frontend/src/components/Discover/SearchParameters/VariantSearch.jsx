// VariantSearch.jsx

import React, { useState, useEffect } from 'react';
import validatePokemon from '../utils/ValidatePokemon';
import { updateImage } from '../utils/updateImage';
import { formatCostumeName } from '../utils/formatCostumeName';
import Dropdown from '../components/Dropdown'; 
import useErrorHandler from '../hooks/useErrorHandler'; 
import './VariantSearch.css'; // Import the CSS file

const VariantSearch = ({ pokemon, setPokemon, isShiny, setIsShiny, isShadow, setIsShadow, costume, setCostume, selectedForm, setSelectedForm }) => {
  const { error, handleError, clearError } = useErrorHandler();
  const [availableForms, setAvailableForms] = useState([]);
  const [availableCostumes, setAvailableCostumes] = useState([]);
  const [pokemonData, setPokemonData] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false); // State for toggling costume dropdown

  // Load Pokémon data from localStorage
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

  const handleValidation = (name, shinyChecked, shadowChecked, selectedCostume, form) => {
    const { error, availableCostumes, availableForms } = validatePokemon(pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form);
    if (error) handleError(error);
    else clearError();

    const sortedCostumes = availableCostumes.sort((a, b) => new Date(a.date_available) - new Date(b.date_available));
    setAvailableCostumes(sortedCostumes);

    // Ensure "None" is included only if there are multiple valid forms
    const filteredForms = availableForms
      .filter((form) => form && form.trim().toLowerCase() !== '') // Remove empty or undefined forms
      .map((form) => (form.toLowerCase() === 'none' ? 'None' : form)); // Normalize form names

    setAvailableForms(filteredForms.length > 0 ? filteredForms : []);

    if (!error) {
      const url = updateImage(pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form);
      setImageUrl(url);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // Handlers
  const handlePokemonChange = (e) => {
    const newPokemon = e.target.value;
    setPokemon(newPokemon);
    setSelectedForm("");  // Reset form when Pokémon changes
    handleValidation(newPokemon, isShiny, isShadow, costume, "");
  };

  const handleShinyChange = () => {
    const shinyChecked = !isShiny;
    setIsShiny(shinyChecked);
    handleValidation(pokemon, shinyChecked, isShadow, costume, selectedForm);
  };

  const handleShadowChange = () => {
    const shadowChecked = !isShadow;
    setIsShadow(shadowChecked);
    handleValidation(pokemon, isShiny, shadowChecked, costume, selectedForm);
  };

  const handleCostumeToggle = () => {
    setShowCostumeDropdown(!showCostumeDropdown); // Toggle costume dropdown
    if (showCostumeDropdown) {
      setCostume('None'); // Reset costume to 'None' when toggled off
      handleValidation(pokemon, isShiny, isShadow, 'None', selectedForm);
    }
  };

  const handleCostumeChange = (e) => {
    setCostume(e.target.value);
    handleValidation(pokemon, isShiny, isShadow, e.target.value, selectedForm);
  };

  const handleFormChange = (e) => {
    setSelectedForm(e.target.value);  // Update selected form from dropdown
    handleValidation(pokemon, isShiny, isShadow, costume, e.target.value);
  };

  return (
    <div className="pokemon-variant-container">
      {/* Main Content Section */}
      <div className="main-content">
        <div className="pokemon-variant-details">
          <h3>Pokémon Variant</h3>

          <div className="pokemon-search-row"> {/* Added class for Pokémon search row */}
            <label>Pokémon: </label>
            <input
              type="text"
              value={pokemon}
              onChange={handlePokemonChange}
              placeholder="Enter Pokémon name"
            />
          </div>

          <div className="button-container">
            <button onClick={handleShinyChange} className={`shiny-button ${isShiny ? 'active' : ''}`}>
              <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
            </button>
            {/* Costume toggle button */}
            <button onClick={handleCostumeToggle} className={`costume-button ${showCostumeDropdown ? 'active' : ''}`}>
              <img src="/images/costume_icon.png" alt="Toggle Costume" />
            </button>
            <button onClick={handleShadowChange} className={`shadow-button ${isShadow ? 'active' : ''}`}>
              <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
            </button>
          </div>

          {/* Form Dropdown placed below the buttons */}
          {availableForms.length > 0 && (
            <Dropdown
              label="Form"
              value={selectedForm}  // Use selectedForm prop
              options={availableForms}
              handleChange={handleFormChange}
              className="form-dropdown" // Added className for form dropdown
            />
          )}

          {/* Costume Dropdown with Specific Class */}
          {showCostumeDropdown && availableCostumes.length > 0 && (
            <Dropdown
              label="Costume"
              value={costume}
              options={availableCostumes.map((costume) => costume.name)}
              handleChange={handleCostumeChange}
              formatLabel={formatCostumeName}
              className="costume-dropdown" // Added className for costume dropdown
            />
          )}
        </div>

        {/* Image Section */}
        <div className="pokemon-variant-image">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={pokemon}
              onError={handleImageError}
              style={{ width: '200px', height: '200px' }}
            />
          ) : imageError ? (
            <div className="pokemon-variant-image-error">
              This variant doesn't exist.
            </div>
          ) : null}
        </div>
      </div>

      {/* Validation error message row */}
      {error && (
        <div className="pokemon-variant-error-row">
          <div className="error-message">{error}</div>
        </div>
      )}
    </div>
  );
};

export default VariantSearch;