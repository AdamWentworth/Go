// LocationOptionsOverlay.tsx

import { FC } from 'react';
import './LocationOptionsOverlay.css';
import type { LocationSuggestion } from '../../types/location';

interface LocationOptionsOverlayProps {
  locations: LocationSuggestion[];
  onLocationSelect: (location: LocationSuggestion) => void;
  onDismiss: () => void;
}

const LocationOptionsOverlay: FC<LocationOptionsOverlayProps> = ({
  locations,
  onLocationSelect,
  onDismiss,
}) => {
  return (
    <div className="location-options-overlay">
      <h4>Select a location:</h4>
      <button className="dismiss-options-button" onClick={onDismiss}>
        Dismiss Options
      </button>
      <ul>
        {locations.map((location, index) => (
          <li key={index}>
            <button
              className="location-button"
              onClick={() => onLocationSelect(location)}
            >
              {location.name || 'Unnamed Location'}
              {location.state_or_province ? `, ${location.state_or_province}` : ''}
              {location.country ? `, ${location.country}` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LocationOptionsOverlay;
