// locationSuggestions.ts

import axios from 'axios';
import { createScopedLogger } from '@/utils/logger';
import type {
  LocationBase,
  LocationSuggestion,
  LocationResponse,
} from '@/types/location';

const BASE_URL = import.meta.env.VITE_LOCATION_SERVICE_URL;
const log = createScopedLogger('locationServices');

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
        const displayName = [item.name || item.city, item.state_or_province, item.country]
          .filter(Boolean)
          .join(', ');

        return {
          displayName,
          ...item,
        };
      });

      return formattedSuggestions;
    } else {
      if (import.meta.env.VITE_LOG_WARNINGS === 'true') {
        log.warn('Unexpected data format:', data);
      }
      return [];
    }
  } catch (error) {
    log.error('Error fetching suggestions:', error);
    return [];
  }
};

export const fetchLocationOptions = async (
  latitude: number,
  longitude: number
): Promise<LocationSuggestion[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/reverse?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch location options: ${response.statusText}`);
    }

    const data: LocationResponse = await response.json();
    const locations = data.locations || [];

    return locations.map((item: LocationBase) => {
      const displayName = [item.name || item.city, item.state_or_province, item.country]
        .filter(Boolean)
        .join(', ');

      return {
        displayName: displayName || 'Unknown location',
        ...item,
      };
    });
  } catch (error) {
    if (error instanceof Error) {
      log.error('Error fetching location options:', error.message);
      throw error;
    } else {
      log.error('Unknown error fetching location options');
      throw new Error('Unknown error occurred while fetching location options.');
    }
  }
};
