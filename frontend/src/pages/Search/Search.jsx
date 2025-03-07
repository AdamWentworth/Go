// Discover.jsx

import React, { useState, useEffect, useRef } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import axios from 'axios';

// Import the context hook (ensure you’re using useContext inside your hook)
import { usePokemonData } from '../../contexts/PokemonDataContext';
import { useModal } from '../../contexts/ModalContext'; // adjust path if needed

const Discover = () => {
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [ownershipStatus, setOwnershipStatus] = useState('owned');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pokemonCache, setPokemonCache] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0);

  // Get pokedexLists from the PokemonDataContext
  const { variants, pokedexLists } = usePokemonData();

  // Refs for scrolling
  const containerRef = useRef(null);
  const shouldScrollRef = useRef(false);

  const { alert } = useModal();

  // Instead of fetching from the DB, we now pull the default list from the context
  useEffect(() => {
    if (pokedexLists) {
      // Assumes that the default list is stored under the key "default"
      setPokemonCache(pokedexLists.default || []);
      console.log('Using default store from pokedexLists in context:', pokedexLists.default);
    }
  }, [pokedexLists]);

  // Handle scrolling when new results arrive
  useEffect(() => {
    if (shouldScrollRef.current && searchResults.length > 0) {
      setTimeout(() => {
        if (containerRef.current) {
          const offset = 50; // adjust as needed
          const rect = containerRef.current.getBoundingClientRect();
          const absoluteTop = rect.top + window.pageYOffset - offset;
          window.scrollTo({
            top: absoluteTop,
            behavior: 'smooth',
          });
        }
        shouldScrollRef.current = false;
      }, 100);
    }
  }, [searchResults]);

  const handleSearch = async (queryParams, boundaryWKT) => {
    setErrorMessage('');
    setIsLoading(true);
    setHasSearched(true);
    setOwnershipStatus(queryParams.ownership);
    shouldScrollRef.current = true;

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
        const dataArray = Array.isArray(data) ? data : Object.values(data);

        if (dataArray && dataArray.length > 0) {
          // Enrich the data using the default list from context
          const enrichedData = [];

          if (pokemonCache && pokemonCache.length > 0) {
            for (const item of dataArray) {
              if (item.pokemon_id) {
                // Match the item by pokemon_id in the default list array
                const pokemonInfo = pokemonCache.find(
                  (p) => p.pokemon_id === item.pokemon_id
                );

                if (pokemonInfo) {
                  enrichedData.push({
                    ...item,
                    pokemonInfo,
                    boundary: boundaryWKT,
                  });
                }
              }
            }

            if (enrichedData.length > 0) {
              // Sort by distance
              enrichedData.sort((a, b) => a.distance - b.distance);
              setSearchResults(enrichedData);
              setScrollToTopTrigger((prev) => prev + 1);
              setIsCollapsed(true);
            } else {
              setSearchResults([]);
              setIsCollapsed(false);
            }
          } else {
            setErrorMessage('No data found in the default store of PokemonDataContext.');
            setIsCollapsed(false);
          }
        } else {
          setSearchResults([]);
          setIsCollapsed(false);
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
        setIsCollapsed(false);
      }
    } catch (error) {
      console.error('Error during API request:', error);
      if (error.response?.status === 403) {
        await alert('You must be logged in to perform this search.');
      } else {
        await alert('An error occurred while searching. Please try again.');
      }
      setIsCollapsed(false);
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
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        pokemonCache={pokemonCache}
      />

      {/* Render error message at the top */}
      {errorMessage && (
        <div
          className="error-message"
          style={{ color: 'red', padding: '1rem', textAlign: 'center' }}
        >
          {errorMessage}
        </div>
      )}

      <div ref={containerRef}>
        {isLoading ? (
          <LoadingSpinner />
        ) : view === 'list' ? (
          <ListView
            data={searchResults}
            ownershipStatus={ownershipStatus}
            hasSearched={hasSearched}
            pokemonCache={variants}
            scrollToTopTrigger={scrollToTopTrigger}
          />
        ) : (
          <MapView 
            data={searchResults} 
            ownershipStatus={ownershipStatus} 
            pokemonCache={variants} 
          />
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;
