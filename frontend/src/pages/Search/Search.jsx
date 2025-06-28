// Search.jsx

import React, { useState, useEffect, useRef } from 'react';
import PokemonSearchBar from './PokemonSearchBar.jsx';
import ListView from './views/ListView.jsx';
import MapView from './views/MapView.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import axios from 'axios';

// Import contexts
import { useVariantsStore } from '@/features/variants/store/useVariantsStore.js';
import { useModal } from '../../contexts/ModalContext.jsx';

// Import the reusable ActionMenu (adjust the path if necessary)
import ActionMenu from '../../components/ActionMenu.jsx';

const Search = () => {
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [instanceData, setinstanceData] = useState('owned');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pokemonCache, setPokemonCache] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0);

  // Get pokedexLists from the PokemonDataContext
  const variants = useVariantsStore((s) => s.variants);
  const pokedexLists = useVariantsStore((s) => s.pokedexLists);
  const { alert } = useModal();

  // Refs for scrolling
  const containerRef = useRef(null);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (pokedexLists) {
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
    setinstanceData(queryParams.ownership);
    shouldScrollRef.current = true;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_DISCOVER_API_URL}/discoverPokemon`,
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

          if (pokemonCache && pokemonCache.length > 0) {
            for (const item of dataArray) {
              if (item.pokemon_id) {
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
            instanceData={instanceData}
            hasSearched={hasSearched}
            pokemonCache={variants}
            scrollToTopTrigger={scrollToTopTrigger}
          />
        ) : (
          <MapView 
            data={searchResults} 
            instanceData={instanceData} 
            pokemonCache={variants} 
          />
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Simply render the ActionMenu component as in the Pokémon page */}
      <ActionMenu />
    </div>
  );
};

export default Search;