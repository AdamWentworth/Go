// Search.jsx

import React, { useState, useEffect, useRef } from 'react';
import PokemonSearchBar from './PokemonSearchBar.jsx';
import FriendSearchBar from './FriendSearchBar.jsx';
import SearchModeToggle from './SearchModeToggle.jsx';
import ListView from './views/ListView.jsx';
import MapView from './views/MapView.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import axios from 'axios';

import { useVariantsStore } from '@/features/variants/store/useVariantsStore.js';
import { useModal } from '../../contexts/ModalContext.jsx';
import ActionMenu from '../../components/ActionMenu.jsx';
import './Search.css';

const Search = () => {
  const [searchMode, setSearchMode] = useState(null); // Start with no mode selected
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [instanceData, setinstanceData] = useState('owned');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pokemonCache, setPokemonCache] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0);

  const variants = useVariantsStore((s) => s.variants);
  const pokedexLists = useVariantsStore((s) => s.pokedexLists);
  const { alert } = useModal();

  const containerRef = useRef(null);
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (pokedexLists) {
      setPokemonCache(pokedexLists.default || []);
    }
  }, [pokedexLists]);

  useEffect(() => {
    if (shouldScrollRef.current && searchResults.length > 0) {
      setTimeout(() => {
        if (containerRef.current) {
          const offset = 50;
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
        const dataArray = Array.isArray(response.data)
          ? response.data
          : Object.values(response.data);

        if (dataArray?.length > 0 && pokemonCache?.length > 0) {
          const enrichedData = dataArray
            .map((item) => {
              const pokemonInfo = pokemonCache.find(
                (p) => p.pokemon_id === item.pokemon_id
              );
              return pokemonInfo
                ? { ...item, pokemonInfo, boundary: boundaryWKT }
                : null;
            })
            .filter(Boolean);

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
          setSearchResults([]);
          setIsCollapsed(false);
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
        setIsCollapsed(false);
      }
    } catch (error) {
      console.error('Search error:', error);
      await alert('An error occurred while searching. Please try again.');
      setIsCollapsed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial screen before a mode is chosen
  if (!searchMode) {
    return (
      <div className="search-welcome-screen">
        <h1 className="search-welcome-title">Which type of search would you like?</h1>
        <SearchModeToggle
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          isWelcome={true}
        />
      </div>
    );
  }

  // Main app UI after mode is chosen
  return (
    <div>
      <SearchModeToggle searchMode={searchMode} setSearchMode={setSearchMode} />

      {searchMode === 'pokemon' && (
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
      )}

      {searchMode === 'friends' && <FriendSearchBar />}

      {errorMessage && (
        <div className="error-message" style={{ color: 'red', padding: '1rem', textAlign: 'center' }}>
          {errorMessage}
        </div>
      )}

      <div ref={containerRef}>
        {searchMode === 'pokemon' &&
          (isLoading ? (
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
          ))}
      </div>

      <ActionMenu />
    </div>
  );
};

export default Search;
