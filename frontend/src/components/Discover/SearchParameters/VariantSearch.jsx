// VariantSearch.jsx

import React, { useState, useEffect } from 'react';
import validatePokemon from '../utils/ValidatePokemon';

const VariantSearch = ({ pokemon, setPokemon, isShiny, setIsShiny, isShadow, setIsShadow, costume, setCostume }) => {
  const [error, setError] = useState(null);
  const [availableCostumes, setAvailableCostumes] = useState([]);
  const [pokemonData, setPokemonData] = useState([]);
  const [imageUrl, setImageUrl] = useState(null); // Store the image URL
  const [imageError, setImageError] = useState(false); // Handle image error state

  // Load Pokémon data from localStorage
  useEffect(() => {
    const storedData = localStorage.getItem('pokemonData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData && parsedData.data) {
        setPokemonData(parsedData.data);
      } else {
        setError('No valid Pokémon data found.');
      }
    } else {
      setError('No Pokémon data found in local storage.');
    }
  }, []);

  const handleValidation = (name, shinyChecked, shadowChecked, selectedCostume) => {
    const { error, availableCostumes } = validatePokemon(pokemonData, name, shinyChecked, shadowChecked, selectedCostume);
    setError(error);

    // Sort the costumes by date_available before setting them
    const sortedCostumes = availableCostumes.sort((a, b) => new Date(a.date_available) - new Date(b.date_available));
    setAvailableCostumes(sortedCostumes);

    // Update image URL based on conditions
    if (!error) {
      updateImage(name, shinyChecked, shadowChecked, selectedCostume);
    }
  };

  const updateImage = (name, shinyChecked, shadowChecked, selectedCostume) => {
    const matchedPokemon = pokemonData.find(
      (variant) => variant.name.toLowerCase() === name.toLowerCase()
    );

    if (matchedPokemon) {
      let url = matchedPokemon.image_url;

      // Handle both shiny and shadow selected
      if (shinyChecked && shadowChecked) {
        if (matchedPokemon.shadow_shiny_available) {
          url = matchedPokemon.image_url_shiny_shadow || matchedPokemon.image_url_shiny;
        } else {
          url = matchedPokemon.image_url_shadow;
        }
      } else if (shinyChecked) {
        url = matchedPokemon.image_url_shiny;
      } else if (shadowChecked) {
        url = matchedPokemon.image_url_shadow;
      }

      // If a costume is selected and it's not "None"
      if (selectedCostume && selectedCostume !== "") {
        const selectedCostumeData = matchedPokemon.costumes.find((costume) => costume.name === selectedCostume);
        if (selectedCostumeData) {
          if (shinyChecked) {
            url = selectedCostumeData.image_url_shiny || selectedCostumeData.image_url;
          } else if (shadowChecked) {
            url = selectedCostumeData.image_url_shadow || selectedCostumeData.image_url;
          } else {
            url = selectedCostumeData.image_url;
          }
        }
      }

      setImageError(false); // Reset image error state
      setImageUrl(url); // Set the appropriate image URL
    }
  };

  const handleImageError = () => {
    setImageError(true); // Set the error state if the image fails to load
  };

  // Handlers
  const handlePokemonChange = (e) => {
    const newPokemon = e.target.value;
    setPokemon(newPokemon);
    handleValidation(newPokemon, isShiny, isShadow, costume);
  };

  const handleShinyChange = (e) => {
    const shinyChecked = e.target.checked;
    setIsShiny(shinyChecked);
    handleValidation(pokemon, shinyChecked, isShadow, costume);
  };

  const handleShadowChange = (e) => {
    const shadowChecked = e.target.checked;
    setIsShadow(shadowChecked);
    handleValidation(pokemon, isShiny, shadowChecked, costume);
  };

  const handleCostumeChange = (e) => {
    setCostume(e.target.value);
    handleValidation(pokemon, isShiny, isShadow, e.target.value);
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
      <div>
        <label>Costume: </label>
        <select value={costume} onChange={handleCostumeChange}>
          <option value="">None</option>
          {/* Dynamically populate costume options */}
          {availableCostumes.map((costume) => (
            <option key={costume.costume_id} value={costume.name}>
              {costume.name.charAt(0).toUpperCase() + costume.name.slice(1)} {/* Capitalize the costume name */}
            </option>
          ))}
        </select>
      </div>

      {/* Error message display */}
      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      {/* Pokémon Image Display */}
      {imageUrl && !imageError ? (
        <div style={{ marginTop: '20px' }}>
          <img
            src={imageUrl}
            alt={pokemon}
            style={{ width: '200px', height: '200px' }}
            onError={handleImageError} // Handle error if image doesn't load
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