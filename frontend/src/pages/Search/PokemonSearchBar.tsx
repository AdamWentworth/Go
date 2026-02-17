import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaChevronUp, FaGlobe, FaList } from 'react-icons/fa';

import VariantSearch from './SearchParameters/VariantSearch';
import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';
import './PokemonSearchBar.css';
import { createScopedLogger } from '@/utils/logger';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  type SearchOwnershipMode,
} from './utils/ownershipMode';
import {
  buildPokemonSearchQueryParams,
  findMatchingPokemonVariant,
  validateSearchInput,
  type Coordinates,
  type IvFilters,
  type PokemonSearchQueryParams,
  type SelectedMoves,
} from './utils/buildPokemonSearchQuery';

type SearchView = 'list' | 'map';

type PokemonSearchBarProps = {
  onSearch: (
    queryParams: PokemonSearchQueryParams,
    boundaryWKT?: string | null,
  ) => void | Promise<void>;
  isLoading: boolean;
  view: SearchView;
  setView: React.Dispatch<React.SetStateAction<SearchView>>;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  pokemonCache: PokemonVariant[] | null;
};

const log = createScopedLogger('PokemonSearchBar');

const PokemonSearchBar: React.FC<PokemonSearchBarProps> = ({
  onSearch,
  isLoading,
  view,
  setView,
  isCollapsed,
  setIsCollapsed,
  pokemonCache,
}) => {
  const [pokemon, setPokemon] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [isShadow, setIsShadow] = useState(false);
  const [costume, setCostume] = useState<string | null>('');
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedMoves, setSelectedMoves] = useState<SelectedMoves>({
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  });
  const [selectedGender, setSelectedGender] = useState<string | null>('Any');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<number | null>(
    null,
  );
  const [dynamax, setDynamax] = useState(false);
  const [gigantamax, setGigantamax] = useState(false);
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipMode, setOwnershipMode] = useState<SearchOwnershipMode>('caught');
  const [coordinates, setCoordinates] = useState<Coordinates>({
    latitude: null,
    longitude: null,
  });
  const [range, setRange] = useState(5);
  const [resultsLimit, setResultsLimit] = useState(5);
  const [ivs, setIvs] = useState<IvFilters>({
    Attack: null,
    Defense: null,
    Stamina: null,
  });
  const [isHundo, setIsHundo] = useState(false);
  const [onlyMatchingTrades, setOnlyMatchingTrades] = useState(false);

  const [prefLucky, setPrefLucky] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [tradeInWantedList, setTradeInWantedList] = useState(false);
  const [friendshipLevel, setFriendshipLevel] = useState(0);

  const [errorMessage, setErrorMessage] = useState<string | null>('');
  const [isMidWidth, setIsMidWidth] = useState(false);
  const [, setSelectedBoundary] = useState<string | null>(null);

  const collapsibleRef = useRef<HTMLDivElement | null>(null);
  const searchTriggeredRef = useRef(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMidWidth(window.innerWidth >= 1024 && window.innerWidth <= 1439);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!collapsibleRef.current || isCollapsed) return;

    const contentElement = collapsibleRef.current.querySelector('.content');
    if (!contentElement) return;

    const observer = new ResizeObserver(() => {
      if (!isCollapsed && collapsibleRef.current) {
        collapsibleRef.current.style.maxHeight = `${collapsibleRef.current.scrollHeight}px`;
      }
    });

    observer.observe(contentElement);
    return () => observer.disconnect();
  }, [isCollapsed]);

  useEffect(() => {
    if (collapsibleRef.current) {
      if (!isCollapsed) {
        collapsibleRef.current.style.maxHeight = `${collapsibleRef.current.scrollHeight}px`;
        setTimeout(() => {
          if (!isCollapsed && collapsibleRef.current) {
            collapsibleRef.current.style.overflow = 'visible';
          }
        }, 600);
      } else {
        collapsibleRef.current.style.maxHeight = '0px';
        collapsibleRef.current.style.overflow = 'hidden';
      }
    }
  }, [isCollapsed]);

  const handleScroll = useCallback(() => {
    const searchBar = collapsibleRef.current;
    const searchBarHeight = searchBar ? searchBar.offsetHeight : 0;
    const searchBarBottom = searchBar ? searchBar.offsetTop + searchBarHeight : 0;
    const adjustedCollapsePoint = searchBarBottom - searchBarHeight * 0.15;

    if (window.scrollY > adjustedCollapsePoint) {
      setIsCollapsed(true);
      return;
    }

    if (window.scrollY === 0) {
      if (searchTriggeredRef.current) {
        searchTriggeredRef.current = false;
        return;
      }
      setIsCollapsed(false);
    }
  }, [setIsCollapsed]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleSearch = async () => {
    setErrorMessage('');

    const inputError = validateSearchInput({
      isShadow,
      ownershipMode,
      pokemon,
      useCurrentLocation,
      city,
      coordinates,
      pokemonCache,
    });
    if (inputError) {
      setErrorMessage(inputError);
      return;
    }

    const matchingPokemon = findMatchingPokemonVariant(
      pokemonCache as PokemonVariant[],
      pokemon,
      selectedForm,
    );

    if (!matchingPokemon) {
      setErrorMessage('No matching Pokemon found in the default list.');
      setIsCollapsed(false);
      return;
    }

    const queryParams: PokemonSearchQueryParams = buildPokemonSearchQueryParams({
      matchingPokemon,
      costume,
      isShiny,
      isShadow,
      selectedMoves,
      selectedGender,
      selectedBackgroundId,
      ivs,
      onlyMatchingTrades,
      prefLucky,
      friendshipLevel,
      alreadyRegistered,
      tradeInWantedList,
      coordinates,
      ownershipMode,
      range,
      resultsLimit,
      dynamax,
      gigantamax,
    });

    log.debug('Search query parameters', queryParams);
    await onSearch(queryParams, null);
    setIsCollapsed(true);
    searchTriggeredRef.current = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pokemon-search-bar sticky">
      <div
        ref={collapsibleRef}
        className={`collapsible-container ${isCollapsed ? 'collapsed' : ''}`}
      >
        <div className="search-bar-container content">
          <div className="pokemon-variant">
            <VariantSearch
              pokemon={pokemon}
              setPokemon={setPokemon}
              isShiny={isShiny}
              setIsShiny={setIsShiny}
              isShadow={isShadow}
              setIsShadow={setIsShadow}
              costume={costume}
              setCostume={setCostume}
              selectedForm={selectedForm}
              setSelectedForm={setSelectedForm}
              selectedMoves={selectedMoves}
              setSelectedMoves={setSelectedMoves}
              selectedGender={selectedGender}
              setSelectedGender={setSelectedGender}
              setSelectedBackgroundId={setSelectedBackgroundId}
              setErrorMessage={setErrorMessage}
              dynamax={dynamax}
              setDynamax={setDynamax}
              gigantamax={gigantamax}
              setGigantamax={setGigantamax}
              pokemonCache={pokemonCache}
            />
          </div>

          {isMidWidth ? (
            <div className="location-ownership-row">
              <div className="location-search">
                <LocationSearch
                  city={city}
                  setCity={setCity}
                  useCurrentLocation={useCurrentLocation}
                  setUseCurrentLocation={setUseCurrentLocation}
                  setCoordinates={setCoordinates}
                  range={range}
                  setRange={setRange}
                  resultsLimit={resultsLimit}
                  setResultsLimit={setResultsLimit}
                  handleSearch={handleSearch}
                  isLoading={isLoading}
                  view={view}
                  setView={setView}
                  setSelectedBoundary={setSelectedBoundary}
                />
              </div>

              <div className="ownership-status">
                <OwnershipSearch
                  ownershipMode={ownershipMode}
                  setOwnershipMode={setOwnershipMode}
                  ivs={ivs}
                  setIvs={setIvs}
                  isHundo={isHundo}
                  setIsHundo={setIsHundo}
                  onlyMatchingTrades={onlyMatchingTrades}
                  setOnlyMatchingTrades={setOnlyMatchingTrades}
                  prefLucky={prefLucky}
                  setPrefLucky={setPrefLucky}
                  alreadyRegistered={alreadyRegistered}
                  setAlreadyRegistered={setAlreadyRegistered}
                  trade_in_wanted_list={tradeInWantedList}
                  setTradeInWantedList={setTradeInWantedList}
                  friendshipLevel={friendshipLevel}
                  setFriendshipLevel={setFriendshipLevel}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="location-search">
                <LocationSearch
                  city={city}
                  setCity={setCity}
                  useCurrentLocation={useCurrentLocation}
                  setUseCurrentLocation={setUseCurrentLocation}
                  setCoordinates={setCoordinates}
                  range={range}
                  setRange={setRange}
                  resultsLimit={resultsLimit}
                  setResultsLimit={setResultsLimit}
                  handleSearch={handleSearch}
                  isLoading={isLoading}
                  view={view}
                  setView={setView}
                  setSelectedBoundary={setSelectedBoundary}
                />
              </div>

              <div className="ownership-status">
                <OwnershipSearch
                  ownershipMode={ownershipMode}
                  setOwnershipMode={setOwnershipMode}
                  ivs={ivs}
                  setIvs={setIvs}
                  isHundo={isHundo}
                  setIsHundo={setIsHundo}
                  onlyMatchingTrades={onlyMatchingTrades}
                  setOnlyMatchingTrades={setOnlyMatchingTrades}
                  prefLucky={prefLucky}
                  setPrefLucky={setPrefLucky}
                  alreadyRegistered={alreadyRegistered}
                  setAlreadyRegistered={setAlreadyRegistered}
                  trade_in_wanted_list={tradeInWantedList}
                  setTradeInWantedList={setTradeInWantedList}
                  friendshipLevel={friendshipLevel}
                  setFriendshipLevel={setFriendshipLevel}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="controls-container">
        <div className="error-message">{errorMessage}</div>
        <div className="view-controls">
          <button
            type="button"
            className="view-button"
            aria-label="List view"
            onClick={() => setView('list')}
          >
            <FaList />
          </button>
          <button
            type="button"
            className="toggle-button"
            aria-label="Toggle search filters"
            onClick={toggleCollapse}
          >
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </button>
          <button
            type="button"
            className="view-button"
            aria-label="Map view"
            onClick={() => setView('map')}
          >
            <FaGlobe />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PokemonSearchBar;
export type { PokemonSearchQueryParams };
