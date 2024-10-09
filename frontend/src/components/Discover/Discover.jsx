// Discover.jsx

import React, { useState } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import axios from 'axios';

const Discover = () => {
  const [view, setView] = useState('list');
  const [searchResults, setSearchResults] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Utility function to create a delay
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        'https://nominatim.openstreetmap.org/reverse',
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
          },
          withCredentials: false,
        }
      );

      if (response.status === 200 && response.data) {
        const { city, country } = response.data.address || {};
        return `${city || 'Unknown City'}, ${country || 'Unknown Country'}`;
      } else {
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error fetching location name:', error);
      return 'Unknown Location';
    }
  };

  const handleSearch = async (queryParams) => {
    setErrorMessage('');
    setIsLoading(true);

    // Log the query parameters being sent to the API
    console.log('API Request - Query Parameters:', queryParams);

    try {
      const response = await axios.get(
        'http://localhost:3005/api/discoverPokemon',
        {
          params: queryParams,
          withCredentials: true,
        }
      );

      // Log the raw API response for troubleshooting
      console.log('API Response:', response);

      if (response.status === 200) {
        let data = response.data;

        // Convert data to an array if it's an object
        const dataArray = Array.isArray(data) ? data : Object.values(data);

        if (dataArray && dataArray.length > 0) {
          const enrichedData = [];

          // Retrieve the local Pokémon data from localStorage
          const pokemonDataStored = JSON.parse(localStorage.getItem('pokemonData'));

          // Ensure we are working with the data array inside the pokemonData object
          if (pokemonDataStored && pokemonDataStored.data) {
            const pokemonDataArray = pokemonDataStored.data;

            // Assuming all items have the same pokemon_id, we look up the Pokémon once
            const firstItem = dataArray[0];
            const pokemonId = firstItem.pokemon_id;

            // Find the matching Pokémon data from localStorage
            const pokemonInfo = pokemonDataArray.find(
              (p) => p.pokemon_id === pokemonId
            );

            // Check if we found the Pokémon info
            if (!pokemonInfo) {
              throw new Error(`Pokémon with ID ${pokemonId} not found in localStorage.`);
            }

            // Prepare location names for all items
            for (const item of dataArray) {
              // Log each item's coordinates for debugging
              console.log('Item Coordinates:', item.latitude, item.longitude);

              const latitude = item.latitude
                ? parseFloat(item.latitude)
                : 49.2608724; // Default latitude
              const longitude = item.longitude
                ? parseFloat(item.longitude)
                : -123.113952; // Default longitude

              const locationName = await getLocationName(latitude, longitude);

              // Attach the Pokémon info and fetched location name to the item
              enrichedData.push({
                ...item,
                location: locationName,
                pokemonInfo,
              });

              // Delay for 1000ms before making the next API call to avoid spamming
              await delay(1000);
            }

            // Sort the results by distance (ascending order)
            enrichedData.sort((a, b) => a.distance - b.distance);

            // Set the sorted enriched data (with full objects) in the state
            setSearchResults(enrichedData);
          } else {
            throw new Error('pokemonData is not properly formatted in localStorage.');
          }
        } else {
          setSearchResults([]);
          setErrorMessage('No Pokémon found matching your criteria.');
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
      }
    } catch (error) {
      console.error('Error during API request:', error);
      setErrorMessage('An error occurred while searching. Please try again.');
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
      />

      {/* Conditionally render the views based on the current selection */}
      {view === 'list' ? (
        <ListView data={searchResults} />
      ) : (
        <MapView data={searchResults} />
      )}

      {/* Error message display */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
};

export default Discover;