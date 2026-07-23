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
  const suggestionRequestRef = useRef(0);

  useEffect(() => {
    setLocation(pokemon.instanceData?.location_caught ?? '');
  }, [pokemon]);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  const updateLocation = async (value: string) => {
    const requestId = ++suggestionRequestRef.current;
    setLocation(value);
    onLocationChange(value);

    if (value.length > 2) {
      try {
        const nextSuggestions = await fetchSuggestions(value);
        if (requestId === suggestionRequestRef.current) {
          setSuggestions(nextSuggestions);
        }
      } catch {
        if (requestId === suggestionRequestRef.current) {
          setSuggestions([]);
        }
      }
      return;
    }

    setSuggestions([]);
  };

  const pick = (s: { displayName: string }) => {
    suggestionRequestRef.current += 1;
    setLocation(s.displayName);
    onLocationChange(s.displayName);
    setSuggestions([]);
    locationRef.current?.blur();
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
                suggestionRequestRef.current += 1;
                setSuggestions([]);
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
          <div className="suggestions" role="listbox" aria-label="Location suggestions">
            {suggestions.map((s, i) => (
              <button
                type="button"
                key={`${s.displayName}-${i}`}
                className="suggestion-item"
                role="option"
                aria-selected="false"
                onPointerDown={(event) => {
                  event.preventDefault();
                  pick(s);
                }}
                onClick={(event) => {
                  if (event.detail === 0) {
                    pick(s);
                  }
                }}
              >
                {s.displayName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationCaught;
