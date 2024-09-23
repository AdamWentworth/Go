// Discover.jsx

import React, { useState } from 'react';
import PokemonSearchBar from './PokemonSearchBar';
import ListView from './views/ListView';
import MapView from './views/MapView';
import axios from 'axios';

const Discover = () => {
  const [view, setView] = useState('list'); // 'list' or 'globe'
  const [searchResults, setSearchResults] = useState([]); // Ensure this is initialized as an empty array
  const [errorMessage, setErrorMessage] = useState(''); // State to hold error messages
  const [isLoading, setIsLoading] = useState(false); // State to handle loading status

  // Function to convert latitude and longitude into a city, country combination
  const getLocationName = async (latitude, longitude) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
        },
        withCredentials: false, // Set this to false to avoid CORS issues with credentials
      });

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

  // Function to handle the search logic and update search results
  const handleSearch = async (queryParams) => {
    setErrorMessage(''); // Clear previous error messages
    setIsLoading(true); // Set loading state

    // Log the query parameters being sent to the API
    console.log('API Request - Query Parameters:', queryParams);

    try {
      const response = await axios.get('http://localhost:3005/api/discoverPokemon', {
        params: queryParams,
        withCredentials: true, // Include cookies for authentication
      });

      // Log the raw API response for troubleshooting
      console.log('API Response:', response);

      if (response.status === 200) {
        const data = response.data;

        // Check if data is an object and has keys
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // Transform the API response into the sample data format
          const formattedData = await Promise.all(
            Object.values(data).map(async (item) => {
              // Log each item's coordinates for debugging
              console.log('Item Coordinates:', item.latitude, item.longitude);

              // Fetch the location name using the latitude and longitude
              const locationName = await getLocationName(
                item.latitude ? parseFloat(item.latitude) : 49.2608724, // Default to Vancouver latitude
                item.longitude ? parseFloat(item.longitude) : -123.113952 // Default to Vancouver longitude
              );

              return {
                name: item.username, // Replace with the Pokémon's name or appropriate field
                location: locationName, // Use the fetched location name
                isShiny: item.shiny, // Use shiny status from the API response
                coordinates: {
                  latitude: item.latitude ? parseFloat(item.latitude) : 49.2608724, // Default to Vancouver latitude
                  longitude: item.longitude ? parseFloat(item.longitude) : -123.113952, // Default to Vancouver longitude
                }
              };
            })
          );

          // Set the formatted data to the state
          setSearchResults(formattedData);
        } else {
          setSearchResults([]); // Set an empty array if the response is not as expected
          setErrorMessage('Unexpected response format.');
        }
      } else {
        setErrorMessage('Failed to retrieve search results.');
      }
    } catch (error) {
      console.error('Error during API request:', error);
      setErrorMessage('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false); // Re-enable the search button after the request
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