import React, { useMemo } from 'react';
import MoveDisplay from '@/components/pokemonComponents/MoveDisplay';
import CP from '@/components/pokemonComponents/CP';
import FriendshipLevel from '@/components/pokemonComponents/FriendshipLevel';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import LinkedPokemonGrid, {
  type LinkedPokemonGridEntry,
} from './LinkedPokemonGrid';
import PokemonResultVisual, {
  toPokemonResultGender,
} from './PokemonResultVisual';
import SearchResultRow from './SearchResultRow';
import {
  formatWantedDate,
  getWantedTradeEntries,
  hasWantedAdditionalDetails,
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
  const entries = useMemo<LinkedPokemonGridEntry[]>(() => {
    return getWantedTradeEntries(tradeList).reduce<LinkedPokemonGridEntry[]>(
      (gridEntries, [tradeInstanceId, tradeListPokemon]) => {
        const matchedPokemon = findPokemonByKey(tradeInstanceId, tradeListPokemon);
        if (!matchedPokemon) return gridEntries;
        gridEntries.push({
          id: tradeInstanceId,
          currentImage: matchedPokemon.currentImage,
          name: matchedPokemon.name,
          form: matchedPokemon.form,
          dynamax: tradeListPokemon.dynamax,
          gigantamax: tradeListPokemon.gigantamax,
          match: tradeListPokemon.match,
        });
        return gridEntries;
      },
      [],
    );
  }, [findPokemonByKey, tradeList]);

  if (!entries.length) return null;
  return (
    <LinkedPokemonGrid
      title="Trade Pokemon:"
      sectionClassName="trade-list-section"
      gridClassName="trade-list"
      containerClassName="trade-pokemon-container"
      imageClassName="trade-pokemon-image"
      entries={entries}
    />
  );
};

const WantedListView: React.FC<WantedListViewProps> = ({ item, findPokemonByKey }) => {
  const imageUrl = URLSelect(
    item.pokemonInfo as Parameters<typeof URLSelect>[0],
    item as Parameters<typeof URLSelect>[1],
  );
  const pokemonDisplayName = item.pokemonInfo
    ? getPokemonDisplayName(item as Parameters<typeof getPokemonDisplayName>[0])
    : 'Unknown Pokemon';
  const onCPChange = () => {};
  const genderValue = toPokemonResultGender(item.gender);
  const hasAdditionalDetails = hasWantedAdditionalDetails(item);

  return (
    <SearchResultRow
      className="wanted-list-view"
      username={item.username}
      instanceId={item.instance_id}
      distance={item.distance}
      latitude={item.latitude}
      longitude={item.longitude}
      mapInstanceData="wanted"
      navigationInstanceData="Wanted"
      pokemonDisplayName={pokemonDisplayName}
      rightColumn={
        <WantedTradeList tradeList={item.trade_list} findPokemonByKey={findPokemonByKey} />
      }
    >
      <div className="card">
        <h3>{item.username}</h3>

        {hasAdditionalDetails ? (
          <div className="pokemon-columns">
            <div className="pokemon-first-column">
              {typeof item.cp === 'number' && item.cp > 0 && (
                <CP cp={item.cp} editMode={false} onCPChange={onCPChange} />
              )}
              <PokemonResultVisual
                imageUrl={imageUrl}
                pokemonDisplayName={pokemonDisplayName}
                genderValue={genderValue}
                lucky={item.pref_lucky}
                dynamax={item.dynamax}
                gigantamax={item.gigantamax}
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
            <PokemonResultVisual
              imageUrl={imageUrl}
              pokemonDisplayName={pokemonDisplayName}
              genderValue={genderValue}
              lucky={item.pref_lucky}
              dynamax={item.dynamax}
              gigantamax={item.gigantamax}
              wrapLuckyBackdrop={false}
            />
          </div>
        )}
      </div>
    </SearchResultRow>
  );
};

export default React.memo(WantedListView);
