// Discover.jsx

import React, { useState } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../LoadingSpinner';  // Import the LoadingSpinner component
import axios from 'axios';

const Discover = () => {
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [ownershipStatus, setOwnershipStatus] = useState('owned'); // Track ownership status
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (queryParams) => {
    setErrorMessage('');
    setIsLoading(true);
    setOwnershipStatus(queryParams.ownership); // Update ownership status based on search parameters

    try {
      const response = await axios.get(
        'http://localhost:3005/api/discoverPokemon',
        {
          params: queryParams,
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        let data = response.data;

        // Convert data to an array if it's an object
        const dataArray = Array.isArray(data) ? data : Object.values(data);

        if (dataArray && dataArray.length > 0) {
          const enrichedData = [];

          const pokemonDataStored = JSON.parse(localStorage.getItem('pokemonData'));

          if (pokemonDataStored && pokemonDataStored.data) {
            const pokemonDataArray = pokemonDataStored.data;
            const firstItem = dataArray[0];
            const pokemonId = firstItem.pokemon_id;
            const pokemonInfo = pokemonDataArray.find(
              (p) => p.pokemon_id === pokemonId
            );

            if (!pokemonInfo) {
              throw new Error(`Pokémon with ID ${pokemonId} not found in localStorage.`);
            }

            for (const item of dataArray) {
              enrichedData.push({
                ...item,
                pokemonInfo,
              });
            }

            enrichedData.sort((a, b) => a.distance - b.distance);
            setSearchResults(enrichedData);
          } else {
            throw new Error('pokemonData is not properly formatted in localStorage.');
          }
        } else {
          setSearchResults([]);
          setErrorMessage('No Pokémon found matching your criteria.');
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
      }
    } catch (error) {
      console.error('Error during API request:', error);
      setErrorMessage('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);  // End the loading state
    }
  };

  return (
    <div>
      <PokemonSearchBar
        onSearch={handleSearch}
        isLoading={isLoading}
        setErrorMessage={setErrorMessage}
        view={view}
        setView={setView}
      />

      {/* Conditionally render the LoadingSpinner or the ListView/MapView */}
      {isLoading ? (
        <LoadingSpinner />
      ) : view === 'list' ? (
        <ListView data={searchResults} ownershipStatus={ownershipStatus} />
      ) : (
        <MapView data={searchResults} />
      )}

      {/* Error message display */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;