import React, { useEffect, useRef, useState } from 'react';

import PokemonSearchBar from './PokemonSearchBar';
import TrainerSearchBar from './TrainerSearchBar';
import SearchModeToggle from './SearchModeToggle';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import ActionMenu from '../../components/ActionMenu';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useModal } from '../../contexts/ModalContext';
import { createScopedLogger } from '@/utils/logger';
import { normalizeOwnershipMode } from './utils/ownershipMode';
import { searchPokemon } from '@/services/searchService';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  SearchQueryParams,
  SearchResultRow,
} from '@/services/searchService';
import './Search.css';

type SearchMode = 'pokemon' | 'trainer' | null;
type SearchView = 'list' | 'map';

type EnrichedSearchResult = SearchResultRow & {
  pokemonInfo: PokemonVariant;
  boundary?: string | null;
};

const coerceOwnershipModeInput = (
  value: unknown,
): Parameters<typeof normalizeOwnershipMode>[0] => {
  if (value === 'caught' || value === 'trade' || value === 'wanted') {
    return value;
  }
  return undefined;
};

const log = createScopedLogger('Search');

const Search: React.FC = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>(null);
  const [view, setView] = useState<SearchView>('list');
  const [searchResults, setSearchResults] = useState<EnrichedSearchResult[]>([]);
  const [ownershipMode, setOwnershipMode] = useState<
    ReturnType<typeof normalizeOwnershipMode>
  >('caught');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pokemonCache, setPokemonCache] = useState<PokemonVariant[] | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0);

  const variants = useVariantsStore((state) => state.variants);
  const pokedexLists = useVariantsStore((state) => state.pokedexLists);
  const { alert } = useModal();

  const containerRef = useRef<HTMLDivElement | null>(null);
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

  const handleSearch = async (
    queryParams: SearchQueryParams,
    boundaryWKT?: string | null,
  ): Promise<void> => {
    setErrorMessage('');
    setIsLoading(true);
    setHasSearched(true);
    setOwnershipMode(normalizeOwnershipMode(coerceOwnershipModeInput(queryParams.ownership)));
    shouldScrollRef.current = true;

    try {
      const dataArray = await searchPokemon(queryParams);

      if (dataArray.length > 0 && (pokemonCache?.length || 0) > 0) {
        const enrichedData = dataArray.reduce<EnrichedSearchResult[]>(
          (acc, item) => {
            const pokemonInfo = pokemonCache?.find(
              (variant) => variant.pokemon_id === item.pokemon_id,
            );

            if (pokemonInfo) {
              acc.push({
                ...item,
                pokemonInfo,
                boundary: boundaryWKT,
              });
            }
            return acc;
          },
          [],
        );

        if (enrichedData.length > 0) {
          enrichedData.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
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
    } catch (error) {
      log.error('Search request failed', error);
      await alert('An error occurred while searching. Please try again.');
      setIsCollapsed(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!searchMode) {
    return (
      <div className="search-welcome-screen">
        <h1 className="search-welcome-title">
          Which type of search would you like?
        </h1>
        <SearchModeToggle
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          isWelcome={true}
        />
      </div>
    );
  }

  return (
    <div>
      <SearchModeToggle searchMode={searchMode} setSearchMode={setSearchMode} />

      {searchMode === 'pokemon' && (
        <PokemonSearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          view={view}
          setView={setView}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          pokemonCache={pokemonCache}
        />
      )}

      {searchMode === 'trainer' && <TrainerSearchBar />}

      {errorMessage && (
        <div
          className="search-error-message"
          style={{ color: 'red', padding: '1rem', textAlign: 'center' }}
        >
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
              instanceData={ownershipMode}
              hasSearched={hasSearched}
              pokemonCache={variants}
              scrollToTopTrigger={scrollToTopTrigger}
            />
          ) : (
            <MapView
              data={searchResults}
              instanceData={ownershipMode}
              pokemonCache={variants}
            />
          ))}
      </div>

      <ActionMenu />
    </div>
  );
};

export default Search;
