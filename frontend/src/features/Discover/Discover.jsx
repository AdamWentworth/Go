// Discover.jsx

import React, { useState, useEffect, useRef } from 'react';
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
  const [hasSearched, setHasSearched] = useState(false);
  const [pokemonCache, setPokemonCache] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0);
  
  // Add refs for the container and to track if we should scroll
  const containerRef = useRef(null);
  const shouldScrollRef = useRef(false);

  const fetchPokemonVariantsCache = async () => {
    try {
      const variants = await getAllFromDB('pokemonVariants');
      if (variants && variants.length > 0) {
        setPokemonCache(variants);
        console.log('Fetched pokemonVariants from IndexedDB:', variants);
      } else {
        console.warn('No pokemonVariants found in IndexedDB.');
      }
    } catch (error) {
      console.error('Error fetching pokemonVariants from IndexedDB:', error);
    }
  };

  useEffect(() => {
    fetchPokemonVariantsCache();
  }, []);

  // Add useEffect to handle scrolling after results are updated
  useEffect(() => {
    if (shouldScrollRef.current && searchResults.length > 0) {
      setTimeout(() => {
        if (containerRef.current) {
          const offset = 50; // Adjust this value as needed
          const rect = containerRef.current.getBoundingClientRect();
          const absoluteTop = rect.top + window.pageYOffset - offset;
          window.scrollTo({
            top: absoluteTop,
            behavior: 'smooth'
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
    shouldScrollRef.current = true; // Set flag to scroll after results

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
              setScrollToTopTrigger(prev => prev + 1);
              setIsCollapsed(true);
            } else {
              setSearchResults([]);
              setIsCollapsed(false);
            }
          } else {
            setErrorMessage('pokemonData is not properly formatted in localStorage.');
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
      setErrorMessage('An error occurred while searching. Please try again.');
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
      />

      <div ref={containerRef}>
        {isLoading ? (
          <LoadingSpinner />
        ) : view === 'list' ? (
          <ListView
            data={searchResults}
            ownershipStatus={ownershipStatus}
            hasSearched={hasSearched}
            pokemonCache={pokemonCache}
            scrollToTopTrigger={scrollToTopTrigger}
          />
        ) : (
          <MapView 
            data={searchResults} 
            ownershipStatus={ownershipStatus} 
            pokemonCache={pokemonCache} 
          />
        )}
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;