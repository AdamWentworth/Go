// Discover.jsx

import React, { useState, useEffect } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import axios from 'axios';

const Discover = () => {
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [ownershipStatus, setOwnershipStatus] = useState('owned');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Track if a search has been made
  const [pokemonCache, setPokemonCache] = useState(null); // Store the pokemonCache (pokemonVariants)
  const [isCollapsed, setIsCollapsed] = useState(false); // Move isCollapsed state here

  // This function retrieves pokemonCache from Cache Storage (or could be another API)
  const fetchPokemonVariantsCache = async () => {
    try {
      const cache = await caches.open('pokemonCache');
      const cachedResponse = await cache.match('/pokemonVariants');
      if (cachedResponse) {
        const data = await cachedResponse.json();
        setPokemonCache(data); // Store pokemonCache
        console.log('Fetched pokemonCache from Cache Storage:', data);
      } else {
        console.warn('No pokemonVariants cache found.');
      }
    } catch (error) {
      console.error('Error fetching pokemonCache from Cache Storage:', error);
    }
  };

  useEffect(() => {
    // Fetch pokemonVariants from Cache Storage on component mount
    fetchPokemonVariantsCache();
  }, []);

  const handleSearch = async (queryParams) => {
    setErrorMessage('');
    setIsLoading(true);
    setHasSearched(true); // Mark as true when a search is made
    setOwnershipStatus(queryParams.ownership);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_DISCOVER_API_URL}/discoverPokemon`,
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

          // Use `pokemonData` from localStorage for additional general Pokémon info (if needed)
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
              setIsCollapsed(true); // Collapse search bar if results are found
            } else {
              // Handle case where no valid Pokémon were enriched
              setSearchResults([]);
              setIsCollapsed(false); // Expand search bar if no results
            }
          } else {
            // Handle missing or invalid localStorage data
            setErrorMessage('pokemonData is not properly formatted in localStorage.');
            setIsCollapsed(false); // Expand search bar if there's an error
          }
        } else {
          // Handle case where API returns an empty data array
          setSearchResults([]);
          setIsCollapsed(false); // Expand search bar if no results
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
        setIsCollapsed(false); // Expand search bar if there's an error
      }
    } catch (error) {
      console.error('Error during API request:', error);
      setErrorMessage('An error occurred while searching. Please try again.');
      setIsCollapsed(false); // Expand search bar if there's an error
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
        isCollapsed={isCollapsed} // Pass down the isCollapsed state
        setIsCollapsed={setIsCollapsed} // Pass the function to toggle collapse/expand
      />

      {/* Conditionally render the LoadingSpinner or the ListView/MapView */}
      {isLoading ? (
        <LoadingSpinner />
      ) : view === 'list' ? (
        <ListView
          data={searchResults}
          ownershipStatus={ownershipStatus}
          hasSearched={hasSearched}
          pokemonCache={pokemonCache} // Pass the pokemonCache to ListView
        />
      ) : (
        <MapView data={searchResults} />
      )}

      {/* Error message display */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;