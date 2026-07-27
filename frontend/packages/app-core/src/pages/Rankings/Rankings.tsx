import React, { useMemo, useState } from 'react';
import {
  FaHeart,
  FaMedal,
  FaSearch,
  FaUsers,
} from 'react-icons/fa';
import type { PokemonCommunityRanking } from '@shared-contracts/search';
import { useBootstrapVariants } from '@/features/variants/hooks/useBootstrapVariants';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useCommunityRankings } from './hooks/useCommunityRankings';
import './Rankings.css';

type RankingMode = 'wanted' | 'rarest';

interface JoinedRanking extends PokemonCommunityRanking {
  variant: PokemonVariant;
}

type RankingWithVariant = PokemonCommunityRanking & {
  variant: PokemonVariant;
};

const INITIAL_RESULT_COUNT = 30;
const RESULT_INCREMENT = 30;
const FALLBACK_IMAGE = '/images/default_pokemon.png';

function formatFormName(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getRankingDisplayName(variant: PokemonVariant): string {
  const name = variant.name || variant.species_name;
  const form = String(variant.form || '').trim();
  if (!form) return name;

  const escapedForm = form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const formAlreadyNamed = new RegExp(
    `(?:^|[\\s(_-])${escapedForm}(?:$|[\\s)_-])`,
    'i',
  ).test(name);
  if (formAlreadyNamed) return name;

  return `${name} ${formatFormName(form)}`;
}

function getEvolutionIds(
  variant: PokemonVariant,
  key: 'evolves_from' | 'evolves_to',
): number[] {
  const source = variant as PokemonVariant & {
    evolutionData?: { evolves_from?: unknown; evolves_to?: unknown };
  };
  const values = source.evolutionData?.[key];
  if (!Array.isArray(values)) return [];
  return values.map(Number).filter(Number.isFinite);
}

export function collapseEvolutionFamilyRankings<T extends RankingWithVariant>(
  rows: T[],
  variants: PokemonVariant[],
): T[] {
  const speciesByID = new Map<number, PokemonVariant>();
  for (const variant of variants) {
    const pokemonID = Number(variant.pokemon_id);
    if (Number.isFinite(pokemonID) && !speciesByID.has(pokemonID)) {
      speciesByID.set(pokemonID, variant);
    }
  }

  const adjacency = new Map<number, Set<number>>();
  const connect = (left: number, right: number) => {
    if (!speciesByID.has(left) || !speciesByID.has(right)) return;
    if (!adjacency.has(left)) adjacency.set(left, new Set());
    if (!adjacency.has(right)) adjacency.set(right, new Set());
    adjacency.get(left)?.add(right);
    adjacency.get(right)?.add(left);
  };
  for (const [pokemonID, variant] of speciesByID) {
    for (const linkedID of [
      ...getEvolutionIds(variant, 'evolves_from'),
      ...getEvolutionIds(variant, 'evolves_to'),
    ]) {
      connect(pokemonID, linkedID);
    }
  }

  const familyKeyByID = new Map<number, number>();
  for (const pokemonID of speciesByID.keys()) {
    if (familyKeyByID.has(pokemonID)) continue;
    const family = new Set<number>();
    const pending = [pokemonID];
    while (pending.length > 0) {
      const current = pending.pop() as number;
      if (family.has(current)) continue;
      family.add(current);
      adjacency.get(current)?.forEach((linkedID) => pending.push(linkedID));
    }
    const familyKey = Math.min(...family);
    family.forEach((memberID) => familyKeyByID.set(memberID, familyKey));
  }

  const depthByID = new Map<number, number>();
  const getDepth = (pokemonID: number, trail = new Set<number>()): number => {
    const cached = depthByID.get(pokemonID);
    if (cached !== undefined) return cached;
    const variant = speciesByID.get(pokemonID);
    const parents = variant
      ? getEvolutionIds(variant, 'evolves_from').filter(
          (parentID) => speciesByID.has(parentID) && !trail.has(parentID),
        )
      : [];
    if (parents.length === 0) {
      depthByID.set(pokemonID, 0);
      return 0;
    }
    const nextTrail = new Set(trail);
    nextTrail.add(pokemonID);
    const depth =
      1 + Math.min(...parents.map((parentID) => getDepth(parentID, nextTrail)));
    depthByID.set(pokemonID, depth);
    return depth;
  };

  const selectedByGroup = new Map<string, T>();
  for (const row of rows) {
    const variantType = String(row.variant.variantType || 'default');
    if (variantType.includes('costume')) {
      selectedByGroup.set(`variant:${row.variant_id}`, row);
      continue;
    }

    const pokemonID = Number(row.variant.pokemon_id);
    const familyKey = familyKeyByID.get(pokemonID) ?? pokemonID;
    const form = String(row.variant.form || '').trim().toLowerCase();
    const groupKey = `${familyKey}:${variantType}:${form}`;
    const selected = selectedByGroup.get(groupKey);
    if (
      !selected ||
      getDepth(pokemonID) < getDepth(Number(selected.variant.pokemon_id))
    ) {
      selectedByGroup.set(groupKey, row);
    }
  }

  const selectedIDs = new Set(
    [...selectedByGroup.values()].map((row) => row.variant_id),
  );
  return rows.filter((row) => selectedIDs.has(row.variant_id));
}

export function prepareRankingsForMode<T extends RankingWithVariant>(
  mode: RankingMode,
  rows: T[],
  variants: PokemonVariant[],
): T[] {
  return mode === 'rarest'
    ? collapseEvolutionFamilyRankings(rows, variants)
    : rows;
}

function formatSnapshotTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';
  return `Updated ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)}`;
}

