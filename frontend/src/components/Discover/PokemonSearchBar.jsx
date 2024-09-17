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
  const [selectedForm, setSelectedForm] = useState(''); // Add selectedForm state
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState('owned');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });

  const handleSearch = async () => {
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
          console.error('No results found for the location.');
        }
      } catch (error) {
        console.error('Error fetching GPS coordinates:', error);
        return;
      }
    }
  
    // Ensure pokemon is not empty
    if (!pokemon) {
      console.error('No Pokémon name provided.');
      return;
    }
  
    // Get Pokémon data from localStorage
    const storedData = localStorage.getItem('pokemonData');
    if (!storedData) {
      console.error('No Pokémon data found in local storage.');
      return;
    }
  
    const pokemonData = JSON.parse(storedData).data;
  
    // Check if pokemonData exists and find matching Pokémon based on name and form
    const matchingPokemon = pokemonData.find((p) => 
      p.name?.toLowerCase() === pokemon.toLowerCase() && 
      (!selectedForm || p.form?.toLowerCase() === selectedForm.toLowerCase())
    );
  
    if (!matchingPokemon) {
      console.error('No matching Pokémon found.');
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
    };
  
    console.log('API request parameters:', queryParams);
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
        />

        <OwnershipSearch
          ownershipStatus={ownershipStatus}
          setOwnershipStatus={setOwnershipStatus}
        />
      </div>

      <div className="search-button">
        <button onClick={handleSearch}>Search</button>
      </div>
    </div>
  );
};

export default PokemonSearchBar;