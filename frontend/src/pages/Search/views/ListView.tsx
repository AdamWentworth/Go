import React, { useEffect, useMemo, useRef } from 'react';
import './ListView.base.css';
import './ListView.responsive.css';
import CaughtListView from './ListViewComponents/CaughtListView';
import TradeListView from './ListViewComponents/TradeListView';
import WantedListView from './ListViewComponents/WantedListView';
import { findVariantForInstance } from '../utils/findVariantForInstance';
import { normalizeOwnershipMode } from '../utils/ownershipMode';
import { RenderProfiler } from '@/components/dev/RenderProfiler';

import type { PokemonVariant } from '@/types/pokemonVariants';

type ListViewItem = Record<string, unknown>;

type ListViewProps = {
  data: ListViewItem[];
  instanceData: 'caught' | 'trade' | 'wanted' | string;
  hasSearched: boolean;
  pokemonCache: PokemonVariant[] | null;
  scrollToTopTrigger: number;
};

const ListView: React.FC<ListViewProps> = ({
  data,
  instanceData,
  hasSearched,
  pokemonCache,
  scrollToTopTrigger,
}) => {
  const ownershipMode = normalizeOwnershipMode(instanceData as Parameters<
    typeof normalizeOwnershipMode
  >[0]);
  const listViewRef = useRef<HTMLDivElement | null>(null);
  const pokemonVariants = useMemo<PokemonVariant[]>(
    () => pokemonCache ?? [],
    [pokemonCache],
  );

  useEffect(() => {
    if (listViewRef.current && typeof listViewRef.current.scrollTo === 'function') {
      listViewRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [scrollToTopTrigger]);

  const findPokemonByKey = (
    keyOrInstanceId?: string | null,
    instanceLike?: Parameters<typeof findVariantForInstance>[2],
  ) => findVariantForInstance(pokemonVariants, keyOrInstanceId, instanceLike);

  if (!hasSearched && data.length === 0) {
    return (
      <div className="no-data-container">
        <p>Use the Toolbar above to Discover Pokemon near you and Around the World!</p>
      </div>
    );
  }

  if (hasSearched && data.length === 0) {
    return (
      <div className="no-data-container">
        <p>No Pokemon found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="list-view-container" ref={listViewRef}>
      {data.map((item, index) => {
        const instanceId =
          typeof item.instance_id === 'string' && item.instance_id
            ? item.instance_id
            : `${ownershipMode}-${index}`;
        if (ownershipMode === 'caught') {
          return (
            <RenderProfiler key={instanceId} id="Search.CaughtListRow">
              <CaughtListView item={item} />
            </RenderProfiler>
          );
        }
        if (ownershipMode === 'trade') {
          return (
            <RenderProfiler key={instanceId} id="Search.TradeListRow">
              <TradeListView item={item} findPokemonByKey={findPokemonByKey} />
            </RenderProfiler>
          );
        }
        if (ownershipMode === 'wanted') {
          return (
            <RenderProfiler key={instanceId} id="Search.WantedListRow">
              <WantedListView item={item} findPokemonByKey={findPokemonByKey} />
            </RenderProfiler>
          );
        }
        return null;
      })}
    </div>
  );
};

export default React.memo(ListView);