function RankingRow({
  entry,
  rank,
  mode,
  scaleMaximum,
  privacyThreshold,
}: {
  entry: JoinedRanking;
  rank: number;
  mode: RankingMode;
  scaleMaximum: number;
  privacyThreshold: number;
}) {
  const primaryCount =
    mode === 'wanted' ? entry.wanted_users : entry.caught_users;
  const primaryScaleCount = primaryCount ?? 0;
  const progress = Math.max(
    4,
    Math.round((primaryScaleCount / Math.max(scaleMaximum, 1)) * 100),
  );
  const image =
    entry.variant.currentImage || entry.variant.image_url || FALLBACK_IMAGE;
  const primaryLabel =
    primaryCount == null
      ? `Fewer than ${privacyThreshold} trainers want this`
      : mode === 'wanted'
      ? primaryCount === 0
        ? 'No trainers want this'
        : `${primaryCount.toLocaleString()} ${
            primaryCount === 1 ? 'trainer wants' : 'trainers want'
          } this`
      : `Owned by ${primaryCount.toLocaleString()} ${
          primaryCount === 1 ? 'trainer' : 'trainers'
        }`;
  const secondaryLabel =
    mode === 'wanted'
      ? `Owned by ${entry.caught_users.toLocaleString()} ${
          entry.caught_users === 1 ? 'trainer' : 'trainers'
        }`
      : null;

  return (
    <article
      className={`community-ranking-row community-ranking-row--rank-${Math.min(
        rank,
        4,
      )}`}
    >
      <div className="community-ranking-position" aria-label={`Rank ${rank}`}>
        {rank <= 3 && <FaMedal aria-hidden="true" />}
        <strong>{rank}</strong>
      </div>
      <div className="community-ranking-pokemon">
        <div className="community-ranking-artwork">
          <img
            className="community-ranking-artwork-pokemon"
            src={resolveAssetUrl(image)}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          {entry.variant.variantType.includes('gigantamax') && (
            <img
              className="community-ranking-form-icon"
              src="/images/gigantamax.png"
              alt="Gigantamax"
            />
          )}
          {!entry.variant.variantType.includes('gigantamax') &&
            entry.variant.variantType.includes('dynamax') && (
              <img
                className="community-ranking-form-icon"
                src="/images/dynamax.png"
                alt="Dynamax"
              />
            )}
        </div>
        <span>
          <strong>{getRankingDisplayName(entry.variant)}</strong>
        </span>
      </div>
      <div className="community-ranking-count">
        <strong>{primaryLabel}</strong>
        {secondaryLabel && <small>{secondaryLabel}</small>}
        <span aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </span>
      </div>
    </article>
  );
}

