import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniMap from './MiniMap';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay.jsx';
import Gender from '../../../../components/pokemonComponents/Gender';
import CP from '../../../../components/pokemonComponents/CP.jsx';
import ConfirmationOverlay from '../ConfirmationOverlay';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import './TradeListView.css';

type TradeListWantedEntry = {
  dynamax?: boolean;
  gigantamax?: boolean;
  match?: boolean;
  form?: string;
  name?: string;
  [key: string]: unknown;
};

type TradeListItem = {
  username?: string;
  instance_id?: string;
  distance?: number;
  latitude?: number;
  longitude?: number;
  cp?: number | null;
  lucky?: boolean;
  dynamax?: boolean;
  gigantamax?: boolean;
  gender?: string;
  weight?: number | null;
  height?: number | null;
  fast_move_id?: number | null;
  charged_move1_id?: number | null;
  charged_move2_id?: number | null;
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
  wanted_list?: Record<string, TradeListWantedEntry> | null;
  [key: string]: unknown;
};

type MatchedPokemon = {
  currentImage?: string;
  name?: string;
  form?: string | null;
};

type TradeListViewProps = {
  item: TradeListItem;
  findPokemonByKey: (
    keyOrInstanceId?: string | null,
    instanceLike?: Record<string, unknown> | null,
  ) => MatchedPokemon | null;
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const TradeListView: React.FC<TradeListViewProps> = ({ item, findPokemonByKey }) => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const imageUrl = URLSelect(
    item.pokemonInfo as Parameters<typeof URLSelect>[0],
    item as Parameters<typeof URLSelect>[1],
  );
  const pokemonDisplayName = item.pokemonInfo
    ? getPokemonDisplayName(item as Parameters<typeof getPokemonDisplayName>[0])
    : 'Unknown Pokemon';
  const onCPChange = () => {};

  const genderValue =
    item.gender === 'Male' ||
    item.gender === 'Female' ||
    item.gender === 'Both' ||
    item.gender === 'Any' ||
    item.gender === 'Genderless'
      ? item.gender
      : null;

  const hasAdditionalDetails =
    item.weight ||
    item.height ||
    item.fast_move_id ||
    item.charged_move1_id ||
    item.charged_move2_id ||
    item.location_caught ||
    item.date_caught;

  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleConfirmNavigation = () => {
    navigate(`/pokemon/${item.username ?? ''}`, {
      state: { instanceId: item.instance_id ?? '', instanceData: 'Trade' },
    });
    setShowConfirmation(false);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="list-view-row trade-list-view">
      <div className="left-column">
        {typeof item.distance === 'number' && item.distance > 0 && (
          <p>Distance: {item.distance.toFixed(2)} km</p>
        )}
        <MiniMap
          latitude={item.latitude}
          longitude={item.longitude}
          instanceData="trade"
        />
      </div>

      <div className="center-column" onClick={handleOpenConfirmation}>
        <div className="card">
          <h3>{item.username}</h3>

          {hasAdditionalDetails ? (
            <div className="pokemon-columns">
              <div className="pokemon-first-column">
                <div className="pokemon-image-container">
                  {item.cp != null && (
                    <CP cp={item.cp} editMode={false} onCPChange={onCPChange} />
                  )}
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
                  <div className="pokemon-name">
                    <p>{pokemonDisplayName}</p>
                    <Gender gender={genderValue} />
                  </div>
                </div>
              </div>

              <div className="pokemon-second-column">
                <div className="pokemon-weight-height">
                  {typeof item.weight === 'number' && item.weight > 0 && (
                    <div className="pokemon-weight">
                      <p>
                        <strong>{item.weight}kg</strong>
                      </p>
                      <p>WEIGHT</p>
                    </div>
                  )}
                  {typeof item.height === 'number' && item.height > 0 && (
                    <div className="pokemon-height">
                      <p>
                        <strong>{item.height}m</strong>
                      </p>
                      <p>HEIGHT</p>
                    </div>
                  )}
                </div>

                {(item.fast_move_id ||
                  item.charged_move1_id ||
                  item.charged_move2_id) && (
                  <div className="pokemon-moves">
                    <MoveDisplay
                      fastMoveId={item.fast_move_id ?? null}
                      chargedMove1Id={item.charged_move1_id ?? null}
                      chargedMove2Id={item.charged_move2_id ?? null}
                      moves={item.pokemonInfo?.moves}
                    />
                  </div>
                )}

                {item.location_caught && (
                  <div className="pokemon-location">
                    <p>
                      <strong>Location Caught: </strong>
                      {item.location_caught}
                    </p>
                  </div>
                )}

                {item.date_caught && (
                  <div className="pokemon-date">
                    <p>
                      <strong>Date Caught: </strong>
                      {formatDate(item.date_caught)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pokemon-single-column">
              {typeof item.cp === 'number' && item.cp > 0 && (
                <CP cp={item.cp} editMode={false} onCPChange={onCPChange} />
              )}
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
            </div>
          )}
        </div>
      </div>

      <div className="right-column">
        {item.wanted_list && (
          <div className="wanted-list-section">
            <h1>Wanted Pokemon:</h1>
            <div className="wanted-list">
              {Object.keys(item.wanted_list).map((wantedInstanceId) => {
                const wantedListPokemon = item.wanted_list?.[wantedInstanceId];
                const matchedPokemon = findPokemonByKey(
                  wantedInstanceId,
                  wantedListPokemon ?? null,
                );

                if (!wantedListPokemon || !matchedPokemon) return null;

                return (
                  <div
                    key={wantedInstanceId}
                    className="wanted-pokemon-container"
                    style={{ position: 'relative' }}
                  >
                    {wantedListPokemon.dynamax && (
                      <img
                        src="/images/dynamax.png"
                        alt="Dynamax"
                        style={{
                          position: 'absolute',
                          top: '5%',
                          right: '5%',
                          width: '30%',
                          height: '30%',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {wantedListPokemon.gigantamax && (
                      <img
                        src="/images/gigantamax.png"
                        alt="Gigantamax"
                        style={{
                          position: 'absolute',
                          top: '5%',
                          right: '5%',
                          width: '30%',
                          height: '30%',
                          zIndex: 1,
                        }}
                      />
                    )}

                    <img
                      src={matchedPokemon.currentImage}
                      alt={matchedPokemon.name}
                      className={`wanted-pokemon-image ${wantedListPokemon.match ? 'glowing-pokemon' : ''}`}
                      title={`${matchedPokemon.form ? `${matchedPokemon.form} ` : ''}${matchedPokemon.name ?? ''}`}
                    />
                  </div>
                );
              })}
            </div>
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

export default TradeListView;
