import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CP from '../../../../components/pokemonComponents/CP.jsx';
import MiniMap from './MiniMap.jsx';
import IV from '../../../../components/pokemonComponents/IV';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay.jsx';
import Gender from '../../../../components/pokemonComponents/Gender';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import ConfirmationOverlay from '../ConfirmationOverlay';
import './CaughtListView.css';

type CaughtListItem = {
  username?: string;
  instance_id?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  cp?: number;
  lucky?: boolean;
  dynamax?: boolean;
  gigantamax?: boolean;
  gender?: string;
  weight?: number;
  height?: number;
  fast_move_id?: number | null;
  charged_move1_id?: number | null;
  charged_move2_id?: number | null;
  attack_iv?: number | null;
  defense_iv?: number | null;
  stamina_iv?: number | null;
  location_caught?: string;
  date_caught?: string;
  pokemonInfo?: {
    name?: string;
    moves?: Array<{
      move_id: number;
      name: string;
      type: string;
      type_name: string;
      legacy?: boolean;
    }> | null;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type CaughtListViewProps = {
  item: CaughtListItem;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const CaughtListView: React.FC<CaughtListViewProps> = ({ item }) => {
  const navigate = useNavigate();
  const imageUrl = URLSelect(
    item.pokemonInfo as Parameters<typeof URLSelect>[0],
    item as Parameters<typeof URLSelect>[1],
  );
  const pokemonDisplayName = item.pokemonInfo
    ? getPokemonDisplayName(item as Parameters<typeof getPokemonDisplayName>[0])
    : 'Unknown Pokemon';
  const [showConfirmation, setShowConfirmation] = useState(false);
  const onCPChange = () => {};
  const onIvChange = () => {};

  const genderValue =
    item.gender === 'Male' ||
    item.gender === 'Female' ||
    item.gender === 'Both' ||
    item.gender === 'Any' ||
    item.gender === 'Genderless'
      ? item.gender
      : null;

  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleConfirmNavigation = () => {
    navigate(`/pokemon/${item.username ?? ''}`, {
      state: { instanceId: item.instance_id ?? '', instanceData: 'Caught' },
    });
    setShowConfirmation(false);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="list-view-row">
      <div className="left-column" onClick={(event) => event.stopPropagation()}>
        {typeof item.distance === 'number' && item.distance > 0 && (
          <p>Distance: {item.distance.toFixed(2)} km</p>
        )}
        <MiniMap
          latitude={item.latitude}
          longitude={item.longitude}
          instanceData="caught"
        />
      </div>

      <div className="center-column" onClick={handleOpenConfirmation}>
        <div className="card">
          <h3>{item.username}</h3>
          {typeof item.cp === 'number' && item.cp > 0 && (
            <CP cp={item.cp} editMode={false} onCPChange={onCPChange} />
          )}
          {item.pokemonInfo && (
            <div className="pokemon-image-container">
              {item.lucky && (
                <img
                  src="/images/lucky.png"
                  alt="Lucky backdrop"
                  className="lucky-backdrop"
                />
              )}
              {imageUrl && (
                <img src={imageUrl} alt={pokemonDisplayName} className="pokemon-image" />
              )}
              {item.dynamax && (
                <img
                  src="/images/dynamax.png"
                  alt="Dynamax Badge"
                  className="max-badge"
                />
              )}
              {item.gigantamax && (
                <img
                  src="/images/gigantamax.png"
                  alt="Gigantamax Badge"
                  className="max-badge"
                />
              )}
              <p className="pokemon-name">
                {pokemonDisplayName}
                <Gender gender={genderValue} />
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="right-column">
        <div className="weight-height-move-container">
          {typeof item.weight === 'number' && item.weight > 0 && (
            <div className="weight-height">
              <p>
                <strong>{item.weight}kg</strong> WEIGHT
              </p>
            </div>
          )}
          <MoveDisplay
            fastMoveId={item.fast_move_id ?? null}
            chargedMove1Id={item.charged_move1_id ?? null}
            chargedMove2Id={item.charged_move2_id ?? null}
            moves={item.pokemonInfo?.moves}
          />
          {typeof item.height === 'number' && item.height > 0 && (
            <div className="weight-height">
              <p>
                <strong>{item.height}m</strong> HEIGHT
              </p>
            </div>
          )}
        </div>
        <IV
          ivs={{
            Attack: item.attack_iv ?? null,
            Defense: item.defense_iv ?? null,
            Stamina: item.stamina_iv ?? null,
          }}
          onIvChange={onIvChange}
        />

        {item.location_caught && (
          <div className="location-caught">
            <p>
              <strong>Location Caught: </strong>
              {item.location_caught}
            </p>
          </div>
        )}

        {item.date_caught && (
          <div className="date-caught">
            <p>
              <strong>Date Caught: </strong>
              {formatDate(item.date_caught)}
            </p>
          </div>
        )}
      </div>

      {showConfirmation && (
        <ConfirmationOverlay
          username={item.username ?? ''}
          pokemonDisplayName={pokemonDisplayName}
          instanceId={item.instance_id ?? ''}
          onConfirm={handleConfirmNavigation}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
};

export default CaughtListView;
