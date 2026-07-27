import React, { useMemo, useState } from 'react';
import {
  FaHeart,
  FaLock,
  FaMedal,
  FaSearch,
  FaUsers,
} from 'react-icons/fa';
import type { PokemonCommunityRanking } from '@shared-contracts/search';
import { useBootstrapVariants } from '@/features/variants/hooks/useBootstrapVariants';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useCommunityRankings } from './hooks/useCommunityRankings';
import './Rankings.css';

type RankingMode = 'wanted' | 'rarest';

interface JoinedRanking extends PokemonCommunityRanking {
  variant: PokemonVariant;
}

const INITIAL_RESULT_COUNT = 30;
const RESULT_INCREMENT = 30;
const FALLBACK_IMAGE = '/images/default_pokemon.png';

function formatDexNumber(value: number): string {
  return String(value).padStart(4, '0');
}

function formatVariantLabel(variant: PokemonVariant): string {
  const raw = String(variant.variantType || 'default');
  if (raw === 'default') return 'Pokémon';
  return raw
    .replace(/^costume_/, 'Costume ')
    .replace(/^fusion_/, 'Fusion ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

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

  return `${name} (${formatFormName(form)})`;
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
  index,
  mode,
  scaleMaximum,
}: {
  entry: JoinedRanking;
  index: number;
  mode: RankingMode;
  scaleMaximum: number;
}) {
  const primaryCount =
    mode === 'wanted' ? entry.wanted_users : entry.caught_users;
  const progress = Math.max(
    4,
    Math.round((primaryCount / Math.max(scaleMaximum, 1)) * 100),
  );
  const image =
    entry.variant.currentImage || entry.variant.image_url || FALLBACK_IMAGE;
  const primaryLabel =
    mode === 'wanted'
      ? `${primaryCount.toLocaleString()} ${
          primaryCount === 1 ? 'trainer wants' : 'trainers want'
        } this`
      : `Caught by ${primaryCount.toLocaleString()} ${
          primaryCount === 1 ? 'trainer' : 'trainers'
        }`;
  const secondaryLabel =
    mode === 'wanted'
      ? `Caught by ${entry.caught_users.toLocaleString()} trainers`
      : `${entry.wanted_users.toLocaleString()} trainers want this`;

  return (
    <article
      className={`community-ranking-row community-ranking-row--rank-${Math.min(
        index + 1,
        4,
      )}`}
    >
      <div className="community-ranking-position" aria-label={`Rank ${index + 1}`}>
        {index < 3 && <FaMedal aria-hidden="true" />}
        <strong>{index + 1}</strong>
      </div>
      <div className="community-ranking-pokemon">
        <img
          src={resolveAssetUrl(image)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <span>
          <strong>{getRankingDisplayName(entry.variant)}</strong>
          <small>
            #{formatDexNumber(entry.variant.pokedex_number)} ·{' '}
            {formatVariantLabel(entry.variant)}
          </small>
        </span>
      </div>
      <div className="community-ranking-count">
        <strong>{primaryLabel}</strong>
        <small>{secondaryLabel}</small>
        <span aria-hidden="true">
          <i style={{ width: `${progress}%` }} />
        </span>
      </div>
    </article>
  );
}

const Rankings: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);
  const [mode, setMode] = useState<RankingMode>('wanted');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_RESULT_COUNT);
  const { data, error, loading, refresh } = useCommunityRankings(isLoggedIn);

  useBootstrapVariants();

  const variantsByID = useMemo(
    () => new Map(variants.map((variant) => [variant.variant_id, variant])),
    [variants],
  );
  const sourceRows = useMemo(
    () => (mode === 'wanted' ? data?.most_wanted ?? [] : data?.rarest ?? []),
    [data, mode],
  );
  const joinedRows = useMemo(
    () =>
      sourceRows.flatMap<JoinedRanking>((entry) => {
        const variant = variantsByID.get(entry.variant_id);
        return variant ? [{ ...entry, variant }] : [];
      }),
    [sourceRows, variantsByID],
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
  const unmatchedCount = sourceRows.length - joinedRows.length;
  const scaleMaximum = filteredRows.reduce(
    (maximum, entry) =>
      Math.max(
        maximum,
        mode === 'wanted' ? entry.wanted_users : entry.caught_users,
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

        {!isLoggedIn ? (
          <section className="community-rankings-state">
            <FaLock aria-hidden="true" />
            <h2>Sign in to view community rankings</h2>
            <p>
              Rankings use anonymous collection totals. Trainer names and
              individual collections are never shown.
            </p>
            <a href="/login">Log in</a>
          </section>
        ) : (
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
                  Rarest caught
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
                <strong>{mode === 'wanted' ? 'Most wanted' : 'Rarest caught'}</strong>
                {mode === 'wanted'
                  ? 'Ranked by distinct trainer wishlists'
                  : 'Fewest distinct trainers with a caught copy'}
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
                      : 'Rarest caught Pokémon'
                  }
                >
                  {visibleRows.map((entry, index) => (
                    <RankingRow
                      key={entry.variant_id}
                      entry={entry}
                      index={index}
                      mode={mode}
                      scaleMaximum={scaleMaximum}
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
        )}
      </div>
    </div>
  );
};

export default Rankings;
