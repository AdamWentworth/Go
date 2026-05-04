import React, { useMemo } from 'react';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay';
import CP from '../../../../components/pokemonComponents/CP';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import LinkedPokemonGrid, {
  type LinkedPokemonGridEntry,
} from './LinkedPokemonGrid';
import PokemonResultVisual, {
  toPokemonResultGender,
} from './PokemonResultVisual';
import SearchResultRow from './SearchResultRow';
import { formatDateOnlySafe } from './wantedListViewHelpers';
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

const TradeListView: React.FC<TradeListViewProps> = ({ item, findPokemonByKey }) => {
  const imageUrl = URLSelect(
    item.pokemonInfo as Parameters<typeof URLSelect>[0],
    item as Parameters<typeof URLSelect>[1],
  );
  const pokemonDisplayName = item.pokemonInfo
    ? getPokemonDisplayName(item as Parameters<typeof getPokemonDisplayName>[0])
    : 'Unknown Pokemon';
  const onCPChange = () => {};
  const genderValue = toPokemonResultGender(item.gender);

  const hasAdditionalDetails =
    item.weight ||
    item.height ||
    item.fast_move_id ||
    item.charged_move1_id ||
    item.charged_move2_id ||
    item.location_caught ||
    item.date_caught;

  const wantedEntries = useMemo<LinkedPokemonGridEntry[]>(() => {
    return Object.entries(item.wanted_list ?? {}).reduce<LinkedPokemonGridEntry[]>(
      (entries, [wantedInstanceId, wantedListPokemon]) => {
        if (!wantedListPokemon) return entries;
        const matchedPokemon = findPokemonByKey(wantedInstanceId, wantedListPokemon);
        if (!matchedPokemon) return entries;
        entries.push({
          id: wantedInstanceId,
          currentImage: matchedPokemon.currentImage,
          name: matchedPokemon.name,
          form: matchedPokemon.form,
          dynamax: wantedListPokemon.dynamax,
          gigantamax: wantedListPokemon.gigantamax,
          match: wantedListPokemon.match,
        });
        return entries;
      },
      [],
    );
  }, [findPokemonByKey, item.wanted_list]);

  return (
    <SearchResultRow
      className="trade-list-view"
      username={item.username}
      instanceId={item.instance_id}
      distance={item.distance}
      latitude={item.latitude}
      longitude={item.longitude}
      mapInstanceData="trade"
      navigationInstanceData="Trade"
      pokemonDisplayName={pokemonDisplayName}
      rightColumn={
        item.wanted_list && (
          <LinkedPokemonGrid
            title="Wanted Pokemon:"
            sectionClassName="wanted-list-section"
            gridClassName="wanted-list"
            containerClassName="wanted-pokemon-container"
            imageClassName="wanted-pokemon-image"
            entries={wantedEntries}
          />
        )
      }
    >
      <div className="card">
        <h3>{item.username}</h3>

        {hasAdditionalDetails ? (
          <div className="pokemon-columns">
            <div className="pokemon-first-column">
              <PokemonResultVisual
                imageUrl={imageUrl}
                pokemonDisplayName={pokemonDisplayName}
                genderValue={genderValue}
                lucky={item.lucky}
                dynamax={item.dynamax}
                gigantamax={item.gigantamax}
                nameLayout="stacked"
                beforeImage={
                  item.cp != null && (
                    <CP cp={item.cp} editMode={false} onCPChange={onCPChange} />
                  )
                }
              />
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
                    {formatDateOnlySafe(item.date_caught, 'Unknown')}
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
              lucky={item.lucky}
              dynamax={item.dynamax}
              gigantamax={item.gigantamax}
            />
          </div>
        )}
      </div>
    </SearchResultRow>
  );
};

export default React.memo(TradeListView);
