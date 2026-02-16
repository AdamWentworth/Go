import React, { useEffect, useRef, useState } from 'react';
import './ListView.css';
import CaughtListView from './ListViewComponents/CaughtListView';
import TradeListView from './ListViewComponents/TradeListView';
import WantedListView from './ListViewComponents/WantedListView';
import { findVariantForInstance } from '../utils/findVariantForInstance';
import { normalizeOwnershipMode } from '../utils/ownershipMode';

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
  const [pokemonVariants, setPokemonVariants] = useState<PokemonVariant[]>([]);
  const listViewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pokemonCache) {
      setPokemonVariants(pokemonCache);
    }
  }, [pokemonCache]);

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
        if (ownershipMode === 'caught') {
          return <CaughtListView key={index} item={item} />;
        }
        if (ownershipMode === 'trade') {
          return (
            <TradeListView key={index} item={item} findPokemonByKey={findPokemonByKey} />
          );
        }
        if (ownershipMode === 'wanted') {
          return (
            <WantedListView key={index} item={item} findPokemonByKey={findPokemonByKey} />
          );
        }
        return null;
      })}
    </div>
  );
};

export default ListView;
