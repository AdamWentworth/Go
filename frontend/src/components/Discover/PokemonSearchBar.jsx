import React, { useState } from 'react';
import VariantSearch from './SearchParameters/VariantSearch';
import LocationSearch from './SearchParameters/LocationSearch';
import OwnershipSearch from './SearchParameters/OwnershipSearch';
import './PokemonSearchBar.css'; // Add your CSS for layout

const PokemonSearchBar = () => {
  // Form state
  const [pokemon, setPokemon] = useState('');
  const [isShiny, setIsShiny] = useState(false);
  const [isShadow, setIsShadow] = useState(false);
  const [costume, setCostume] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState('owned');

  const handleSearch = () => {
    const queryParams = {
      pokemon,
      shiny: isShiny,
      shadow: isShadow,
      costume,
      location: {
        country: useCurrentLocation ? 'current' : country,
        city: useCurrentLocation ? 'current' : city,
      },
      ownership: ownershipStatus,
    };

    console.log('API request parameters:', queryParams);
  };

  return (
    <div className="pokemon-search-bar">
      <div className="search-bar-container">
        {/* Left Section: Pokémon Variant */}
        <VariantSearch
          pokemon={pokemon}
          setPokemon={setPokemon}
          isShiny={isShiny}
          setIsShiny={setIsShiny}
          isShadow={isShadow}
          setIsShadow={setIsShadow}
          costume={costume}
          setCostume={setCostume}
        />

        {/* Middle Section: Location */}
        <LocationSearch
          country={country}
          setCountry={setCountry}
          city={city}
          setCity={setCity}
          useCurrentLocation={useCurrentLocation}
          setUseCurrentLocation={setUseCurrentLocation}
        />

        {/* Right Section: Ownership Status */}
        <OwnershipSearch
          ownershipStatus={ownershipStatus}
          setOwnershipStatus={setOwnershipStatus}
        />
      </div>

      {/* Search Button */}
      <div className="search-button">
        <button onClick={handleSearch}>Search</button>
      </div>
    </div>
  );
};

export default PokemonSearchBar;