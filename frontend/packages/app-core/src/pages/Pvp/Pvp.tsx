import { useEffect, useMemo, useState } from 'react';
import {
  FaBalanceScale,
  FaBookOpen,
  FaBolt,
  FaChartLine,
  FaExchangeAlt,
  FaFistRaised,
  FaFlag,
  FaSearch,
  FaUser,
} from 'react-icons/fa';
import type { IconType } from 'react-icons';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getTypeIconPath } from '@/utils/imageHelpers';
import { resolveAssetUrl } from '@/utils/assetUrl';
import type {
  PokemonPvPLeagueKey,
  PokemonPvPRankingEntry,
} from '@shared-contracts/pokemon';

import { usePvPRankings } from './hooks/usePvPRankings';
import {
  buildOwnedPvPRoster,
  type PvPRosterScope,
} from './utils/pvpRoster';
import './Pvp.css';


const LEAGUES: Array<{
  key: PokemonPvPLeagueKey;
  label: string;
  detail: string;
}> = [
  { key: 'great', label: 'Great', detail: '1,500 CP' },
  { key: 'ultra', label: 'Ultra', detail: '2,500 CP' },
  { key: 'master', label: 'Master', detail: 'No CP limit' },
];

const INITIAL_LIMIT = 50;

type PvPRoleKey =
  | 'overall'
  | 'lead'
  | 'closer'
  | 'switch'
  | 'charger'
  | 'attacker'
  | 'consistency';

const ROLES: Array<{
  key: PvPRoleKey;
  label: string;
  icon: IconType;
  scoreIndex: number | null;
}> = [
  { key: 'overall', label: 'Overall', icon: FaChartLine, scoreIndex: null },
  { key: 'lead', label: 'Lead', icon: FaFlag, scoreIndex: 0 },
  { key: 'closer', label: 'Closer', icon: FaFistRaised, scoreIndex: 1 },
  { key: 'switch', label: 'Switch', icon: FaExchangeAlt, scoreIndex: 2 },
  { key: 'charger', label: 'Charger', icon: FaBolt, scoreIndex: 3 },
  { key: 'attacker', label: 'Attacker', icon: FaFistRaised, scoreIndex: 4 },
  { key: 'consistency', label: 'Consistency', icon: FaBalanceScale, scoreIndex: 5 },
];

const rankTier = (rank: number): string => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'standard';
};

const formatLevel = (level: number): string =>
  Number.isInteger(level) ? String(level) : level.toFixed(1);

function TypeIcons({ types }: { types: string[] }) {
  return (
    <span className="pvp-types" aria-label={types.join(' and ')}>
      {types.map((type) => (
        <img
          key={type}
          src={getTypeIconPath(type)}
          alt=""
          title={type}
          draggable={false}
        />
      ))}
    </span>
  );
}

function Moveset({ entry }: { entry: PokemonPvPRankingEntry }) {
  return (
    <div className="pvp-moveset">
      {entry.moveset.map((move) => (
        <span
          className={`pvp-move pvp-move--${move.kind}`}
          key={`${entry.speciesId}-${move.kind}-${move.id}`}
        >
          <img src={getTypeIconPath(move.type)} alt="" draggable={false} />
          <span>{move.name}</span>
        </span>
      ))}
    </div>
  );
}

function scoreForRole(
  entry: PokemonPvPRankingEntry,
  role: (typeof ROLES)[number],
): number {
  if (role.scoreIndex === null) return entry.score;
  return entry.categoryScores[role.scoreIndex] ?? entry.score;
}

function RankingRow({
  entry,
  rank,
  score,
  scoreLabel,
  cp,
  nickname,
}: {
  entry: PokemonPvPRankingEntry;
  rank: number;
  score: number;
  scoreLabel: string;
  cp?: number;
  nickname?: string | null;
}) {
  const ivSpread = `${entry.attackIv}/${entry.defenseIv}/${entry.staminaIv}`;
  return (
    <article className="pvp-ranking-row">
      <span className={`pvp-rank pvp-rank--${rankTier(rank)}`}>
        {rank}
      </span>

      <div className="pvp-pokemon">
        <img
          className="pvp-pokemon-image"
          src={resolveAssetUrl(entry.imageUrl)}
          alt=""
          loading="lazy"
          draggable={false}
        />
        <div>
          <strong>{entry.name}</strong>
          {nickname && <span className="pvp-nickname">{nickname}</span>}
          <TypeIcons types={entry.types} />
        </div>
      </div>

      <Moveset entry={entry} />

      <div className="pvp-score">
        <strong>{score.toFixed(1)}</strong>
        <span>{scoreLabel}</span>
      </div>

      <div className="pvp-build">
        <strong>Level {formatLevel(entry.recommendedLevel)}</strong>
        {cp != null && <span>CP {cp.toLocaleString()}</span>}
        <span>{ivSpread} IV</span>
      </div>
    </article>
  );
}

