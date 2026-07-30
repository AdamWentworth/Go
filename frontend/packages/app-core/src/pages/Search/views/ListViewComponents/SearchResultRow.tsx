import React from 'react';
import { useNavigate } from 'react-router';

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
  navigationInstanceData,
  pokemonDisplayName,
  rightColumn,
  children,
}) => {
  const navigate = useNavigate();
  const canTrade = navigationInstanceData === 'Trade' || navigationInstanceData === 'Wanted';

  const viewPokemon = () => {
    navigate(`/pokemon/${username ?? ''}`, {
      state: {
        instanceId: instanceId ?? '',
        instanceData: navigationInstanceData,
      },
    });
  };

  const findTrade = () => {
    const params = new URLSearchParams({ section: 'matches' });
    if (instanceId) params.set('candidate_instance_id', instanceId);
    navigate(`/trades?${params.toString()}`);
  };

  return (
    <article className={['list-view-row', className].filter(Boolean).join(' ')}>
      <header className="search-result-identity">
        <div>
          <span>{navigationInstanceData === 'Trade' ? 'For trade' : navigationInstanceData}</span>
          <strong>{username || 'Trainer'}</strong>
        </div>
        {typeof distance === 'number' && distance > 0 ? (
          <span>{distance.toFixed(1)} km away</span>
        ) : null}
      </header>

      <div className="center-column">{children}</div>
      {rightColumn ? <div className="right-column">{rightColumn}</div> : null}

      <footer className="search-result-actions">
        <button type="button" onClick={() => navigate(`/profile/${username ?? ''}`)}>
          View profile
        </button>
        <button type="button" onClick={viewPokemon}>
          View {pokemonDisplayName}
        </button>
        {canTrade ? (
          <button type="button" className="primary" onClick={findTrade}>
            Find trade
          </button>
        ) : null}
      </footer>
    </article>
  );
};

export default SearchResultRow;
