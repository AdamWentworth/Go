// Discover.jsx

import React, { useState, useEffect } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import axios from 'axios';
import { getAllFromDB } from '../../services/indexedDB';

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
        // Retrieve all variants from the IndexedDB store
        const variants = await getAllFromDB('pokemonVariants');
        
        if (variants && variants.length > 0) {
            setPokemonCache(variants); // Store pokemonCache with the retrieved data
            console.log('Fetched pokemonVariants from IndexedDB:', variants);
        } else {
            console.warn('No pokemonVariants found in IndexedDB.');
        }
    } catch (error) {
        console.error('Error fetching pokemonVariants from IndexedDB:', error);
    }
  };

  useEffect(() => {
    // Fetch pokemonVariants from Cache Storage on component mount
    fetchPokemonVariantsCache();
  }, []);

  const handleSearch = async (queryParams, boundaryWKT) => {
    setErrorMessage('');
    setIsLoading(true);
    setHasSearched(true);
    setOwnershipStatus(queryParams.ownership);
  
    try {
      // Make the request without boundary in query params
      const response = await axios.get(
        `${process.env.REACT_APP_DISCOVER_API_URL}/discoverPokemon`,
        {
          params: queryParams,
          withCredentials: true,
        }
      );
  
      if (response.status === 200) {
        let data = response.data;
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
  
                if (pokemonInfo) {
                  // Attach boundaryWKT to each item or just once as needed
                  enrichedData.push({
                    ...item,
                    pokemonInfo,
                    boundary: boundaryWKT
                  });
                }
              }
            }
  
            if (enrichedData.length > 0) {
              enrichedData.sort((a, b) => a.distance - b.distance);
              setSearchResults(enrichedData);
              setIsCollapsed(true);
            } else {
              setSearchResults([]);
              setIsCollapsed(false); // Expand search bar if no results
            }
          } else {
            setErrorMessage('pokemonData is not properly formatted in localStorage.');
            setIsCollapsed(false);
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
        <MapView data={searchResults} ownershipStatus={ownershipStatus} pokemonCache={pokemonCache} />
      )}

      {/* Error message display */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;