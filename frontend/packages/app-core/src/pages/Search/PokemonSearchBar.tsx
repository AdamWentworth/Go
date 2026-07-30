import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaGlobe, FaList } from 'react-icons/fa';

import VariantSearch from './SearchParameters/VariantSearch';
import SearchSecondaryPanels from './SearchSecondaryPanels';
import './PokemonSearchBar.css';
import { createScopedLogger } from '@/utils/logger';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  type SearchOwnershipMode,
} from './utils/ownershipMode';
import {
  preparePokemonSearchQuery,
  type Coordinates,
  type IvFilters,
  type PokemonSearchQueryParams,
  type SelectedMoves,
} from './utils/buildPokemonSearchQuery';
import { useSearchBarCollapse } from './hooks/useSearchBarCollapse';

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
  const [, setSelectedBoundary] = useState<string | null>(null);
  const {
    collapsibleRef,
    isMidWidth,
    toggleCollapse,
    markSearchTriggered,
  } = useSearchBarCollapse({
    isCollapsed,
    setIsCollapsed,
  });

  const handleSearch = async () => {
    setErrorMessage('');
    const preparedSearch = preparePokemonSearchQuery({
      pokemon,
      selectedForm,
      isShiny,
      isShadow,
      costume,
      selectedMoves,
      selectedGender,
      selectedBackgroundId,
      dynamax,
      gigantamax,
      city,
      useCurrentLocation,
      ownershipMode,
      coordinates,
      range,
      resultsLimit,
      ivs,
      onlyMatchingTrades,
      prefLucky,
      friendshipLevel,
      alreadyRegistered,
      tradeInWantedList,
      pokemonCache,
    });
    if (!preparedSearch.ok) {
      setErrorMessage(preparedSearch.errorMessage);
      if (preparedSearch.shouldExpandSearchBar) {
        setIsCollapsed(false);
      }
      return;
    }
    const queryParams: PokemonSearchQueryParams = preparedSearch.queryParams;

    log.debug('Search query parameters', queryParams);
    await onSearch(queryParams, null);
    setIsCollapsed(true);
    markSearchTriggered();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const locationProps: React.ComponentProps<typeof SearchSecondaryPanels>['locationProps'] = {
    city,
    setCity,
    useCurrentLocation,
    setUseCurrentLocation,
    setCoordinates,
    range,
    setRange,
    resultsLimit,
    setResultsLimit,
    handleSearch,
    isLoading,
    view,
    setView,
    setSelectedBoundary,
  };
  const ownershipProps: React.ComponentProps<typeof SearchSecondaryPanels>['ownershipProps'] = {
    ownershipMode,
    setOwnershipMode,
    ivs,
    setIvs,
    isHundo,
    setIsHundo,
    onlyMatchingTrades,
    setOnlyMatchingTrades,
    prefLucky,
    setPrefLucky,
    alreadyRegistered,
    setAlreadyRegistered,
    trade_in_wanted_list: tradeInWantedList,
    setTradeInWantedList,
    friendshipLevel,
    setFriendshipLevel,
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

          <SearchSecondaryPanels
            isMidWidth={isMidWidth}
            locationProps={locationProps}
            ownershipProps={ownershipProps}
          />
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
