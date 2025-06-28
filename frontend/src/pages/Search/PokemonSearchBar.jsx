// PokemonSearchBar.jsx

import React, { useState, useEffect, useRef } from 'react';
import VariantSearch from './SearchParameters/VariantSearch.jsx';
import LocationSearch from './SearchParameters/LocationSearch.jsx';
import OwnershipSearch from './SearchParameters/OwnershipSearch.jsx';
import './PokemonSearchBar.css';
import { FaChevronUp, FaChevronDown, FaList, FaGlobe } from 'react-icons/fa';

const PokemonSearchBar = ({
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
  const [selectedMoves, setSelectedMoves] = useState({
    fastMove: null,
    chargedMove1: null,
    chargedMove2: null,
  });
  const [selectedGender, setSelectedGender] = useState('Any');
  const [selectedBackgroundId, setSelectedBackgroundId] = useState(null);
  const [dynamax, setDynamax] = useState(false);
  const [gigantamax, setGigantamax] = useState(false);
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [instanceData, setinstanceData] = useState('owned');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [range, setRange] = useState(5);
  const [resultsLimit, setResultsLimit] = useState(5);
  const [ivs, setIvs] = useState({ Attack: null, Defense: null, Stamina: null });
  const [isHundo, setIsHundo] = useState(false);
  const [onlyMatchingTrades, setOnlyMatchingTrades] = useState(false);

  // 'wanted' parameters
  const [prefLucky, setPrefLucky] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [tradeInWantedList, setTradeInWantedList] = useState(false);
  const [friendshipLevel, setFriendshipLevel] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');
  const [isMidWidth, setIsMidWidth] = useState(false);

  const collapsibleRef = useRef(null);
  const searchTriggeredRef = useRef(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMidWidth(window.innerWidth >= 1024 && window.innerWidth <= 1439);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle auto-resizing of collapsible container
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

  // Animate open/close
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

  // Collapse when scrolling
  const handleScroll = () => {
    const searchBar = collapsibleRef.current;
    const searchBarHeight = searchBar ? searchBar.offsetHeight : 0;
    const searchBarBottom = searchBar ? searchBar.offsetTop + searchBarHeight : 0;
    const adjustedCollapsePoint = searchBarBottom - searchBarHeight * 0.15;

    if (window.scrollY > adjustedCollapsePoint) {
      setIsCollapsed(true);
    } else if (window.scrollY === 0) {
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
    setIsCollapsed(!isCollapsed);
  };

  const handleSearch = async () => {
    setErrorMessage('');

    if (isShadow && (instanceData === 'trade' || instanceData === 'wanted')) {
      setErrorMessage('Shadow Pokémon cannot be listed for trade or wanted');
      return;
    }

    if (!pokemon) {
      setErrorMessage('Please provide a Pokémon name.');
      return;
    }

    if (!useCurrentLocation && (!city || !coordinates.latitude || !coordinates.longitude)) {
      setErrorMessage('Please provide a location or use your current location.');
      return;
    }

    if (!pokemonCache || pokemonCache.length === 0) {
      setErrorMessage('No Pokémon data found in the default store.');
      return;
    }

    const matchingPokemon = pokemonCache.find(
      (p) =>
        p.name?.toLowerCase() === pokemon.toLowerCase() &&
        (!selectedForm || p.form?.toLowerCase() === selectedForm.toLowerCase())
    );

    if (!matchingPokemon) {
      setErrorMessage('No matching Pokémon found in the default list.');
      setIsCollapsed(false);
      return;
    }

    const { pokemon_id } = matchingPokemon;
    const matchingCostume = matchingPokemon.costumes?.find((c) => c.name === costume);
    const costume_id = matchingCostume ? matchingCostume.costume_id : null;

    const queryParams = {
      pokemon_id,
      shiny: isShiny,
      shadow: isShadow,
      costume_id,
      fast_move_id: selectedMoves.fastMove,
      charged_move_1_id: selectedMoves.chargedMove1,
      charged_move_2_id: selectedMoves.chargedMove2,
      gender: selectedGender === 'Any' ? null : selectedGender,
      background_id: selectedBackgroundId,
      attack_iv: ivs.Attack !== null ? ivs.Attack : null,
      defense_iv: ivs.Defense !== null ? ivs.Defense : null,
      stamina_iv: ivs.Stamina !== null ? ivs.Stamina : null,
      only_matching_trades: onlyMatchingTrades ? true : null,
      pref_lucky: prefLucky ? true : null,
      friendship_level: friendshipLevel,
      already_registered: alreadyRegistered ? true : null,
      trade_in_wanted_list: tradeInWantedList ? true : null,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      ownership: instanceData,
      range_km: range,
      limit: resultsLimit,
      dynamax,
      gigantamax,
    };

    if (instanceData !== 'owned') {
      queryParams.attack_iv = null;
      queryParams.defense_iv = null;
      queryParams.stamina_iv = null;
    }

    if (instanceData !== 'trade') {
      queryParams.only_matching_trades = null;
    }

    if (instanceData !== 'wanted') {
      queryParams.pref_lucky = null;
      queryParams.friendship_level = null;
      queryParams.already_registered = null;
      queryParams.trade_in_wanted_list = null;
    }

    console.log('Search Query Parameters:', queryParams);
    onSearch(queryParams, null);
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
                />
              </div>

              <div className="ownership-status">
                <OwnershipSearch
                  instanceData={instanceData}
                  setinstanceData={setinstanceData}
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
                />
              </div>

              <div className="ownership-status">
                <OwnershipSearch
                  instanceData={instanceData}
                  setinstanceData={setinstanceData}
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
          <button className="view-button" onClick={() => setView('list')}>
            <FaList />
          </button>
          <div className="toggle-button" onClick={toggleCollapse}>
            {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
          </div>
          <button className="view-button" onClick={() => setView('globe')}>
            <FaGlobe />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PokemonSearchBar;