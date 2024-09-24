// VariantSearch.jsx

import React, { useState, useEffect } from 'react';
import validatePokemon from '../utils/ValidatePokemon';
import { updateImage } from '../utils/updateImage';
import { formatCostumeName } from '../utils/formatCostumeName';
import Dropdown from '../components/Dropdown';
import MovesSearch from '../components/MovesSearch';
import useErrorHandler from '../hooks/useErrorHandler';
import './VariantSearch.css';

const VariantSearch = ({ pokemon, setPokemon, isShiny, setIsShiny, isShadow, setIsShadow, costume, setCostume, selectedForm, setSelectedForm, selectedMoves, setSelectedMoves }) => {
  const { error, handleError, clearError } = useErrorHandler();
  const [availableForms, setAvailableForms] = useState([]);
  const [availableCostumes, setAvailableCostumes] = useState([]);
  const [pokemonData, setPokemonData] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [showCostumeDropdown, setShowCostumeDropdown] = useState(false);
  const [editMode, setEditMode] = useState(true);

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

    const filteredForms = availableForms
      .filter((form) => form && form.trim().toLowerCase() !== '')
      .map((form) => (form.toLowerCase() === 'none' ? 'None' : form));

    setAvailableForms(filteredForms.length > 0 ? filteredForms : []);

    if (!error) {
      const url = updateImage(pokemonData, name, shinyChecked, shadowChecked, selectedCostume, form);
      setImageUrl(url);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handlePokemonChange = (e) => {
    const newPokemon = e.target.value;
    if (newPokemon.length <= 11) {
      setPokemon(newPokemon);
      setSelectedForm("");
      handleValidation(newPokemon, isShiny, isShadow, costume, "");
    }
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
    const newShowCostumeDropdown = !showCostumeDropdown;
    setShowCostumeDropdown(newShowCostumeDropdown);

    if (!newShowCostumeDropdown) {
      setCostume('');
      clearError();
      handleValidation(pokemon, isShiny, isShadow, '', selectedForm);
      const defaultImageUrl = updateImage(pokemonData, pokemon, isShiny, isShadow, '', selectedForm);
      setImageUrl(defaultImageUrl);
    }
  };

  const handleCostumeChange = (e) => {
    const selectedCostume = e.target.value;
    setCostume(selectedCostume);
    handleValidation(pokemon, isShiny, isShadow, selectedCostume, selectedForm);
  };

  const handleFormChange = (e) => {
    setSelectedForm(e.target.value);
    handleValidation(pokemon, isShiny, isShadow, costume, e.target.value);
  };

  const handleMovesChange = (moves) => {
    setSelectedMoves(moves);
  };

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
              placeholder="Enter Pokémon name"
            />
          </div>

          <div className="button-container">
            <button onClick={handleShinyChange} className={`shiny-button ${isShiny ? 'active' : ''}`}>
              <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
            </button>
            <button onClick={handleCostumeToggle} className={`costume-button ${showCostumeDropdown ? 'active' : ''}`}>
              <img src="/images/costume_icon.png" alt="Toggle Costume" />
            </button>
            <button onClick={handleShadowChange} className={`shadow-button ${isShadow ? 'active' : ''}`}>
              <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
            </button>
          </div>

          {availableForms.length > 0 && (
            <Dropdown
              label="Form"
              value={selectedForm}
              options={availableForms}
              handleChange={handleFormChange}
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

        {pokemon && pokemonData.length > 0 && (
          <div className="pokemon-moves-section">
            <MovesSearch
              pokemon={pokemonData.find((p) => p.name.toLowerCase() === pokemon.toLowerCase())}
              selectedMoves={selectedMoves} // Use selectedMoves as a prop
              editMode={editMode}
              onMovesChange={handleMovesChange}
            />
          </div>
        )}
      </div>

      <div className="pokemon-variant-error-row">
        <div className="error-message">{error || "\u00A0"}</div>
      </div>

    </div>
  );
};

export default VariantSearch;