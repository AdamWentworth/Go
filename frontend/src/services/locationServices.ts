// locationSuggestions.ts

import axios from 'axios';
import type {
  LocationBase,
  LocationSuggestion,
  LocationResponse,
} from '@/types/location';

const BASE_URL = import.meta.env.VITE_LOCATION_SERVICE_URL;

export const fetchSuggestions = async (
  userInput: string
): Promise<LocationSuggestion[]> => {
  try {
    const normalizedInput = userInput
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const response = await axios.get(
      `${BASE_URL}/autocomplete?query=${encodeURIComponent(normalizedInput)}`,
      {
        withCredentials: false,
      }
    );

    const data: unknown = response.data;

    if (Array.isArray(data)) {
      const formattedSuggestions: LocationSuggestion[] = data.slice(0, 5).map((item: LocationBase) => {
        const name = item.name || '';
        const state = item.state_or_province || '';
        const country = item.country || '';

        let displayName = name;
        if (state) displayName += `, ${state}`;
        if (country) displayName += `, ${country}`;

        return {
          displayName,
          ...item,
        };
      });

      return formattedSuggestions;
    } else {
      if (import.meta.env.VITE_LOG_WARNINGS === 'true') {
        console.warn('Unexpected data format:', data);
      }
      return [];
    }
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

export const fetchLocationOptions = async (
  latitude: number,
  longitude: number
): Promise<LocationBase[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/reverse?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch location options: ${response.statusText}`);
    }

    const data: LocationResponse = await response.json();
    return data.locations || [];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching location options:', error.message);
      throw error;
    } else {
      console.error('Unknown error fetching location options');
      throw new Error('Unknown error occurred while fetching location options.');
    }
  }
};