// LocationCaught.tsx

import React, { useEffect, useRef, useState } from 'react';
import './LocationCaught.css';
import { fetchSuggestions } from '../../services/locationServices';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

type VariantWithInstance = PokemonVariant & { instanceData: PokemonInstance };

export interface LocationCaughtProps {
  pokemon: VariantWithInstance;
  editMode: boolean;
  onLocationChange: (location: string) => void;
}

const LocationCaught: React.FC<LocationCaughtProps> = ({
  pokemon,
  editMode,
  onLocationChange,
}) => {
  const [location, setLocation] = useState(
    pokemon.instanceData.location_caught ?? '',
  );
  const [suggestions, setSuggestions] = useState<{ displayName: string }[]>([]);
  const [userFocus, setUserFocus] = useState(false);

  const locationRef = useRef<HTMLSpanElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* keep local state in sync with prop */
  useEffect(() => {
    setLocation(pokemon.instanceData.location_caught ?? '');
  }, [pokemon]);

  /* close suggestions on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* caret to end when entering edit mode */
  useEffect(() => {
    if (editMode && locationRef.current) {
      locationRef.current.textContent = location;
      if (userFocus) {
        const range = document.createRange();
        range.selectNodeContents(locationRef.current);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        locationRef.current.focus();
      }
    }
  }, [editMode, location, userFocus]);

  /* handlers ------------------------------------------------------ */
  const handleInput = async (e: React.FormEvent<HTMLSpanElement>) => {
    const value = e.currentTarget.textContent ?? '';
    setLocation(value);
    onLocationChange(value);

    if (value.length > 2) {
      try {
        setSuggestions(await fetchSuggestions(value));
      } catch {
        setSuggestions([]);
      }
    } else setSuggestions([]);
  };

  const pick = (s: { displayName: string }) => {
    setLocation(s.displayName);
    onLocationChange(s.displayName);
    if (locationRef.current) locationRef.current.textContent = s.displayName;
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      locationRef.current?.blur();
      setUserFocus(false);
    }
  };

  /* -------------------------------------------------------------- */
  /*  render                                                        */
  /* -------------------------------------------------------------- */

  // 👉  If not editing and no location saved, render nothing.
  if (!editMode && location.trim() === '') return null;

  return (
    <div className="location-caught-container" ref={wrapperRef}>
      <div className="location-field">
        <label id="location-label">Location&nbsp;Caught:</label>

        <span
          aria-labelledby="location-label"
          contentEditable={editMode}
          ref={locationRef}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onClick={() => setUserFocus(true)}
          onTouchStart={() => setUserFocus(true)}
          role="textbox"
          suppressContentEditableWarning
          className={editMode ? 'editable' : 'text'}
        >
          {location}
        </span>

        {editMode && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="suggestion-item"
                onClick={() => pick(s)}
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
