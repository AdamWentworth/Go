import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

import HorizontalPageSlider from '@/components/motion/HorizontalPageSlider';
import useHorizontalPageNavigation from '@/components/motion/useHorizontalPageNavigation';
import PokemonSearchBar from './PokemonSearchBar';
import TrainerSearchBar from './TrainerSearchBar';
import SearchModeToggle, { type SearchMode } from './SearchModeToggle';
import ListView from './views/ListView';
import MapView from './views/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useModal } from '../../contexts/ModalContext';
import { createScopedLogger } from '@/utils/logger';
import { normalizeOwnershipMode } from './utils/ownershipMode';
import { searchPokemon } from '@/services/searchService';
import { RenderProfiler } from '@/components/dev/RenderProfiler';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type {
  SearchQueryParams,
  SearchResultRow,
} from '@/services/searchService';
import './Search.css';

type SearchView = 'list' | 'map';

const SEARCH_MODES = ['pokemon', 'trainer'] as const;

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

const hasLinkedMatch = (row: SearchResultRow): boolean =>
  ['wanted_list', 'trade_list'].some((listKey) => {
    const list = row[listKey];
    if (!list || typeof list !== 'object' || Array.isArray(list)) return false;
    return Object.values(list as Record<string, unknown>).some(
      (entry) =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        !Array.isArray(entry) &&
        (entry as { match?: unknown }).match === true,
    );
  });

const searchResultDistance = (row: SearchResultRow): number =>
  typeof row.distance === 'number' && Number.isFinite(row.distance)
    ? row.distance
    : Number.POSITIVE_INFINITY;

const Search: React.FC = () => {
  const [searchMode, setSearchMode] = useState<SearchMode>('pokemon');
  const [view, setView] = useState<SearchView>('list');
  const [searchResults, setSearchResults] = useState<EnrichedSearchResult[]>([]);
  const [ownershipMode, setOwnershipMode] = useState<
    ReturnType<typeof normalizeOwnershipMode>
  >('caught');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [scrollToTopTrigger, setScrollToTopTrigger] = useState(0);

  const variants = useVariantsStore((state) => state.variants);
  const { alert } = useModal();
  const modeSlider = useHorizontalPageNavigation({
    pages: SEARCH_MODES,
    activePage: searchMode,
    onChange: setSearchMode,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const shouldScrollRef = useRef(false);
  const pokemonCache = useMemo<PokemonVariant[]>(
    () => variants.filter((variant) => variant.variantType === 'default'),
    [variants],
  );
  const pokemonById = useMemo(() => {
    const map = new Map<number, PokemonVariant>();
    for (const variant of pokemonCache) {
      const pokemonId = Number(variant.pokemon_id);
      if (Number.isFinite(pokemonId) && !map.has(pokemonId)) {
        map.set(pokemonId, variant);
      }
    }
    return map;
  }, [pokemonCache]);

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
    setOwnershipMode(
      normalizeOwnershipMode(coerceOwnershipModeInput(queryParams.ownership)),
    );
    shouldScrollRef.current = true;

    try {
      const dataArray = await searchPokemon(queryParams);

      if (dataArray.length > 0 && pokemonById.size > 0) {
        const enrichedData = dataArray.reduce<EnrichedSearchResult[]>(
          (acc, item) => {
            const pokemonId = Number(item.pokemon_id);
            if (!Number.isFinite(pokemonId)) return acc;
            const pokemonInfo = pokemonById.get(pokemonId);

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
          enrichedData.sort(
            (a, b) =>
              Number(hasLinkedMatch(b)) - Number(hasLinkedMatch(a)) ||
              searchResultDistance(a) - searchResultDistance(b),
          );
          setSearchResults(enrichedData);
          setScrollToTopTrigger((prev) => prev + 1);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      log.error('Search request failed', error);
      const isTimeout =
        error instanceof Error && error.message.toLowerCase().includes('timed out');
      const message = isTimeout
        ? 'Search took too long to respond. Try a smaller distance or fewer results, then search again.'
        : 'Search is temporarily unavailable. Check your connection and try again.';
      setSearchResults([]);
      setErrorMessage(message);
      void alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="search-page">
      <header className="search-page-header">
        <span className="search-page-header__eyebrow">Community discovery</span>
        <h1>Search</h1>
        <p>Find Pokémon listings and connect with trainers nearby.</p>
        <SearchModeToggle searchMode={searchMode} setSearchMode={setSearchMode} />
      </header>

      <HorizontalPageSlider
        activeIndex={modeSlider.activeIndex}
        className="search-mode-slider"
        dragOffset={modeSlider.dragOffset}
        isDragging={modeSlider.isDragging}
        viewportRef={modeSlider.viewportRef}
        {...modeSlider.swipeHandlers}
      >
        <section
          aria-labelledby="search-tab-pokemon"
          className="search-mode-panel search-mode-panel--pokemon"
          id="search-panel-pokemon"
          role="tabpanel"
        >
          <PokemonSearchBar
            onSearch={handleSearch}
            isLoading={isLoading}
            view={view}
            setView={setView}
            pokemonCache={pokemonCache}
          />

          {errorMessage && (
            <div className="search-error-message" role="alert">
              <FaExclamationTriangle aria-hidden="true" />
              <div>
                <strong>Search couldn&apos;t be completed</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="search-results-stage" ref={containerRef}>
            {isLoading ? (
              <div className="search-loading-state" aria-live="polite">
                <LoadingSpinner />
                <div>
                  <strong>Searching community listings</strong>
                  <span>Checking nearby trainers for the Pokémon you selected…</span>
                </div>
              </div>
            ) : view === 'list' ? (
              <RenderProfiler id="Search.ListView">
                <ListView
                  data={searchResults}
                  instanceData={ownershipMode}
                  hasSearched={hasSearched}
                  pokemonCache={variants}
                  scrollToTopTrigger={scrollToTopTrigger}
                />
              </RenderProfiler>
            ) : (
              <RenderProfiler id="Search.MapView">
                <MapView
                  data={searchResults}
                  hasSearched={hasSearched}
                  instanceData={ownershipMode}
                  pokemonCache={variants}
                />
              </RenderProfiler>
            )}
          </div>
        </section>

        <section
          aria-labelledby="search-tab-trainer"
          className="search-mode-panel search-mode-panel--trainer"
          id="search-panel-trainer"
          role="tabpanel"
        >
          <TrainerSearchBar />
        </section>
      </HorizontalPageSlider>
    </main>
  );
};

export default Search;
