import React, { useMemo } from 'react';
import CP from '@/components/pokemonComponents/CP';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import LinkedPokemonGrid, {
  type LinkedPokemonGridEntry,
} from './LinkedPokemonGrid';
import PokemonResultVisual, {
  toPokemonResultGender,
} from './PokemonResultVisual';
import PokemonResultDetails from './PokemonResultDetails';
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

            <PokemonResultDetails
              friendshipLevel={item.friendship_level}
              prefLucky={Boolean(item.pref_lucky)}
              weight={item.weight}
              height={item.height}
              fastMoveId={item.fast_move_id}
              chargedMove1Id={item.charged_move1_id}
              chargedMove2Id={item.charged_move2_id}
              moves={item.pokemonInfo?.moves}
              locationCaught={item.location_caught}
              dateCaught={item.date_caught}
              formatDate={formatWantedDate}
            />
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
