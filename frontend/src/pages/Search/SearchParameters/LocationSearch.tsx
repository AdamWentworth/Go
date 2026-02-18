import React, { useEffect, useRef, useState } from 'react';

import { fetchSuggestions } from '@/services/locationServices';
import { createScopedLogger } from '@/utils/logger';
import type { LocationSuggestion } from '@/types/location';
import { getStoredLocation } from '@/utils/storage';
import './LocationSearch.css';

type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

type ViewMode = 'list' | 'map';

type SuggestionWithCoordinates = LocationSuggestion & {
  latitude?: number | string | null;
  longitude?: number | string | null;
  boundary?: string | null;
};

type LocationSearchProps = {
  city: string;
  setCity: React.Dispatch<React.SetStateAction<string>>;
  useCurrentLocation: boolean;
  setUseCurrentLocation: React.Dispatch<React.SetStateAction<boolean>>;
  setCoordinates: React.Dispatch<React.SetStateAction<Coordinates>>;
  range: number;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  resultsLimit: number;
  setResultsLimit: React.Dispatch<React.SetStateAction<number>>;
  handleSearch: () => void | Promise<void>;
  isLoading: boolean;
  view: ViewMode;
  setView: React.Dispatch<React.SetStateAction<ViewMode>>;
  setSelectedBoundary?: React.Dispatch<React.SetStateAction<string | null>>;
};

const log = createScopedLogger('LocationSearch');

const toNumberOrNull = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const LocationSearch: React.FC<LocationSearchProps> = ({
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
  view: _view,
  setView: _setView,
  setSelectedBoundary,
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionWithCoordinates[]>([]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const handleLocationChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const userInput = event.target.value;
    setCity(userInput);

    if (userInput.length <= 2) {
      setSuggestions([]);
      return;
    }

    const fetchedSuggestions = await fetchSuggestions(userInput);
    setSuggestions(fetchedSuggestions as SuggestionWithCoordinates[]);
  };

  const selectSuggestion = (suggestion: SuggestionWithCoordinates) => {
    setCity(suggestion.displayName);

    const latitude = toNumberOrNull(suggestion.latitude);
    const longitude = toNumberOrNull(suggestion.longitude);

    setCoordinates({ latitude, longitude });

    if (typeof setSelectedBoundary === 'function') {
      setSelectedBoundary(suggestion.boundary ?? null);
    }

    setSuggestions([]);
  };

  const toggleUseCurrentLocation = () => {
    const nextUseCurrentLocation = !useCurrentLocation;
    setUseCurrentLocation(nextUseCurrentLocation);

    if (nextUseCurrentLocation) {
      setCity('');
      setSuggestions([]);

      const storedLocation = getStoredLocation();
      if (!storedLocation) {
        log.warn('No location found in localStorage');
        return;
      }

      const latitude = toNumberOrNull(storedLocation.latitude);
      const longitude = toNumberOrNull(storedLocation.longitude);

      setCoordinates({ latitude, longitude });
      log.debug(
        `Using current location: Latitude ${latitude}, Longitude ${longitude}`,
      );

      return;
    }

    setCoordinates({ latitude: null, longitude: null });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !wrapperRef.current.contains(target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleRangeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRange(Number(event.target.value));
  };

  const handleResultsLimitChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setResultsLimit(Number.parseInt(event.target.value, 10));
  };

  return (
    <div className="location-search" ref={wrapperRef}>
      <h3 className="location-header">Location</h3>

      <div className="location-container">
        <div className="location-button-centered">
          <button type="button" onClick={toggleUseCurrentLocation}>
            {useCurrentLocation
              ? 'Disable Current Location'
              : 'Use Current Location'}
          </button>
        </div>

        <div className="location-field">
          <div className="location-input">
            <input
              type="text"
              value={city}
              onChange={handleLocationChange}
              disabled={useCurrentLocation}
              placeholder="Enter location"
            />
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <div
                    key={`${suggestion.displayName}-${suggestion.latitude ?? 'na'}-${suggestion.longitude ?? 'na'}`}
                    className="suggestion-item"
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {suggestion.displayName}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sliders-container">
        <div className="range-field">
          <label>Range (km): {range}</label>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={range}
            onChange={handleRangeChange}
          />
        </div>

        <div className="results-limit">
          <label>Results Limit: {resultsLimit}</label>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={resultsLimit}
            onChange={handleResultsLimitChange}
          />
        </div>
      </div>

      <div className="location-search-button">
        <button type="button" onClick={handleSearch} disabled={isLoading}>
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
};

export default LocationSearch;
