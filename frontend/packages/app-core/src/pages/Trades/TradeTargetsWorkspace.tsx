import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { getFilteredPokemonsByOwnership } from '@/hooks/filtering/usePokemonOwnershipFilter';
import TradeTargetsPanel from '@/pages/Pokemon/features/instances/components/Trade/TradeTargetsPanel';
import WantedDetails from '@/pages/Pokemon/features/instances/components/Wanted/WantedDetails';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { getStoredUsername } from '@/utils/storage';

import './TradeTargetsWorkspace.css';

type TargetMode = 'trade' | 'wanted';
type TargetPokemon = PokemonVariant & { instanceData: PokemonInstance };
type BooleanMap = Record<string, boolean>;

const getInstanceId = (pokemon: TargetPokemon): string =>
  String(pokemon.instanceData.instance_id ?? '');

const sortByPokedexNumber = (pokemon: TargetPokemon[]): TargetPokemon[] =>
  [...pokemon].sort((left, right) =>
    left.pokedex_number - right.pokedex_number ||
    left.name.localeCompare(right.name) ||
    left.variant_id.localeCompare(right.variant_id) ||
    getInstanceId(left).localeCompare(getInstanceId(right)));

const toBooleanMap = (value: Record<string, unknown> | null | undefined): BooleanMap =>
  Object.fromEntries(
    Object.entries(value ?? {}).filter((entry): entry is [string, boolean] =>
      typeof entry[1] === 'boolean'),
  );

const toTradeTargetsPokemon = (
  pokemon: TargetPokemon,
): ComponentProps<typeof TradeTargetsPanel>['pokemon'] => ({
  ...pokemon,
  instanceData: {
    ...pokemon.instanceData,
    not_wanted_list: toBooleanMap(pokemon.instanceData.not_wanted_list),
    wanted_filters: toBooleanMap(pokemon.instanceData.wanted_filters),
  },
});

const toWantedDetailsPokemon = (
  pokemon: TargetPokemon,
): ComponentProps<typeof WantedDetails>['pokemon'] => ({
  ...pokemon,
  instanceData: {
    ...pokemon.instanceData,
    not_trade_list: toBooleanMap(pokemon.instanceData.not_trade_list),
    trade_filters: toBooleanMap(pokemon.instanceData.trade_filters),
  },
});

const normalizeLinkedPokemon = (
  value: Record<string, unknown>,
): TargetPokemon | null => {
  const instanceData = (
    value.instanceData && typeof value.instanceData === 'object'
      ? value.instanceData
      : value.ownershipStatus
  );
  if (!instanceData || typeof instanceData !== 'object') return null;
  const instance = instanceData as PokemonInstance;
  if (!instance.instance_id) return null;
  return {
    ...(value as unknown as PokemonVariant),
    instanceData: instance,
  };
};

function TradeTargetsWorkspace() {
  const instances = useInstancesStore((state) => state.instances);
  const tags = useTagsStore((state) => state.tags);
  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);
  const [mode, setMode] = useState<TargetMode>('trade');
  const [selectedPokemon, setSelectedPokemon] = useState<TargetPokemon | null>(null);

  const tradePokemon = useMemo(
    () => sortByPokedexNumber(
      getFilteredPokemonsByOwnership(
        variants,
        instances,
        'trade',
        tags,
      ) as TargetPokemon[],
    ),
    [instances, tags, variants],
  );
  const wantedPokemon = useMemo(
    () => sortByPokedexNumber(
      getFilteredPokemonsByOwnership(
        variants,
        instances,
        'wanted',
        tags,
      ) as TargetPokemon[],
    ),
    [instances, tags, variants],
  );
  const visiblePokemon = mode === 'trade' ? tradePokemon : wantedPokemon;

  useEffect(() => {
    setSelectedPokemon((current) => {
      if (current) {
        const currentId = getInstanceId(current);
        const refreshed = visiblePokemon.find(
          (pokemon) => getInstanceId(pokemon) === currentId,
        );
        if (refreshed) return refreshed;
      }
      return visiblePokemon[0] ?? null;
    });
  }, [visiblePokemon]);

  const openLinkedPokemon = (
    nextMode: TargetMode,
    value: Record<string, unknown>,
  ) => {
    const normalized = normalizeLinkedPokemon(value);
    if (!normalized) return;
    setMode(nextMode);
    setSelectedPokemon(normalized);
  };

  if (variantsLoading) {
    return <p className="trade-targets-state">Loading your trade targets…</p>;
  }

  return (
    <section className="trade-targets-workspace" aria-labelledby="trade-preferences-heading">
      <header className="trade-targets-heading">
        <div>
          <h1 id="trade-preferences-heading">Trade Preferences</h1>
          <p>Choose acceptable matches for each For Trade and Wanted Pokémon.</p>
        </div>
        <div className="trade-target-mode" aria-label="Target list type">
          <button
            type="button"
            className={mode === 'trade' ? 'active' : ''}
            onClick={() => setMode('trade')}
          >
            For Trade ({tradePokemon.length})
          </button>
          <button
            type="button"
            className={mode === 'wanted' ? 'active' : ''}
            onClick={() => setMode('wanted')}
          >
            Wanted ({wantedPokemon.length})
          </button>
        </div>
      </header>

      {visiblePokemon.length === 0 ? (
        <p className="trade-targets-state">
          {mode === 'trade'
            ? 'Mark a Pokémon as For Trade to configure its targets here.'
            : 'Add a Wanted Pokémon to configure acceptable offers here.'}
        </p>
      ) : (
        <div className="trade-targets-layout">
          <nav className="trade-target-entry-list" aria-label={`${mode} Pokémon`}>
            {visiblePokemon.map((pokemon) => {
              const instanceId = getInstanceId(pokemon);
              return (
                <button
                  type="button"
                  key={instanceId}
                  className={
                    selectedPokemon && getInstanceId(selectedPokemon) === instanceId
                      ? 'active'
                      : ''
                  }
                  onClick={() => setSelectedPokemon(pokemon)}
                >
                  {pokemon.currentImage ? <img src={pokemon.currentImage} alt="" /> : null}
                  <span>
                    <strong>{pokemon.name}</strong>
                    <small>{pokemon.instanceData.nickname || `CP ${pokemon.instanceData.cp ?? '—'}`}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="trade-target-editor">
            {selectedPokemon && mode === 'trade' ? (
              <TradeTargetsPanel
                key={`trade:${getInstanceId(selectedPokemon)}`}
                pokemon={toTradeTargetsPokemon(selectedPokemon)}
                lists={tags}
                instances={instances}
                sortType="number"
                sortMode="ascending"
                openTradeTargetOverlay={(pokemon) => openLinkedPokemon('wanted', pokemon)}
                variants={variants}
                isEditable
                username={getStoredUsername() ?? ''}
              />
            ) : null}
            {selectedPokemon && mode === 'wanted' ? (
              <WantedDetails
                key={`wanted:${getInstanceId(selectedPokemon)}`}
                pokemon={toWantedDetailsPokemon(selectedPokemon)}
                lists={tags}
                instances={instances}
                sortType="number"
                sortMode="ascending"
                openTradeOverlay={(pokemon) => openLinkedPokemon('trade', pokemon)}
                variants={variants}
                isEditable
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export default TradeTargetsWorkspace;
