// PokemonSearchBar.jsx

import React, { useState } from 'react';
import VariantSearch from './SearchParameters/VariantSearch';
import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';
import './PokemonSearchBar.css';
import axios from 'axios';

const PokemonSearchBar = ({ onSearch, isLoading, setErrorMessage, view, setView }) => {
  const [pokemon, setPokemon] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [isShadow, setIsShadow] = useState(false);
  const [costume, setCostume] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [city, setCity] = useState(''); // Replaced with 'location'
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState('trade');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [range, setRange] = useState(5); // Default range
  const [resultsLimit, setResultsLimit] = useState(5); // Default limit for results

  const handleSearch = async () => {
    setErrorMessage(''); // Clear previous error messages

    // Validation checks
    if (!pokemon) {
      setErrorMessage('Please provide a Pokémon name.');
      return;
    }

    if (!useCurrentLocation && !city) {
      setErrorMessage('Please provide a location or use your current location.');
      return;
    }

    let locationCoordinates = coordinates;

    // If not using current location, get coordinates based on city
    if (!useCurrentLocation) {
      try {
        const query = city;
        const response = await axios.get(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`,
          { withCredentials: false }  // Disable credentials for CORS compatibility
        );

        if (response.data?.features?.length > 0) {
          const [lon, lat] = response.data.features[0].geometry.coordinates;
          locationCoordinates = { latitude: lat, longitude: lon };
        } else {
          setErrorMessage('No results found for the location.');
          return;
        }
      } catch (error) {
        setErrorMessage('Error fetching GPS coordinates. Please try again.');
        return;
      }
    }

    // Get Pokémon data from localStorage
    const storedData = localStorage.getItem('pokemonData');
    if (!storedData) {
      setErrorMessage('No Pokémon data found in local storage.');
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
      latitude: locationCoordinates.latitude,
      longitude: locationCoordinates.longitude,
      ownership: ownershipStatus,
      range_km: range,        // Include the range in kilometers
      limit: resultsLimit,    // Include the selected limit for the number of results
    };

    // Log the prepared query parameters before sending them to the parent component
    console.log('Search Query Parameters:', queryParams);

    // Pass query parameters to parent component's search handler
    onSearch(queryParams);
  };

  return (
    <div className="pokemon-search-bar">
      <div className="search-bar-container">
        <div className="pokemon-variant">
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
        </div>

        <div className="location-search">
          <LocationSearch
            city={city}
            setCity={setCity}
            useCurrentLocation={useCurrentLocation}
            setUseCurrentLocation={setUseCurrentLocation}
            setCoordinates={setCoordinates}
            range={range}  // Pass the range to LocationSearch
            setRange={setRange}  // Pass the setter for range to LocationSearch
            resultsLimit={resultsLimit} // Pass the results limit to LocationSearch
            setResultsLimit={setResultsLimit} // Pass the setter for results limit
            handleSearch={handleSearch}  // Pass handleSearch function to LocationSearch
            isLoading={isLoading}  // Pass loading state to LocationSearch
            view={view}  // Pass the view state to LocationSearch
            setView={setView}  // Pass the setter for view state to LocationSearch
          />
        </div>

        <div className="ownership-status">
          <OwnershipSearch
            ownershipStatus={ownershipStatus}
            setOwnershipStatus={setOwnershipStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default PokemonSearchBar;