const Rankings: React.FC = () => {
  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);
  const [mode, setMode] = useState<RankingMode>('wanted');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULT_COUNT);
  const { data, error, loading, refresh } = useCommunityRankings(true);

  useBootstrapVariants();

  const variantsByID = useMemo(
    () => new Map(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );
  const sourceRows = useMemo(
    () => (mode === 'wanted' ? data?.most_wanted ?? [] : data?.rarest ?? []),
    [data, mode],
  );
  const matchedRows = useMemo(
    () =>
      sourceRows.flatMap<JoinedRanking>((entry) => {
        const variant = variantsByID.get(entry.variant_id);
        return variant ? [{ ...entry, variant }] : [];
      }),
    [sourceRows, variantsByID],
  );
  const joinedRows = useMemo(
    () => prepareRankingsForMode(mode, matchedRows, variants),
    [matchedRows, mode, variants],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(
    () =>
      joinedRows.filter(({ variant }) => {
        if (!normalizedQuery) return true;
        return [
          variant.name,
          variant.species_name,
          variant.variantType,
          String(variant.pokedex_number),
        ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
      }),
    [joinedRows, normalizedQuery],
  );
  const visibleRows = filteredRows.slice(0, visibleCount);
  const rankByVariantID = useMemo(
    () =>
      new Map(
        joinedRows.map((entry, index) => [entry.variant_id, index + 1]),
      ),
    [joinedRows],
  );
  const unmatchedCount = sourceRows.length - matchedRows.length;
  const scaleMaximum = filteredRows.reduce(
    (maximum, entry) =>
      Math.max(
        maximum,
        (mode === 'wanted' ? entry.wanted_users : entry.caught_users) ?? 0,
      ),
    0,
  );

  const selectMode = (nextMode: RankingMode) => {
    setMode(nextMode);
    setVisibleCount(INITIAL_RESULT_COUNT);
  };

  return (
    <div className="community-rankings-page">
      <div className="community-rankings-inner">
        <header className="community-rankings-header">
          <img src="/images/btn_rankings.png" alt="" />
          <div>
            <span>Trainer collections</span>
            <h1>Community Rankings</h1>
          </div>
          {data && (
            <div className="community-rankings-population">
              <FaUsers aria-hidden="true" />
              <strong>
                {Math.max(
                  data.snapshot.collector_users,
                  data.snapshot.wishlist_users,
                ).toLocaleString()}
              </strong>
              <small>trainers</small>
            </div>
          )}
        </header>

        <>
            <section className="community-ranking-controls">
              <div
                className="community-ranking-tabs"
                role="tablist"
                aria-label="Community ranking"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'wanted'}
                  className={mode === 'wanted' ? 'active' : ''}
                  onClick={() => selectMode('wanted')}
                >
                  <FaHeart aria-hidden="true" />
                  Most wanted
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'rarest'}
                  className={mode === 'rarest' ? 'active' : ''}
                  onClick={() => selectMode('rarest')}
                >
                  <FaMedal aria-hidden="true" />
                  Rarest owned
                </button>
              </div>

              <label className="community-ranking-search">
                <FaSearch aria-hidden="true" />
                <span className="sr-only">Search rankings</span>
                <input
                  type="search"
                  value={query}
                  placeholder="Pokémon, number, or form"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setVisibleCount(INITIAL_RESULT_COUNT);
                  }}
                />
              </label>
            </section>

            <div className="community-rankings-context">
              <span>
                <strong>{mode === 'wanted' ? 'Most wanted' : 'Rarest owned'}</strong>
                {mode === 'wanted'
                  ? 'Ranked by distinct trainer wishlists'
                  : 'Fewest trainers with a caught copy or Pokédex registration'}
              </span>
              <small>One vote per trainer. Duplicate copies count once.</small>
            </div>

            {(loading || variantsLoading) && (
              <section className="community-rankings-state" aria-live="polite">
                <div className="community-ranking-loader" aria-hidden="true" />
                <h2>Loading community snapshot</h2>
              </section>
            )}

            {!loading && !variantsLoading && error && (
              <section className="community-rankings-state">
                <h2>Rankings are unavailable</h2>
                <p>{error}</p>
                <button type="button" onClick={refresh}>
                  Try again
                </button>
              </section>
            )}

            {!loading && !variantsLoading && !error && data && (
              <>
                <section
                  className="community-ranking-results"
                  aria-label={
                    mode === 'wanted'
                      ? 'Most wanted Pokémon'
                      : 'Rarest owned Pokémon'
                  }
                >
                  {visibleRows.map((entry) => (
                    <RankingRow
                      key={entry.variant_id}
                      entry={entry}
                      rank={rankByVariantID.get(entry.variant_id) ?? 0}
                      mode={mode}
                      scaleMaximum={scaleMaximum}
                      privacyThreshold={data.privacy_threshold}
                    />
                  ))}
                  {visibleRows.length === 0 && (
                    <div className="community-rankings-empty">
                      No Pokémon match this search.
                    </div>
                  )}
                </section>
                {visibleRows.length < filteredRows.length && (
                  <button
                    type="button"
                    className="community-rankings-more"
                    onClick={() =>
                      setVisibleCount((count) => count + RESULT_INCREMENT)
                    }
                  >
                    Show more
                  </button>
                )}
                <footer className="community-rankings-footer">
                  <span>{formatSnapshotTime(data.snapshot.updated_at)}</span>
                  {unmatchedCount > 0 && (
                    <span>
                      {unmatchedCount} newer catalog{' '}
                      {unmatchedCount === 1 ? 'entry is' : 'entries are'} waiting
                      for this device to refresh.
                    </span>
                  )}
                </footer>
              </>
            )}
        </>
      </div>
    </div>
  );
};

export default Rankings;
