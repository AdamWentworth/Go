import { useEffect, useMemo, useState } from 'react';
import { FaSearch } from 'react-icons/fa';

import { getTypeIconPath } from '@/utils/imageHelpers';
import { resolveAssetUrl } from '@/utils/assetUrl';
import type {
  PokemonPvPLeagueKey,
  PokemonPvPRankingEntry,
} from '@shared-contracts/pokemon';

import { usePvPRankings } from './hooks/usePvPRankings';
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

function RankingRow({ entry }: { entry: PokemonPvPRankingEntry }) {
  const ivSpread = `${entry.attackIv}/${entry.defenseIv}/${entry.staminaIv}`;
  return (
    <article className="pvp-ranking-row">
      <span className={`pvp-rank pvp-rank--${rankTier(entry.rank)}`}>
        {entry.rank}
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
          <TypeIcons types={entry.types} />
        </div>
      </div>

      <Moveset entry={entry} />

      <div className="pvp-score">
        <strong>{entry.score.toFixed(1)}</strong>
        <span>Overall</span>
      </div>

      <div className="pvp-build">
        <strong>Level {formatLevel(entry.recommendedLevel)}</strong>
        <span>{ivSpread} IV</span>
      </div>
    </article>
  );
}

const Pvp = () => {
  const { data, loading, error } = usePvPRankings();
  const [league, setLeague] = useState<PokemonPvPLeagueKey>('great');
  const [search, setSearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_LIMIT);

  const entries = useMemo(
    () => data?.leagues[league]?.entries ?? [],
    [data, league],
  );
  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) =>
      [
        entry.name,
        entry.speciesId,
        ...entry.types,
        ...entry.moveset.flatMap((move) => [move.name, move.type]),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [entries, search]);

  useEffect(() => {
    setVisibleLimit(INITIAL_LIMIT);
  }, [league, search]);

  const activeLeague = LEAGUES.find((item) => item.key === league) ?? LEAGUES[0];
  const visibleEntries = filteredEntries.slice(0, visibleLimit);

  return (
    <div className="pvp-page">
      <div className="pvp-page-inner">
        <header className="pvp-header">
          <img src="/images/btn_pvp.png" alt="" draggable={false} />
          <div>
            <span>Trainer Battles</span>
            <h1>PvP Rankings</h1>
          </div>
          <strong>{entries.length || '---'} ranked</strong>
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

        <section className="pvp-toolbar" aria-label={`${activeLeague.label} League rankings`}>
          <div>
            <span>Overall rankings</span>
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

        {loading && (
          <div className="pvp-status" role="status">
            Loading current rankings...
          </div>
        )}
        {error && (
          <div className="pvp-status pvp-status--error" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && visibleEntries.length === 0 && (
          <div className="pvp-status">No rankings match that search.</div>
        )}

        {!loading && !error && visibleEntries.length > 0 && (
          <>
            <div className="pvp-ranking-head" aria-hidden="true">
              <span>Rank</span>
              <span>Pokemon</span>
              <span>Recommended team</span>
              <span>Score</span>
              <span>Build</span>
            </div>
            <section className="pvp-rankings" aria-live="polite">
              {visibleEntries.map((entry) => (
                <RankingRow key={entry.speciesId} entry={entry} />
              ))}
            </section>
          </>
        )}

        {visibleLimit < filteredEntries.length && (
          <button
            type="button"
            className="pvp-show-more"
            onClick={() => setVisibleLimit((current) => current + INITIAL_LIMIT)}
          >
            Show next {Math.min(INITIAL_LIMIT, filteredEntries.length - visibleLimit)}
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
              Recommended IVs maximize performance for the selected league, not rarity.
            </small>
          </footer>
        )}
      </div>
    </div>
  );
};

export default Pvp;
