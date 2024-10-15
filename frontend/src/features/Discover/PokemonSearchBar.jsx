// PokemonSearchBar.jsx

import React, { useState, useEffect, useRef } from 'react';
import VariantSearch from './SearchParameters/VariantSearch';
import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';
import './PokemonSearchBar.css';
import { FaChevronUp, FaChevronDown, FaList, FaGlobe } from 'react-icons/fa';
import axios from 'axios';

const PokemonSearchBar = ({ onSearch, isLoading, view, setView, isCollapsed, setIsCollapsed }) => {
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
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState('owned');
  const [coordinates, setCoordinates] = useState({ latitude: null, longitude: null });
  const [range, setRange] = useState(5);
  const [resultsLimit, setResultsLimit] = useState(5);
  const [stats, setStats] = useState({ attack: null, defense: null, stamina: null });
  const [isHundo, setIsHundo] = useState(false);
  const [onlyMatchingTrades, setOnlyMatchingTrades] = useState(false);

  // Add states for 'wanted' parameters
  const [prefLucky, setPrefLucky] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [tradeInWantedList, setTradeInWantedList] = useState(false);
  const [friendshipLevel, setFriendshipLevel] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');
  const [isMidWidth, setIsMidWidth] = useState(false); // Add this to track window width

  const collapsibleRef = useRef(null); // Add a ref for the collapsible container

  useEffect(() => {
    const handleResize = () => {
      setIsMidWidth(window.innerWidth >= 1024 && window.innerWidth <= 1439);
    };

    // Set initial state
    handleResize();

    // Add event listener to track resizing
    window.addEventListener('resize', handleResize);

    // Cleanup the event listener
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isCollapsed && collapsibleRef.current) {
      // Set the max-height to the scrollHeight when expanded
      collapsibleRef.current.style.maxHeight = `${collapsibleRef.current.scrollHeight}px`;
    } else if (isCollapsed && collapsibleRef.current) {
      // Set max-height to 0 when collapsed
      collapsibleRef.current.style.maxHeight = '0px';
    }
  }, [isCollapsed]);

  // Function to handle scroll event
  const handleScroll = () => {
    const searchBar = collapsibleRef.current;
    const searchBarHeight = searchBar ? searchBar.offsetHeight : 0;
    const searchBarBottom = searchBar ? searchBar.offsetTop + searchBarHeight : 0;

    // Adjust collapse point by 25% of the search bar height
    const adjustedCollapsePoint = searchBarBottom - (searchBarHeight * 0.15);

    // Collapse the search bar when the user scrolls past the adjusted point
    if (window.scrollY > adjustedCollapsePoint) {
      setIsCollapsed(true); // Collapse the search bar
    } else if (window.scrollY === 0) {
      setIsCollapsed(false); // Expand the search bar when scrolled to the top
    }
  };

  // useEffect to add and clean up the scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };


  const handleSearch = async () => {
    setErrorMessage('');

    // Check if shadow Pokémon are selected for trade or wanted
    if (isShadow && (ownershipStatus === 'trade' || ownershipStatus === 'wanted')) {
      setErrorMessage('Shadow Pokémon cannot be listed for trade or wanted');
      return;
    }

    if (!pokemon) {
      setErrorMessage('Please provide a Pokémon name.');
      return;
    }

    if (!useCurrentLocation && !city) {
      setErrorMessage('Please provide a location or use your current location.');
      return;
    }

    let locationCoordinates = coordinates;

    if (!useCurrentLocation) {
      try {
        const query = city;
        const response = await axios.get(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`,
          { withCredentials: false }
        );

        if (response.data?.features?.length > 0) {
          const [lon, lat] = response.data.features[0].geometry.coordinates;
          locationCoordinates = { latitude: lat, longitude: lon };
        } else {
          setErrorMessage('No results found for the location.');
          return;
        }
      } catch (error) {
        setErrorMessage('Error fetching GPS coordinates. Please try again.');
        return;
      }
    }

    const storedData = localStorage.getItem('pokemonData');
    if (!storedData) {
      setErrorMessage('No Pokémon data found in local storage.');
      return;
    }

    const pokemonData = JSON.parse(storedData).data;

    const matchingPokemon = pokemonData.find(
      (p) =>
        p.name?.toLowerCase() === pokemon.toLowerCase() &&
        (!selectedForm || p.form?.toLowerCase() === selectedForm.toLowerCase())
    );

    if (!matchingPokemon) {
      setErrorMessage('No matching Pokémon found.');
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
      attack_iv: stats.attack !== null ? stats.attack : null,
      defense_iv: stats.defense !== null ? stats.defense : null,
      stamina_iv: stats.stamina !== null ? stats.stamina : null,
      only_matching_trades: onlyMatchingTrades ? true : null,
      pref_lucky: prefLucky ? true : null,
      friendship_level: friendshipLevel,
      already_registered: alreadyRegistered ? true : null,
      trade_in_wanted_list: tradeInWantedList ? true : null,
      latitude: locationCoordinates.latitude,
      longitude: locationCoordinates.longitude,
      ownership: ownershipStatus,
      range_km: range,
      limit: resultsLimit,
    };

    // Set irrelevant parameters to null based on ownershipStatus
    if (ownershipStatus !== 'owned') {
      queryParams.attack_iv = null;
      queryParams.defense_iv = null;
      queryParams.stamina_iv = null;
    }

    if (ownershipStatus !== 'trade') {
      queryParams.only_matching_trades = null;
    }

    if (ownershipStatus !== 'wanted') {
      queryParams.pref_lucky = null;
      queryParams.friendship_level = null;
      queryParams.already_registered = null;
      queryParams.trade_in_wanted_list = null;
    }

    console.log('Search Query Parameters:', queryParams);
  
    // Call onSearch and collapse the search bar upon success
    onSearch(queryParams);
    setIsCollapsed(true); // Collapse after a successful search
  };

  return (
    <div className="pokemon-search-bar sticky">
      <div ref={collapsibleRef} className={`collapsible-container ${isCollapsed ? 'collapsed' : ''}`}>
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
                  ownershipStatus={ownershipStatus}
                  setOwnershipStatus={setOwnershipStatus}
                  stats={stats}
                  setStats={setStats}
                  isHundo={isHundo}
                  setIsHundo={setIsHundo}
                  onlyMatchingTrades={onlyMatchingTrades}
                  setOnlyMatchingTrades={setOnlyMatchingTrades}
                  prefLucky={prefLucky}
                  setPrefLucky={setPrefLucky}
                  alreadyRegistered={alreadyRegistered}
                  setAlreadyRegistered={setAlreadyRegistered}
                  tradeInWantedList={tradeInWantedList}
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
                  ownershipStatus={ownershipStatus}
                  setOwnershipStatus={setOwnershipStatus}
                  stats={stats}
                  setStats={setStats}
                  isHundo={isHundo}
                  setIsHundo={setIsHundo}
                  onlyMatchingTrades={onlyMatchingTrades}
                  setOnlyMatchingTrades={setOnlyMatchingTrades}
                  prefLucky={prefLucky}
                  setPrefLucky={setPrefLucky}
                  alreadyRegistered={alreadyRegistered}
                  setAlreadyRegistered={setAlreadyRegistered}
                  tradeInWantedList={tradeInWantedList}
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