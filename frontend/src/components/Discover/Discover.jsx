// Discover.jsx

import React, { useState } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../LoadingSpinner';
import axios from 'axios';

const Discover = () => {
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [ownershipStatus, setOwnershipStatus] = useState('owned');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // New state to track if a search was made

  const handleSearch = async (queryParams) => {
    setErrorMessage('');
    setIsLoading(true);
    setHasSearched(true); // Mark as true when a search is made
    setOwnershipStatus(queryParams.ownership);
  
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
  
        // Ensure data is in array format
        const dataArray = Array.isArray(data) ? data : Object.values(data);
  
        if (dataArray && dataArray.length > 0) {
          const enrichedData = [];
  
          const pokemonDataStored = JSON.parse(localStorage.getItem('pokemonData'));
  
          if (pokemonDataStored && pokemonDataStored.data) {
            const pokemonDataArray = pokemonDataStored.data;
  
            for (const item of dataArray) {
              if (item.pokemon_id) {
                const pokemonInfo = pokemonDataArray.find(
                  (p) => p.pokemon_id === item.pokemon_id
                );
  
                // If valid pokemonInfo found in localStorage, enrich data
                if (pokemonInfo) {
                  enrichedData.push({
                    ...item,
                    pokemonInfo,
                  });
                }
              }
            }
  
            // Sort by distance if data is enriched
            if (enrichedData.length > 0) {
              enrichedData.sort((a, b) => a.distance - b.distance);
              setSearchResults(enrichedData);
            } else {
              // Handle case where no valid Pokémon were enriched
              setSearchResults([]);
            }
          } else {
            // Handle missing or invalid localStorage data
            setErrorMessage('pokemonData is not properly formatted in localStorage.');
          }
        } else {
          // Handle case where API returns an empty data array
          setSearchResults([]);
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
      }
    } catch (error) {
      console.error('Error during API request:', error);
      setErrorMessage('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
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
        <ListView data={searchResults} ownershipStatus={ownershipStatus} hasSearched={hasSearched} />
      ) : (
        <MapView data={searchResults} />
      )}

      {/* Error message display */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;