const Pvp = () => {
  const { data, loading, error } = usePvPRankings();
  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);
  const movesLoading = useVariantsStore((state) => state.isMovesLoading);
  const ensureMoves = useVariantsStore((state) => state.ensureMoves);
  const instances = useInstancesStore((state) => state.instances);
  const instancesLoading = useInstancesStore((state) => state.instancesLoading);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [league, setLeague] = useState<PokemonPvPLeagueKey>('great');
  const [roleKey, setRoleKey] = useState<PvPRoleKey>('overall');
  const [rosterScope, setRosterScope] = useState<PvPRosterScope>('catalog');
  const [search, setSearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_LIMIT);

  useEffect(() => {
    void ensureMoves();
  }, [ensureMoves]);

  useEffect(() => {
    if (!isLoggedIn) setRosterScope('catalog');
  }, [isLoggedIn]);

  const entries = useMemo(
    () => data?.leagues[league]?.entries ?? [],
    [data, league],
  );
  const cpLimit = data?.leagues[league]?.cpLimit ?? null;
  const ownedRoster = useMemo(
    () => buildOwnedPvPRoster(entries, variants, instances, cpLimit),
    [cpLimit, entries, instances, variants],
  );
  const scopedEntries = useMemo(
    () => rosterScope === 'owned'
      ? ownedRoster.entries.map((owned) => ({
        entry: owned.entry,
        key: owned.instanceId,
        cp: owned.cp,
        nickname: owned.nickname,
      }))
      : entries.map((entry) => ({
        entry,
        key: entry.speciesId,
        cp: undefined,
        nickname: null,
      })),
    [entries, ownedRoster.entries, rosterScope],
  );
  const activeRole = ROLES.find((item) => item.key === roleKey) ?? ROLES[0];
  const rankedEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedEntries
      .filter(({ entry, nickname }) => {
        if (!query) return true;
        return [
          entry.name,
          entry.speciesId,
          nickname ?? '',
          ...entry.types,
          ...entry.moveset.flatMap((move) => [move.name, move.type]),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);
      })
      .map((item) => ({
        ...item,
        score: scoreForRole(item.entry, activeRole),
      }))
      .sort((left, right) => (
        right.score - left.score ||
        left.entry.rank - right.entry.rank ||
        left.entry.name.localeCompare(right.entry.name)
      ))
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [activeRole, scopedEntries, search]);

  useEffect(() => {
    setVisibleLimit(INITIAL_LIMIT);
  }, [league, roleKey, rosterScope, search]);

  const activeLeague = LEAGUES.find((item) => item.key === league) ?? LEAGUES[0];
  const visibleEntries = rankedEntries.slice(0, visibleLimit);
  const ownedLoading =
    rosterScope === 'owned' &&
    (variantsLoading || movesLoading || instancesLoading);
  const pageLoading = loading || ownedLoading;
  const rosterDetails = [
    `${ownedRoster.eligibleCount} PvP-ready from ${ownedRoster.caughtCount} caught`,
    ownedRoster.overCapCount > 0
      ? `${ownedRoster.overCapCount} over the league cap`
      : '',
    ownedRoster.incompleteCount > 0
      ? `${ownedRoster.incompleteCount} need level, IV, CP, or move details`
      : '',
    ownedRoster.unmatchedCount > 0
      ? `${ownedRoster.unmatchedCount} unavailable in this league ranking`
      : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="pvp-page">
      <div className="pvp-page-inner">
        <header className="pvp-header">
          <img src="/images/btn_pvp.png" alt="" draggable={false} />
          <div>
            <span>Trainer Battles</span>
            <h1>PvP Rankings</h1>
          </div>
          <strong>
            {rosterScope === 'owned'
              ? `${ownedRoster.eligibleCount} ready`
              : `${entries.length || '---'} ranked`}
          </strong>
        </header>

        <nav className="pvp-league-tabs" aria-label="PvP league">
          {LEAGUES.map((item) => (
            <button
              type="button"
              key={item.key}
              className={league === item.key ? 'active' : ''}
              aria-pressed={league === item.key}
              onClick={() => setLeague(item.key)}
            >
              <span>{item.label}</span>
              <small>{item.detail}</small>
            </button>
          ))}
        </nav>

        <section className="pvp-roster-scope" aria-label="PvP roster">
          <div role="group" aria-label="Pokemon source">
            <button
              type="button"
              className={rosterScope === 'catalog' ? 'active' : ''}
              aria-pressed={rosterScope === 'catalog'}
              onClick={() => setRosterScope('catalog')}
            >
              <FaBookOpen aria-hidden="true" />
              <span>All Pokémon</span>
            </button>
            <button
              type="button"
              className={rosterScope === 'owned' ? 'active' : ''}
              aria-pressed={rosterScope === 'owned'}
              disabled={!isLoggedIn}
              title={!isLoggedIn ? 'Log in to rank your caught Pokémon' : undefined}
              onClick={() => setRosterScope('owned')}
            >
              <FaUser aria-hidden="true" />
              <span>My Pokémon</span>
              {rosterScope === 'owned' && (
                <strong>{ownedLoading ? '…' : ownedRoster.eligibleCount}</strong>
              )}
            </button>
          </div>
          {rosterScope === 'owned' && (
            <span role="status">
              {ownedLoading ? 'Loading your PvP roster' : rosterDetails}
            </span>
          )}
        </section>

        <nav className="pvp-role-tabs" aria-label="Ranking role">
          {ROLES.map((role) => {
            const Icon = role.icon;
            return (
              <button
                type="button"
                key={role.key}
                className={roleKey === role.key ? 'active' : ''}
                aria-pressed={roleKey === role.key}
                onClick={() => setRoleKey(role.key)}
              >
                <Icon aria-hidden="true" />
                <span>{role.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="pvp-toolbar" aria-label={`${activeLeague.label} League rankings`}>
          <div>
            <span>{activeRole.label} rankings</span>
            <strong>{activeLeague.label} League</strong>
          </div>
          <label className="pvp-search">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pokemon, type, or move"
              aria-label="Search PvP rankings"
            />
          </label>
        </section>

        {pageLoading && (
          <div className="pvp-status" role="status">
            {rosterScope === 'owned'
              ? 'Loading your PvP-ready Pokémon...'
              : 'Loading current rankings...'}
          </div>
        )}
        {error && (
          <div className="pvp-status pvp-status--error" role="alert">
            {error}
          </div>
        )}
        {!pageLoading && !error && visibleEntries.length === 0 && (
          <div className="pvp-status">
            {rosterScope === 'owned' && !search
              ? 'No caught Pokémon are ready for this league. Add CP, level, IVs, one Fast Move, and two Charged Moves to a legal build.'
              : 'No rankings match that search.'}
          </div>
        )}

        {!pageLoading && !error && visibleEntries.length > 0 && (
          <>
            <div className="pvp-ranking-head" aria-hidden="true">
              <span>Rank</span>
              <span>Pokemon</span>
              <span>Recommended team</span>
              <span>{activeRole.label}</span>
              <span>Build</span>
            </div>
            <section className="pvp-rankings" aria-live="polite">
              {visibleEntries.map(({ entry, rank, score, key, cp, nickname }) => (
                <RankingRow
                  key={key}
                  entry={entry}
                  rank={rank}
                  score={score}
                  scoreLabel={activeRole.label}
                  cp={cp}
                  nickname={nickname}
                />
              ))}
            </section>
          </>
        )}

        {visibleLimit < rankedEntries.length && (
          <button
            type="button"
            className="pvp-show-more"
            onClick={() => setVisibleLimit((current) => current + INITIAL_LIMIT)}
          >
            Show next {Math.min(INITIAL_LIMIT, rankedEntries.length - visibleLimit)}
          </button>
        )}

        {data?.source && (
          <footer className="pvp-source">
            <span>
              Battle-simulation rankings from{' '}
              <a href={data.source.url} target="_blank" rel="noreferrer">
                {data.source.name}
              </a>
              ; filtered to the current PokeGoNexus catalog.
            </span>
            <small>
              {rosterScope === 'owned'
                ? 'My Pokémon shows each caught copy’s recorded build and sorts it by that species’ simulated matchup score.'
                : 'Recommended IVs maximize performance for the selected league, not rarity.'}
            </small>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Pvp;
