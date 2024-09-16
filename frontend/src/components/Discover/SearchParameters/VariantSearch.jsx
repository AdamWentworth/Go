// VariantSearch.jsx

import React, { useState, useEffect } from 'react';
import validatePokemon from '../utils/ValidatePokemon';
import { updateImage } from '../utils/updateImage';
import { formatCostumeName } from '../utils/formatCostumeName';
import Dropdown from '../components/Dropdown'; 
import useErrorHandler from '../hooks/useErrorHandler'; 

const VariantSearch = ({ pokemon, setPokemon, isShiny, setIsShiny, isShadow, setIsShadow, costume, setCostume }) => {
  const { error, handleError, clearError } = useErrorHandler();
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState("");
  const [availableCostumes, setAvailableCostumes] = useState([]);
  const [pokemonData, setPokemonData] = useState([]);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

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

    // Sort the available costumes by date_available before setting them
    const sortedCostumes = availableCostumes.sort((a, b) => new Date(a.date_available) - new Date(b.date_available));
    setAvailableCostumes(sortedCostumes);

    // Filter out any null or "None" form values
    const filteredForms = availableForms.filter((form) => form && form.toLowerCase() !== "none");
    setAvailableForms(filteredForms || []);

    // Update image URL based on conditions
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
    setSelectedForm("");
    handleValidation(newPokemon, isShiny, isShadow, costume, "");
  };

  const handleShinyChange = (e) => {
    const shinyChecked = e.target.checked;
    setIsShiny(shinyChecked);
    handleValidation(pokemon, shinyChecked, isShadow, costume, selectedForm);
  };

  const handleShadowChange = (e) => {
    const shadowChecked = e.target.checked;
    setIsShadow(shadowChecked);
    handleValidation(pokemon, isShiny, shadowChecked, costume, selectedForm);
  };

  const handleCostumeChange = (e) => {
    setCostume(e.target.value);
    handleValidation(pokemon, isShiny, isShadow, e.target.value, selectedForm);
  };

  const handleFormChange = (e) => {
    setSelectedForm(e.target.value);
    handleValidation(pokemon, isShiny, isShadow, costume, e.target.value);
  };

  return (
    <div className="pokemon-variant">
      <h3>Pokémon Variant</h3>

      {/* Pokémon name input */}
      <div>
        <label>Pokémon: </label>
        <input
          type="text"
          value={pokemon}
          onChange={handlePokemonChange}
          placeholder="Enter Pokémon name"
        />
      </div>

      {/* Form dropdown (always visible) */}
      <Dropdown
        label="Form"
        value={selectedForm}
        options={availableForms}
        handleChange={handleFormChange}
      />

      {/* Shiny checkbox */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={isShiny}
            onChange={handleShinyChange}
          />
          Shiny
        </label>
      </div>

      {/* Shadow checkbox */}
      <div>
        <label>
          <input
            type="checkbox"
            checked={isShadow}
            onChange={handleShadowChange}
          />
          Shadow
        </label>
      </div>

      {/* Costume dropdown */}
      <Dropdown
        label="Costume"
        value={costume}
        options={availableCostumes.map((costume) => costume.name)}
        handleChange={handleCostumeChange}
        formatLabel={formatCostumeName}
      />

      {/* Error message display */}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      {/* Pokémon Image Display */}
      {imageUrl && !imageError ? (
        <div style={{ marginTop: '20px' }}>
          <img
            src={imageUrl}
            alt={pokemon}
            style={{ width: '200px', height: '200px' }}
            onError={handleImageError}
          />
        </div>
      ) : imageError ? (
        <div style={{ marginTop: '20px', color: 'red' }}>
          This variant doesn't exist.
        </div>
      ) : null}
    </div>
  );
};

export default VariantSearch;