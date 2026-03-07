import React, { useEffect, useRef, useState } from 'react';
import './LocationCaught.css';
import { fetchSuggestions } from '../../services/locationServices';

type PokemonWithLocation = {
  instanceData?: {
    location_caught?: string | null;
  };
};

export interface LocationCaughtProps {
  pokemon: PokemonWithLocation;
  editMode: boolean;
  onLocationChange: (location: string) => void;
}

const LocationCaught: React.FC<LocationCaughtProps> = ({
  pokemon,
  editMode,
  onLocationChange,
}) => {
  const [location, setLocation] = useState(pokemon.instanceData?.location_caught ?? '');
  const [suggestions, setSuggestions] = useState<{ displayName: string }[]>([]);

  const locationRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocation(pokemon.instanceData?.location_caught ?? '');
  }, [pokemon]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const updateLocation = async (value: string) => {
    setLocation(value);
    onLocationChange(value);

    if (value.length > 2) {
      try {
        setSuggestions(await fetchSuggestions(value));
      } catch {
        setSuggestions([]);
      }
      return;
    }

    setSuggestions([]);
  };

  const pick = (s: { displayName: string }) => {
    setLocation(s.displayName);
    onLocationChange(s.displayName);
    setSuggestions([]);
    locationRef.current?.focus({ preventScroll: true });
  };

  if (!editMode && location.trim() === '') return null;

  return (
    <div className="location-caught-container" ref={wrapperRef}>
      <div className="location-field">
        <label htmlFor="location-caught-input">Location&nbsp;Caught:</label>

        {editMode ? (
          <input
            id="location-caught-input"
            ref={locationRef}
            type="text"
            value={location}
            onChange={(e) => {
              void updateLocation(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                locationRef.current?.blur();
              }
            }}
            className="location-input editable"
            autoComplete="off"
          />
        ) : (
          <span className="location-display text">{location}</span>
        )}

        {editMode && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="suggestion-item"
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(s);
                }}
              >
                {s.displayName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationCaught;
