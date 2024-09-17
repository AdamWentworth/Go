// PokemonSearchBar.jsx

import React, { useState } from 'react';
import VariantSearch from './SearchParameters/VariantSearch';
import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';
import './PokemonSearchBar.css';
import axios from 'axios';

const PokemonSearchBar = () => {
  const [pokemon, setPokemon] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [isShadow, setIsShadow] = useState(false);
  const [costume, setCostume] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState('trade');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [range, setRange] = useState(5); // Default range
  const [resultsLimit, setResultsLimit] = useState(5); // Default limit for results
  const [errorMessage, setErrorMessage] = useState(''); // To store error messages
  const [isLoading, setIsLoading] = useState(false); // To prevent spamming the search button

  const handleSearch = async () => {
    setErrorMessage(''); // Clear previous error messages
    setIsLoading(true); // Disable the button during request

    // Validation checks
    if (!pokemon) {
      setErrorMessage('Please provide a Pokémon name.');
      setIsLoading(false);
      return;
    }

    if (!useCurrentLocation && (!city || !country)) {
      setErrorMessage('Please provide a city and country or use your current location.');
      setIsLoading(false);
      return;
    }

    let locationCoordinates = coordinates;

    // If not using current location, get coordinates based on city and country
    if (!useCurrentLocation) {
      try {
        const query = `${city}, ${country}`;
        const response = await axios.get(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`,
          { withCredentials: false }  // Disable credentials for CORS compatibility
        );

        if (response.data?.features?.length > 0) {
          const [lon, lat] = response.data.features[0].geometry.coordinates;
          locationCoordinates = { latitude: lat, longitude: lon };
        } else {
          setErrorMessage('No results found for the location.');
          setIsLoading(false);
          return;
        }
      } catch (error) {
        setErrorMessage('Error fetching GPS coordinates. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Get Pokémon data from localStorage
    const storedData = localStorage.getItem('pokemonData');
    if (!storedData) {
      setErrorMessage('No Pokémon data found in local storage.');
      setIsLoading(false);
      return;
    }

    const pokemonData = JSON.parse(storedData).data;

    // Check if pokemonData exists and find matching Pokémon based on name and form
    const matchingPokemon = pokemonData.find((p) => 
      p.name?.toLowerCase() === pokemon.toLowerCase() && 
      (!selectedForm || p.form?.toLowerCase() === selectedForm.toLowerCase())
    );

    if (!matchingPokemon) {
      setErrorMessage('No matching Pokémon found.');
      setIsLoading(false);
      return;
    }

    const { pokemon_id } = matchingPokemon;  // Get the matching Pokémon ID

    // Find the costume_id based on the selected costume
    const matchingCostume = matchingPokemon.costumes?.find(c => c.name === costume);
    const costume_id = matchingCostume ? matchingCostume.costume_id : null;

    // Prepare API request parameters
    const queryParams = {
      pokemon_id,
      shiny: isShiny,
      shadow: isShadow,
      costume_id,  // This could be null if no costume is selected
      location: {
        latitude: locationCoordinates.latitude,
        longitude: locationCoordinates.longitude,
      },
      ownership: ownershipStatus,
      range_km: range,  // Include the range in kilometers
      limit: resultsLimit  // Include the selected limit for the number of results
    };

    console.log('API request parameters:', queryParams);

    setIsLoading(false); // Re-enable the search button after the request
  };

  return (
    <div className="pokemon-search-bar">
      <div className="search-bar-container">
        <VariantSearch
          pokemon={pokemon}
          setPokemon={setPokemon}
          isShiny={isShiny}
          setIsShiny={setIsShiny}
          isShadow={isShadow}
          setIsShadow={setIsShadow}
          costume={costume}
          setCostume={setCostume}
          selectedForm={selectedForm}  // Pass selectedForm state to VariantSearch
          setSelectedForm={setSelectedForm}  // Pass the setter for the form
        />

        <LocationSearch
          country={country}
          setCountry={setCountry}
          city={city}
          setCity={setCity}
          useCurrentLocation={useCurrentLocation}
          setUseCurrentLocation={setUseCurrentLocation}
          setCoordinates={setCoordinates}
          range={range}  // Pass the range to LocationSearch
          setRange={setRange}  // Pass the setter for range to LocationSearch
        />

        <OwnershipSearch
          ownershipStatus={ownershipStatus}
          setOwnershipStatus={setOwnershipStatus}
        />

        {/* Dropdown to select the number of results */}
        <div className="results-limit">
          <label htmlFor="results-limit">Results Limit:</label>
          <select
            id="results-limit"
            value={resultsLimit}
            onChange={(e) => setResultsLimit(parseInt(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="search-button-container">
        <button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        {/* Add class conditionally to control visibility */}
        <div className={`error-message ${errorMessage ? 'error-visible' : ''}`}>
          {errorMessage}
        </div>
      </div>
    </div>
  );
};

export default PokemonSearchBar;