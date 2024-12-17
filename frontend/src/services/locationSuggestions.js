// locationSuggestions.js

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_LOCATION_SERVICE_URL;

export const fetchSuggestions = async (userInput) => {
  try {
    const normalizedInput = userInput.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const response = await axios.get(`${BASE_URL}/autocomplete?query=${encodeURIComponent(normalizedInput)}`, {
      withCredentials: false,
    });
    const data = response.data;

    if (Array.isArray(data)) {
      const formattedSuggestions = data.slice(0, 5).map(item => {
        const name = item.name || '';
        const state = item.state_or_province || '';
        const country = item.country || '';
        let displayName = `${name}`;
        if (state) displayName += `, ${state}`;
        if (country) displayName += `, ${country}`;
        return {
          displayName,
          ...item,
        };
      });
      return formattedSuggestions;
    } else {
      if (process.env.REACT_APP_LOG_WARNINGS === 'true') {
        console.warn('Unexpected data format:', data);
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};
