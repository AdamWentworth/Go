import { useEffect, useMemo, useState } from 'react';
import { FaChartBar, FaCrosshairs, FaSearch } from 'react-icons/fa';

import { AppLoadingFallback } from '@/contexts/AppLoadingContext';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type { PokemonVariant } from '@/types/pokemonVariants';

import MaxBossPicker from './components/MaxBossPicker';
import MaxBattleSimulator from './components/MaxBattleSimulator';
import MaxRankingList from './components/MaxRankingList';
import MaxRoleTabs from './components/MaxRoleTabs';
import MaxRosterScope from './components/MaxRosterScope';
import MaxTypeFilter from './components/MaxTypeFilter';
import {
  getMaxBattleCatalog,
  rankMaxBattlePokemon,
  type MaxRole,
} from './utils/maxBattleModel';
import {
  buildMaxRoster,
  type MaxRosterScope as MaxRosterScopeValue,
} from './utils/maxRoster';

import './Max.css';

type MaxView = 'rankings' | 'bosses';

const roleHeading = (role: MaxRole, selectedType: string): string => {
  const type = selectedType
    ? `${selectedType.charAt(0).toUpperCase()}${selectedType.slice(1)}`
    : '';
  if (type && role === 'tank') return `Top tanks vs ${type}`;
  if (type && role === 'healing') return `Top healers vs ${type}`;
  if (role === 'damage') return `Top ${type ? `${type} ` : ''}damage dealers`;
  if (role === 'tank') return 'Top tanks';
  return 'Top healers';
};

const bossRoleHeading = (role: MaxRole, bossName: string): string => {
  if (role === 'damage') return `Top damage picks vs ${bossName}`;
  if (role === 'tank') return `Top tanks vs ${bossName}`;
  return `Top healers vs ${bossName}`;
};

