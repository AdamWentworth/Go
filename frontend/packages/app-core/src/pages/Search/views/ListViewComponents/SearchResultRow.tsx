import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConfirmationOverlay from '../ConfirmationOverlay';
import MiniMap from './MiniMap';

type SearchResultMapInstance = 'caught' | 'trade' | 'wanted';
type SearchResultNavigationInstance = 'Caught' | 'Trade' | 'Wanted';

type SearchResultRowProps = {
  className?: string;
  username?: string;
  instanceId?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  mapInstanceData: SearchResultMapInstance;
  navigationInstanceData: SearchResultNavigationInstance;
  pokemonDisplayName: string;
  rightColumn?: React.ReactNode;
  children: React.ReactNode;
};

const SearchResultRow: React.FC<SearchResultRowProps> = ({
  className,
  username,
  instanceId,
  distance,
  latitude,
  longitude,
  mapInstanceData,
  navigationInstanceData,
  pokemonDisplayName,
  rightColumn,
  children,
}) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleCenterColumnKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenConfirmation();
    }
  };

  const handleConfirmNavigation = () => {
    navigate(`/pokemon/${username ?? ''}`, {
      state: {
        instanceId: instanceId ?? '',
        instanceData: navigationInstanceData,
      },
    });
    setShowConfirmation(false);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className={['list-view-row', className].filter(Boolean).join(' ')}>
      <div className="left-column">
        {typeof distance === 'number' && distance > 0 && (
          <p>Distance: {distance.toFixed(2)} km</p>
        )}
        <MiniMap latitude={latitude} longitude={longitude} instanceData={mapInstanceData} />
      </div>

      <div
        className="center-column"
        onClick={handleOpenConfirmation}
        onKeyDown={handleCenterColumnKeyDown}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>

      <div className="right-column">{rightColumn}</div>

      {showConfirmation && (
        <ConfirmationOverlay
          username={username ?? ''}
          pokemonDisplayName={pokemonDisplayName}
          instanceId={instanceId ?? ''}
          onConfirm={handleConfirmNavigation}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
};

export default SearchResultRow;
