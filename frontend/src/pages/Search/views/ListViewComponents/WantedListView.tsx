import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniMap from './MiniMap';
import MoveDisplay from '@/components/pokemonComponents/MoveDisplay';
import Gender from '@/components/pokemonComponents/Gender';
import CP from '@/components/pokemonComponents/CP';
import FriendshipLevel from '@/components/pokemonComponents/FriendshipLevel';
import ConfirmationOverlay from '../ConfirmationOverlay';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import {
  formatWantedDate,
  getWantedTradeEntries,
  hasWantedAdditionalDetails,
  toWantedGender,
  type MatchedPokemon,
  type WantedListItem,
  type WantedTradeEntry,
} from './wantedListViewHelpers';
import './WantedListView.css';

type WantedListViewProps = {
  item: WantedListItem;
  findPokemonByKey: (
    keyOrInstanceId?: string | null,
    instanceLike?: Record<string, unknown> | null,
  ) => MatchedPokemon | null;
};

const tradeBadgeStyle: React.CSSProperties = {
  position: 'absolute',
  top: '5%',
  right: '5%',
  width: '30%',
  height: '30%',
  zIndex: 1,
};

type WantedPokemonVisualProps = {
  item: WantedListItem;
  imageUrl: string | null | undefined;
  pokemonDisplayName: string;
  genderValue: React.ComponentProps<typeof Gender>['gender'];
  wrapLuckyBackdrop: boolean;
};

const WantedPokemonVisual: React.FC<WantedPokemonVisualProps> = ({
  item,
  imageUrl,
  pokemonDisplayName,
  genderValue,
  wrapLuckyBackdrop,
}) => {
  const luckyImage = (
    <img src="/images/lucky.png" alt="Lucky backdrop" className="lucky-backdrop" />
  );
  return (
    <div className="pokemon-image-container">
      {item.pref_lucky &&
        (wrapLuckyBackdrop ? (
          <div className="lucky-backdrop-wrapper">{luckyImage}</div>
        ) : (
          luckyImage
        ))}
      {imageUrl && (
        <img src={imageUrl} alt={pokemonDisplayName} className="pokemon-image" />
      )}
      {item.dynamax && (
        <img src="/images/dynamax.png" alt="Dynamax Badge" className="max-badge" />
      )}
      {item.gigantamax && (
        <img src="/images/gigantamax.png" alt="Gigantamax Badge" className="max-badge" />
      )}
      <p className="pokemon-name">
        {pokemonDisplayName}
        <Gender gender={genderValue} />
      </p>
    </div>
  );
};

type WantedTradeListProps = {
  tradeList?: Record<string, WantedTradeEntry> | null;
  findPokemonByKey: (
    keyOrInstanceId?: string | null,
    instanceLike?: Record<string, unknown> | null,
  ) => MatchedPokemon | null;
};

const WantedTradeList: React.FC<WantedTradeListProps> = ({
  tradeList,
  findPokemonByKey,
}) => {
  const entries = getWantedTradeEntries(tradeList);
  if (!entries.length) return null;
  return (
    <div className="trade-list-section">
      <h1>Trade Pokemon:</h1>
      <div className="trade-list">
        {entries.map(([tradeInstanceId, tradeListPokemon]) => {
          const matchedPokemon = findPokemonByKey(tradeInstanceId, tradeListPokemon);
          if (!matchedPokemon) return null;

          return (
            <div
              key={tradeInstanceId}
              className="trade-pokemon-container"
              style={{ position: 'relative' }}
            >
              {tradeListPokemon.dynamax && (
                <img
                  src="/images/dynamax.png"
                  alt="Dynamax"
                  style={tradeBadgeStyle}
                />
              )}

              {tradeListPokemon.gigantamax && (
                <img
                  src="/images/gigantamax.png"
                  alt="Gigantamax"
                  style={tradeBadgeStyle}
                />
              )}

              <img
                src={matchedPokemon.currentImage}
                alt={matchedPokemon.name}
                className={`trade-pokemon-image ${tradeListPokemon.match ? 'glowing-pokemon' : ''}`}
                title={`${matchedPokemon.form ? `${matchedPokemon.form} ` : ''}${matchedPokemon.name ?? ''}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const WantedListView: React.FC<WantedListViewProps> = ({ item, findPokemonByKey }) => {
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
  const genderValue = toWantedGender(item.gender);
  const hasAdditionalDetails = hasWantedAdditionalDetails(item);

  const handleOpenConfirmation = () => {
    setShowConfirmation(true);
  };

  const handleConfirmNavigation = () => {
    navigate(`/pokemon/${item.username ?? ''}`, {
      state: { instanceId: item.instance_id ?? '', instanceData: 'Wanted' },
    });
    setShowConfirmation(false);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="list-view-row wanted-list-view">
      <div className="left-column">
        {typeof item.distance === 'number' && item.distance > 0 && (
          <p>Distance: {item.distance.toFixed(2)} km</p>
        )}
        <MiniMap
          latitude={item.latitude}
          longitude={item.longitude}
          instanceData="wanted"
        />
      </div>

      <div className="center-column" onClick={handleOpenConfirmation}>
        <div className="card">
          <h3>{item.username}</h3>

          {hasAdditionalDetails ? (
            <div className="pokemon-columns">
              <div className="pokemon-first-column">
                {typeof item.cp === 'number' && item.cp > 0 && (
                  <CP cp={item.cp} editMode={false} onCPChange={onCPChange} />
                )}
                <WantedPokemonVisual
                  item={item}
                  imageUrl={imageUrl}
                  pokemonDisplayName={pokemonDisplayName}
                  genderValue={genderValue}
                  wrapLuckyBackdrop
                />
              </div>

              <div className="pokemon-second-column">
                {typeof item.friendship_level === 'number' && item.friendship_level > 0 && (
                  <div className="pokemon-friendship">
                    <FriendshipLevel
                      level={item.friendship_level}
                      prefLucky={Boolean(item.pref_lucky)}
                    />
                  </div>
                )}
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
                      {formatWantedDate(item.date_caught)}
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
              <WantedPokemonVisual
                item={item}
                imageUrl={imageUrl}
                pokemonDisplayName={pokemonDisplayName}
                genderValue={genderValue}
                wrapLuckyBackdrop={false}
              />
            </div>
          )}
        </div>
      </div>

      <div className="right-column">
        <WantedTradeList tradeList={item.trade_list} findPokemonByKey={findPokemonByKey} />
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

export default WantedListView;
