// services/locationService.js

export const fetchLocationOptions = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_LOCATION_SERVICE_URL}/reverse?lat=${latitude}&lon=${longitude}`
      );
  
      if (!response.ok) {
        throw new Error(`Failed to fetch location options: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data.locations || [];
    } catch (error) {
      console.error('Error fetching location options:', error.message);
      throw error; // Rethrow error for handling in components
    }
  };
  