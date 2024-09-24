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
  const [selectedMoves, setSelectedMoves] = useState({ fastMove: null, chargedMove1: null, chargedMove2: null });
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState('trade');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [range, setRange] = useState(5);
  const [resultsLimit, setResultsLimit] = useState(5);

  const handleSearch = async () => {
    setErrorMessage('');

    if (!pokemon) {
      setErrorMessage('Please provide a Pokémon name.');
      return;
    }

    if (!useCurrentLocation && !city) {
      setErrorMessage('Please provide a location or use your current location.');
      return;
    }

    let locationCoordinates = coordinates;

    if (!useCurrentLocation) {
      try {
        const query = city;
        const response = await axios.get(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`,
          { withCredentials: false }
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

    const storedData = localStorage.getItem('pokemonData');
    if (!storedData) {
      setErrorMessage('No Pokémon data found in local storage.');
      return;
    }

    const pokemonData = JSON.parse(storedData).data;

    const matchingPokemon = pokemonData.find((p) => 
      p.name?.toLowerCase() === pokemon.toLowerCase() && 
      (!selectedForm || p.form?.toLowerCase() === selectedForm.toLowerCase())
    );

    if (!matchingPokemon) {
      setErrorMessage('No matching Pokémon found.');
      return;
    }

    const { pokemon_id } = matchingPokemon;

    const matchingCostume = matchingPokemon.costumes?.find(c => c.name === costume);
    const costume_id = matchingCostume ? matchingCostume.costume_id : null;

    const queryParams = {
      pokemon_id,
      shiny: isShiny,
      shadow: isShadow,
      costume_id,
      fast_move_id: selectedMoves.fastMove,  // Pass fast move ID
      charged_move_1_id: selectedMoves.chargedMove1,  // Pass first charged move ID
      charged_move_2_id: selectedMoves.chargedMove2,  // Pass second charged move ID
      latitude: locationCoordinates.latitude,
      longitude: locationCoordinates.longitude,
      ownership: ownershipStatus,
      range_km: range,
      limit: resultsLimit,
    };

    console.log('Search Query Parameters:', queryParams);

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
            selectedForm={selectedForm}
            setSelectedForm={setSelectedForm}
            selectedMoves={selectedMoves} // Pass the selectedMoves state as a prop
            setSelectedMoves={setSelectedMoves}  // Pass the setSelectedMoves function to update moves
          />
        </div>

        <div className="location-search">
          <LocationSearch
            city={city}
            setCity={setCity}
            useCurrentLocation={useCurrentLocation}
            setUseCurrentLocation={setUseCurrentLocation}
            setCoordinates={setCoordinates}
            range={range}
            setRange={setRange}
            resultsLimit={resultsLimit}
            setResultsLimit={setResultsLimit}
            handleSearch={handleSearch}
            isLoading={isLoading}
            view={view}
            setView={setView}
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