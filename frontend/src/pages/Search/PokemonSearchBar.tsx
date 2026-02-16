import React, { useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaChevronUp, FaGlobe, FaList } from 'react-icons/fa';

import VariantSearch from './SearchParameters/VariantSearch';
import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';
import './PokemonSearchBar.css';
import { createScopedLogger } from '@/utils/logger';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  isCaughtOwnershipMode,
  toOwnershipApiValue,
  type SearchOwnershipMode,
} from './utils/ownershipMode';

type SearchView = 'list' | 'map';

type SelectedMoves = {
  fastMove: number | string | null;
  chargedMove1: number | string | null;
  chargedMove2: number | string | null;
};

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type IvFilters = {
  Attack: number | null;
  Defense: number | null;
  Stamina: number | null;
};

export type PokemonSearchQueryParams = {
  pokemon_id: number;
  shiny: boolean;
  shadow: boolean;
  costume_id: number | null;
  fast_move_id: number | string | null;
  charged_move_1_id: number | string | null;
  charged_move_2_id: number | string | null;
  gender: string | null;
  background_id: number | null;
  attack_iv: number | null;
  defense_iv: number | null;
  stamina_iv: number | null;
  only_matching_trades: boolean | null;
  pref_lucky: boolean | null;
  friendship_level: number | null;
  already_registered: boolean | null;
  trade_in_wanted_list: boolean | null;
  latitude: number | null;
  longitude: number | null;
  ownership: ReturnType<typeof toOwnershipApiValue>;
  range_km: number;
  limit: number;
  dynamax: boolean;
  gigantamax: boolean;
};

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
  const [costume, setCostume] = useState('');
  const [selectedForm, setSelectedForm] = useState('');
  const [selectedMoves, setSelectedMoves] = useState<SelectedMoves>({
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  });
  const [selectedGender, setSelectedGender] = useState('Any');
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

  const handleScroll = () => {
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
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleSearch = async () => {
    setErrorMessage('');

    if (isShadow && (ownershipMode === 'trade' || ownershipMode === 'wanted')) {
      setErrorMessage('Shadow Pokemon cannot be listed for trade or wanted');
      return;
    }

    if (!pokemon) {
      setErrorMessage('Please provide a Pokemon name.');
      return;
    }

    if (!useCurrentLocation && (!city || !coordinates.latitude || !coordinates.longitude)) {
      setErrorMessage('Please provide a location or use your current location.');
      return;
    }

    if (!pokemonCache || pokemonCache.length === 0) {
      setErrorMessage('No Pokemon data found in the default store.');
      return;
    }

    const matchingPokemon = pokemonCache.find(
      (variant) =>
        variant.name?.toLowerCase() === pokemon.toLowerCase() &&
        (!selectedForm ||
          (variant.form ?? '').toLowerCase() === selectedForm.toLowerCase()),
    );

    if (!matchingPokemon) {
      setErrorMessage('No matching Pokemon found in the default list.');
      setIsCollapsed(false);
      return;
    }

    const matchingCostume = matchingPokemon.costumes?.find(
      (entry) => entry.name === costume,
    );

    const queryParams: PokemonSearchQueryParams = {
      pokemon_id: matchingPokemon.pokemon_id,
      shiny: isShiny,
      shadow: isShadow,
      costume_id: matchingCostume?.costume_id ?? null,
      fast_move_id: selectedMoves.fastMove,
      charged_move_1_id: selectedMoves.chargedMove1,
      charged_move_2_id: selectedMoves.chargedMove2,
      gender: selectedGender === 'Any' ? null : selectedGender,
      background_id: selectedBackgroundId,
      attack_iv: ivs.Attack,
      defense_iv: ivs.Defense,
      stamina_iv: ivs.Stamina,
      only_matching_trades: onlyMatchingTrades ? true : null,
      pref_lucky: prefLucky ? true : null,
      friendship_level: friendshipLevel,
      already_registered: alreadyRegistered ? true : null,
      trade_in_wanted_list: tradeInWantedList ? true : null,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      ownership: toOwnershipApiValue(ownershipMode),
      range_km: range,
      limit: resultsLimit,
      dynamax,
      gigantamax,
    };

    if (!isCaughtOwnershipMode(ownershipMode)) {
      queryParams.attack_iv = null;
      queryParams.defense_iv = null;
      queryParams.stamina_iv = null;
    }

    if (ownershipMode !== 'trade') {
      queryParams.only_matching_trades = null;
    }

    if (ownershipMode !== 'wanted') {
      queryParams.pref_lucky = null;
      queryParams.friendship_level = null;
      queryParams.already_registered = null;
      queryParams.trade_in_wanted_list = null;
    }

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