const Max = () => {
  const variants = useVariantsStore((state) => state.variants) as PokemonVariant[];
  const loading = useVariantsStore((state) => state.variantsLoading);
  const movesLoading = useVariantsStore((state) => state.isMovesLoading);
  const ensureMoves = useVariantsStore((state) => state.ensureMoves);
  const instances = useInstancesStore((state) => state.instances);
  const instancesLoading = useInstancesStore((state) => state.instancesLoading);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const [view, setView] = useState<MaxView>('rankings');
  const [rosterScope, setRosterScope] = useState<MaxRosterScopeValue>(
    isLoggedIn ? 'owned' : 'catalog',
  );
  const [scopeDirection, setScopeDirection] = useState<'forward' | 'backward'>(
    'forward',
  );
  const [role, setRole] = useState<MaxRole>('damage');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');
  const [selectedBossId, setSelectedBossId] = useState('');

  useEffect(() => {
    if (variants.length > 0) void ensureMoves();
  }, [ensureMoves, variants.length]);

  useEffect(() => {
    setScopeDirection(isLoggedIn ? 'forward' : 'backward');
    setRosterScope(isLoggedIn ? 'owned' : 'catalog');
  }, [isLoggedIn]);

  const maxCatalog = useMemo(() => getMaxBattleCatalog(variants), [variants]);
  const maxRoster = useMemo(
    () => buildMaxRoster(variants, instances),
    [instances, variants],
  );
  const rankingCatalog =
    rosterScope === 'owned' ? maxRoster.pokemon : maxCatalog;
  const selectedBoss =
    maxCatalog.find((boss) => boss.variant_id === selectedBossId) ?? maxCatalog[0];

  useEffect(() => {
    if (!selectedBossId && maxCatalog[0]) {
      setSelectedBossId(maxCatalog[0].variant_id);
    }
  }, [maxCatalog, selectedBossId]);

  const rankingEntries = useMemo(
    () =>
      rankMaxBattlePokemon(rankingCatalog, {
        role,
        selectedType: selectedType || undefined,
      }),
    [rankingCatalog, role, selectedType],
  );

  const visibleRankings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rankingEntries.slice(0, 18);
    return rankingEntries
      .filter((entry) =>
        `${entry.variant.name} ${entry.fastMove.name} ${entry.maxMoveName} ${entry.maxMoveType}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 30);
  }, [rankingEntries, search]);

  const bossRankingEntries = useMemo(
    () =>
      selectedBoss
        ? rankMaxBattlePokemon(rankingCatalog, {
            role,
            boss: selectedBoss,
          }).slice(0, 3)
        : [],
    [rankingCatalog, role, selectedBoss],
  );

  const bossSimulationTeam = useMemo(() => {
    if (!selectedBoss) return null;
    const damage = rankMaxBattlePokemon(rankingCatalog, {
      role: 'damage',
      boss: selectedBoss,
    })[0];
    const tank = rankMaxBattlePokemon(rankingCatalog, {
      role: 'tank',
      boss: selectedBoss,
    })[0];
    const healing = rankMaxBattlePokemon(rankingCatalog, {
      role: 'healing',
      boss: selectedBoss,
    })[0];

    return damage && tank && healing ? { damage, tank, healing } : null;
  }, [rankingCatalog, selectedBoss]);

  const changeRosterScope = (nextScope: MaxRosterScopeValue) => {
    if (nextScope === rosterScope) return;
    setScopeDirection(nextScope === 'owned' ? 'forward' : 'backward');
    setRosterScope(nextScope);
  };

  const rankingAssumptions =
    rosterScope === 'owned'
      ? 'Recorded level · recorded IVs · recorded Fast Move · unlocked Max Move levels'
      : 'Level 50 · 15/15/15 IVs · Max Moves Level 3';

  if (loading && variants.length === 0) {
    return <AppLoadingFallback source="max-battles" />;
  }

  return (
    <main className="max-page">
      <div className="max-page-inner">
        <header className="max-page-header">
          <img className="max-page-mark" src="/images/dynamax.png" alt="" />
          <div className="max-page-heading">
            <span>Power Spot strategy</span>
            <h1>Max Battles</h1>
          </div>
          <strong className="max-page-count">
            {maxCatalog.length} Max-ready Pokémon
          </strong>
        </header>

        <nav className="max-view-tabs" aria-label="Max Battle tools">
          <button
            aria-pressed={view === 'rankings'}
            className={view === 'rankings' ? 'active' : ''}
            onClick={() => setView('rankings')}
            type="button"
          >
            <FaChartBar aria-hidden="true" />
            <span>Max rankings</span>
          </button>
          <button
            aria-pressed={view === 'bosses'}
            className={view === 'bosses' ? 'active' : ''}
            onClick={() => setView('bosses')}
            type="button"
          >
            <FaCrosshairs aria-hidden="true" />
            <span>Boss teams</span>
          </button>
        </nav>

        <MaxRosterScope
          scope={rosterScope}
          onChange={changeRosterScope}
          isLoggedIn={isLoggedIn}
          loading={instancesLoading}
          summary={maxRoster}
        />

        <div
          className={`max-scope-stage max-scope-stage--${scopeDirection}`}
          data-roster-scope={rosterScope}
          key={rosterScope}
        >
          {view === 'rankings' ? (
          <>
            <MaxRoleTabs label="Ranking role" role={role} onChange={setRole} />

            <MaxTypeFilter
              role={role}
              selectedType={selectedType}
              onChange={setSelectedType}
            />

            <section className="max-results-panel" aria-labelledby="max-rankings-title">
              <div className="max-results-toolbar">
                <div>
                  <span>{selectedType || 'All Max Pokémon'}</span>
                  <h2 id="max-rankings-title">{roleHeading(role, selectedType)}</h2>
                  <p
                    aria-label="Ranking assumptions"
                    className="max-ranking-assumptions"
                  >
                    {rankingAssumptions}
                  </p>
                </div>
                <label className="max-ranking-search">
                  <FaSearch aria-hidden="true" />
                  <input
                    aria-label="Search Max rankings"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Pokémon or move"
                    type="search"
                    value={search}
                  />
                </label>
              </div>
              {(movesLoading ||
                (rosterScope === 'owned' && instancesLoading)) &&
              rankingEntries.length === 0 ? (
                <div className="max-ranking-empty" role="status">
                  <strong>Preparing Max rankings</strong>
                  <span>
                    {rosterScope === 'owned'
                      ? 'Loading your caught Max Pokémon.'
                      : 'Loading current move pools.'}
                  </span>
                </div>
              ) : (
                <MaxRankingList entries={visibleRankings} role={role} />
              )}
            </section>
          </>
        ) : selectedBoss ? (
          <>
            <MaxBossPicker
              bosses={maxCatalog}
              selectedBoss={selectedBoss}
              onSelect={(boss) => setSelectedBossId(boss.variant_id)}
            />
            <MaxBattleSimulator
              boss={selectedBoss}
              rosterScope={rosterScope}
              team={bossSimulationTeam}
            />
            <MaxRoleTabs label="Boss team role" role={role} onChange={setRole} />
            <aside className="max-boss-benchmark-note" aria-label="Boss ranking method">
              <strong>Standardized matchup</strong>
              <span>
                {rosterScope === 'owned'
                  ? 'Recorded level, IVs, Fast Move, and unlocked Max Move levels'
                  : 'Level 50 · 15/15/15 IVs · level-3 Max moves'}{' '}
                ·{' '}
                {bossRankingEntries[0]?.bossBenchmark?.pressureSource ===
                'legal-movesets'
                  ? 'expected pressure across legal boss movesets'
                  : 'typed benchmark pressure when boss moves are unavailable'}
              </span>
            </aside>
            <section
              className="max-results-panel max-boss-role-results"
              aria-labelledby="max-boss-role-title"
            >
              <div className="max-results-toolbar max-boss-role-toolbar">
                <div>
                  <span>Three-Pokémon battle party</span>
                  <h2 id="max-boss-role-title">
                    {bossRoleHeading(role, selectedBoss.name)}
                  </h2>
                  <p className="max-ranking-assumptions">
                    Choose up to three Max Pokémon; these are the strongest picks for
                    the selected role.
                  </p>
                </div>
              </div>
              <MaxRankingList entries={bossRankingEntries} role={role} />
            </section>
          </>
        ) : (
          <div className="max-results-panel max-ranking-empty">
            <strong>No Max Battle bosses available</strong>
            <span>The current catalog does not contain released Max-ready Pokémon.</span>
          </div>
          )}
        </div>

        <details className="max-method-note">
          <summary>How Max roles are ranked</summary>
          <div>
            <p>
              <strong>Damage:</strong> Attack × active Max or G-Max power × STAB ×
              effectiveness. <strong>Tank:</strong> effective bulk ÷ Fast Move time,
              with the active Max Guard level shown separately.
            </p>
            <p>
              <strong>Healing:</strong> the active Max Spirit level restores a share of
              the user&apos;s HP to each active Pokémon; the group figure uses four active
              Pokémon. All Pokémon use level 50, perfect IVs, and level-3 Max Moves;
              My Pokémon use each caught copy&apos;s recorded battle details.
            </p>
          </div>
        </details>
      </div>
    </main>
  );
};

export default Max;
