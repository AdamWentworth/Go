import React, { useEffect, useMemo, useState } from "react";
import "./Raid.css";
import { useVariantsStore } from "@/features/variants/store/useVariantsStore";
import type { PokemonVariant } from "@/types/pokemonVariants";
import { getTypeIconPath } from "@/utils/imageHelpers";
import LoadingSpinner from "../../components/LoadingSpinner";
import RaidBossCounterList from "./components/RaidBossCounterList";
import RaidBossDetails from "./components/RaidBossDetails";
import RaidBossPicker from "./components/RaidBossPicker";
import RaidCounterToolbar from "./components/RaidCounterToolbar";
import RaidModeTabs from "./components/RaidModeTabs";
import RaidModifiers from "./components/RaidModifiers";
import RaidRankingTable from "./components/RaidRankingTable";
import { TYPE_MAPPING } from "./utils/constants";
import {
  DEFAULT_RAID_RELOBBY_SECONDS,
  RAID_TIER_PRESETS,
  calculateRaidBossStats,
  dedupeBestCounterPerVariant,
  dedupeBestTypeDpsPerVariant,
  estimateRaidGroup,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  isEligibleRaidAttacker,
  isEligibleRaidBoss,
  isShadowRaidTier,
  scoreBestRaidOverallAttackers,
  scoreRaidCounters,
  scoreRaidOverallAttackers,
  scoreRaidTypeDps,
  type FriendshipKey,
  type MegaAllyBonusKey,
  type PartyPowerKey,
  type RaidBossMovesetMode,
  type RaidCounterSettings,
  type RaidTierKey,
  type ShadowBossMode,
} from "./utils/raidCalculations";
import {
  DEFAULT_METRIC_SORT,
  DEFAULT_TYPE_DPS_PAGE,
  capitalize,
  getRaidVariantDisplayName,
  getTypeClassName,
  getUniqueByVariant,
  matchesCounterSearch,
  sortRaidMetricScores,
  type RaidMetricSortDirection,
  type RaidMetricSortKey,
  type RaidViewMode,
} from "./utils/raidViewModel";

const RAID_RANKING_METHODOLOGY_URL =
  "https://github.com/AdamWentworth/PokeGoNexus/blob/master/docs/raid-ranking-methodology.md";

const BOSS_MOVESET_MODE_LABELS: Record<RaidBossMovesetMode, string> = {
  expected: "expected legal movesets",
  favorable: "favorable boss movesets",
  hostile: "hostile boss movesets",
};

const Raid: React.FC = () => {
  const variants = useVariantsStore(
    (state) => state.variants,
  ) as PokemonVariant[];
  const loading = useVariantsStore((state) => state.variantsLoading);
  const movesLoading = useVariantsStore((state) => state.isMovesLoading);
  const raidDataLoading = useVariantsStore((state) => state.isRaidDataLoading);
  const ensureMoves = useVariantsStore((state) => state.ensureMoves);
  const ensureRaidData = useVariantsStore((state) => state.ensureRaidData);

  const [viewMode, setViewMode] = useState<RaidViewMode>("overall");
  const [bossSearch, setBossSearch] = useState("");
  const [selectedBossId, setSelectedBossId] = useState<string>("");
  const [selectedType, setSelectedType] = useState(DEFAULT_TYPE_DPS_PAGE);
  const [shadowRaid, setShadowRaid] = useState(false);
  const [shadowBossMode, setShadowBossMode] =
    useState<ShadowBossMode>("subdued");
  const [attackerSearch, setAttackerSearch] = useState("");
  const [attackerLevel, setAttackerLevel] =
    useState<RaidCounterSettings["attackerLevel"]>("50.0");
  const [friendship, setFriendship] = useState<FriendshipKey>("best");
  const [megaAllyBonus, setMegaAllyBonus] = useState<MegaAllyBonusKey>("none");
  const [partyPower, setPartyPower] = useState<PartyPowerKey>("none");
  const [weatherBoostedType, setWeatherBoostedType] = useState("none");
  const [relobbySeconds, setRelobbySeconds] = useState(
    DEFAULT_RAID_RELOBBY_SECONDS,
  );
  const [bossMovesetMode, setBossMovesetMode] =
    useState<RaidBossMovesetMode>("expected");
  const [bestOnly, setBestOnly] = useState(true);
  const [rankingSettingsOpen, setRankingSettingsOpen] = useState(false);
  const [sortMetric, setSortMetric] =
    useState<RaidMetricSortKey>(DEFAULT_METRIC_SORT);
  const [sortDirection, setSortDirection] =
    useState<RaidMetricSortDirection>("descending");

  useEffect(() => {
    void ensureMoves();
    void ensureRaidData();
  }, [ensureMoves, ensureRaidData]);

  const bossOptions = useMemo(
    () =>
      getUniqueByVariant(variants.filter(isEligibleRaidBoss)).sort((a, b) => {
        const aHasRaidData = (a.raid_boss?.length ?? 0) > 0 ? 0 : 1;
        const bHasRaidData = (b.raid_boss?.length ?? 0) > 0 ? 0 : 1;
        return (
          aHasRaidData - bHasRaidData ||
          a.pokedex_number - b.pokedex_number ||
          getRaidVariantDisplayName(a).localeCompare(
            getRaidVariantDisplayName(b),
          )
        );
      }),
    [variants],
  );

  const selectedBoss =
    bossOptions.find((boss) => boss.variant_id === selectedBossId) ??
    bossOptions[0] ??
    null;

  useEffect(() => {
    if (!selectedBossId && bossOptions.length > 0) {
      setSelectedBossId(bossOptions[0].variant_id);
    }
  }, [bossOptions, selectedBossId]);

  const filteredBossOptions = useMemo(() => {
    const query = bossSearch.trim().toLowerCase();
    if (!query) return [];
    return bossOptions
      .filter(
        (boss) =>
          getRaidVariantDisplayName(boss).toLowerCase().includes(query) ||
          String(boss.pokedex_number).padStart(4, "0").includes(query),
      )
      .slice(0, 6);
  }, [bossOptions, bossSearch]);

  const attackers = useMemo(
    () => getUniqueByVariant(variants.filter(isEligibleRaidAttacker)),
    [variants],
  );

  const selectedTierKey: RaidTierKey = selectedBoss
    ? (getRaidTierKeyForVariant(selectedBoss) ?? "legendary")
    : "legendary";
  const selectedTier = RAID_TIER_PRESETS[selectedTierKey];
  const selectedBossIsShadowRaid = isShadowRaidTier(selectedTierKey);
  const shadowMechanicsEnabled = selectedBossIsShadowRaid || shadowRaid;
  const activeShadowBossMode: ShadowBossMode = shadowMechanicsEnabled
    ? shadowBossMode
    : "normal";
  const settings = useMemo<RaidCounterSettings>(
    () => ({
      attackerLevel,
      friendship,
      megaAllyBonus,
      partyPower,
      weatherBoostedType:
        weatherBoostedType === "none" ? "" : weatherBoostedType,
      shadowBossMode: activeShadowBossMode,
      bossMovesetMode,
      relobbySeconds,
    }),
    [
      activeShadowBossMode,
      attackerLevel,
      bossMovesetMode,
      friendship,
      megaAllyBonus,
      partyPower,
      relobbySeconds,
      weatherBoostedType,
    ],
  );

  const bossCounterScores = useMemo(() => {
    if (viewMode !== "boss") return [];
    if (!selectedBoss) return [];
    return scoreRaidCounters(attackers, selectedBoss, selectedTier, settings);
  }, [attackers, selectedBoss, selectedTier, settings, viewMode]);

  const raidScores = useMemo(() => {
    const scored = bestOnly
      ? dedupeBestCounterPerVariant(bossCounterScores)
      : bossCounterScores;
    return scored
      .filter((score) => matchesCounterSearch(score, attackerSearch))
      .slice(0, 30);
  }, [attackerSearch, bestOnly, bossCounterScores]);

  const overallRankingScores = useMemo(() => {
    if (viewMode !== "overall") return [];
    return bestOnly
      ? scoreBestRaidOverallAttackers(attackers, settings, bossOptions)
      : scoreRaidOverallAttackers(attackers, settings, bossOptions);
  }, [attackers, bestOnly, bossOptions, settings, viewMode]);

  const overallScores = useMemo(() => {
    return sortRaidMetricScores(
      overallRankingScores.filter((score) =>
        matchesCounterSearch(score, attackerSearch),
      ),
      sortMetric,
      sortDirection,
    ).slice(0, 30);
  }, [
    attackerSearch,
    overallRankingScores,
    sortDirection,
    sortMetric,
  ]);

  const typeDpsRankingScores = useMemo(() => {
    if (viewMode !== "type-dps") return [];
    const allScores = scoreRaidTypeDps(
      attackers,
      selectedType,
      settings,
      bossOptions,
    );
    return bestOnly
      ? dedupeBestTypeDpsPerVariant(allScores)
      : allScores;
  }, [attackers, bestOnly, bossOptions, selectedType, settings, viewMode]);

  const typeDpsScores = useMemo(() => {
    return sortRaidMetricScores(
      typeDpsRankingScores.filter((score) =>
        matchesCounterSearch(score, attackerSearch),
      ),
      sortMetric,
      sortDirection,
    ).slice(0, 30);
  }, [
    attackerSearch,
    typeDpsRankingScores,
    sortDirection,
    sortMetric,
  ]);

  const groupEstimate = useMemo(() => {
    if (viewMode !== "boss") return null;
    if (!selectedBoss) return null;
    return estimateRaidGroup(
      bossCounterScores,
      selectedBoss,
      selectedTier,
      activeShadowBossMode,
    );
  }, [
    activeShadowBossMode,
    bossCounterScores,
    selectedBoss,
    selectedTier,
    viewMode,
  ]);

  const bossStats = selectedBoss
    ? calculateRaidBossStats(selectedBoss, selectedTier, activeShadowBossMode)
    : null;
  const bossMetadata = selectedBoss
    ? getPrimaryRaidMetadataForVariant(selectedBoss)
    : null;
  const typeOptions = Object.values(TYPE_MAPPING).map((type) => type.name);
  const bossSearchActive = bossSearch.trim().length > 0;
  const modifierProps = {
    typeOptions,
    attackerLevel,
    onAttackerLevelChange: setAttackerLevel,
    friendship,
    onFriendshipChange: setFriendship,
    megaAllyBonus,
    onMegaAllyBonusChange: setMegaAllyBonus,
    partyPower,
    onPartyPowerChange: setPartyPower,
    weatherBoostedType,
    onWeatherBoostedTypeChange: setWeatherBoostedType,
    relobbySeconds,
    onRelobbySecondsChange: setRelobbySeconds,
    bossMovesetMode,
    onBossMovesetModeChange: setBossMovesetMode,
    shadowMechanicsEnabled,
    selectedBossIsShadowRaid,
    shadowRaid,
    onShadowRaidChange: setShadowRaid,
    shadowBossMode,
    onShadowBossModeChange: setShadowBossMode,
  };

  const handleBossSelect = (boss: PokemonVariant) => {
    setSelectedBossId(boss.variant_id);
    setBossSearch("");
  };

  const handleMetricSort = (metric: RaidMetricSortKey) => {
    if (sortMetric === metric) {
      setSortDirection((previous) =>
        previous === "descending" ? "ascending" : "descending",
      );
      return;
    }

    setSortMetric(metric);
    setSortDirection("descending");
  };

  if (loading || movesLoading || raidDataLoading) {
    return <LoadingSpinner />;
  }

  if (attackers.length === 0) {
    return (
      <div className="raid-page">
        <section className="raid-empty-state">
          <p className="raid-eyebrow">Raid planner</p>
          <h1>No raid-ready attacker data yet.</h1>
          <p>
            Once the Pokédex data finishes loading, the planner can rank raid
            attackers.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="raid-page">
      <RaidModeTabs viewMode={viewMode} onChange={setViewMode} />

      {viewMode === "overall" && (
        <section className="raid-layout raid-overall-layout">
          <main className="raid-panel raid-main-panel raid-overall-panel">
            <header className="raid-leaderboard-header">
              <div>
                <p className="raid-eyebrow">Overall eDPS</p>
                <h1>Top raid attackers</h1>
              </div>
              <div className="raid-leaderboard-meta">
                <span>Team of six, {relobbySeconds}s relobby</span>
                <span>{BOSS_MOVESET_MODE_LABELS[bossMovesetMode]}</span>
                <a
                  href={RAID_RANKING_METHODOLOGY_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  How rankings work
                </a>
              </div>
            </header>

            <RaidCounterToolbar
              label="Attacker search"
              search={attackerSearch}
              onSearchChange={setAttackerSearch}
              bestOnly={bestOnly}
              onBestOnlyChange={setBestOnly}
              includeRankingSettings
              rankingSettingsOpen={rankingSettingsOpen}
              onRankingSettingsOpenChange={setRankingSettingsOpen}
            />

            {rankingSettingsOpen && (
              <section
                className="raid-ranking-settings"
                aria-label="Ranking settings"
              >
                <RaidModifiers
                  {...modifierProps}
                  includeShadowControls={false}
                  includeRelobbyControls
                  includeBossMovesetControls
                />
              </section>
            )}

            <RaidRankingTable
              ariaLabel="Top raid attackers"
              scores={overallScores}
              sortMetric={sortMetric}
              sortDirection={sortDirection}
              onSort={handleMetricSort}
              emptyMessage="No attackers match the current filters."
            />
          </main>
        </section>
      )}

      {viewMode === "boss" &&
        (selectedBoss && bossStats && groupEstimate ? (
          <section className="raid-layout">
            <RaidBossPicker
              selectedBoss={selectedBoss}
              bossCp={bossStats.bossCp}
              search={bossSearch}
              searchActive={bossSearchActive}
              filteredBossOptions={filteredBossOptions}
              onSearchChange={setBossSearch}
              onBossSelect={handleBossSelect}
            />

            <main className="raid-panel raid-main-panel">
              <RaidBossDetails
                tier={selectedTier}
                bossStats={bossStats}
                groupEstimate={groupEstimate}
                metadata={bossMetadata}
              />

              <RaidModifiers {...modifierProps} includeShadowControls />

              {shadowMechanicsEnabled && (
                <section className="raid-shadow-note">
                  <strong>Purified Gem reminder</strong>
                  <span>
                    Each Trainer can use up to 5 Purified Gems. It takes
                    coordinated Gems to subdue an enraged Shadow Raid Boss, so
                    solo attempts should use the enraged estimate.
                  </span>
                </section>
              )}

              <RaidCounterToolbar
                label="Counter search"
                search={attackerSearch}
                onSearchChange={setAttackerSearch}
                bestOnly={bestOnly}
                onBestOnlyChange={setBestOnly}
              />

              <RaidBossCounterList
                scores={raidScores}
                attackerLevel={attackerLevel}
              />
            </main>
          </section>
        ) : (
          <section className="raid-empty-state">
            <div className="raid-panel-header">
              <p className="raid-eyebrow">Boss counters</p>
              <h2>No raid boss data yet.</h2>
            </div>
            <p>
              Overall and type leaderboards can still rank attackers while boss
              data loads.
            </p>
          </section>
        ))}

      {viewMode === "type-dps" && (
        <section className="raid-layout raid-type-layout">
          <aside className="raid-panel raid-type-panel">
            <div className="raid-panel-header">
              <p className="raid-eyebrow">Type DPS</p>
              <h2>{capitalize(selectedType)}</h2>
            </div>

            <div className="raid-type-grid" aria-label="Type DPS pages">
              {typeOptions.map((type) => (
                <button
                  className={`${getTypeClassName(type)} ${selectedType === type ? "active" : ""}`}
                  key={type}
                  onClick={() => setSelectedType(type)}
                  type="button"
                >
                  <img src={getTypeIconPath(type)} alt="" draggable={false} />
                  <span>{capitalize(type)}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="raid-panel raid-main-panel">
            <section
              className="raid-category-card raid-type-category-card"
              aria-label="Type DPS category"
            >
              <div>
                <span>Type DPS</span>
                <strong>{capitalize(selectedType)}</strong>
              </div>
              {selectedType === "normal" ? (
                <p>
                  Uses the same complete-moveset metrics as Overall against a
                  set of high-tier bosses taking neutral Normal damage. Each
                  moveset includes at least one Normal move.
                </p>
              ) : (
                <p>
                  Uses the same eDPS, DPS, TDO, ER, and CP metrics as Overall.
                  Each moveset includes at least one {capitalize(selectedType)}
                  move and is modeled across high-tier raid-boss typings weak to{" "}
                  {capitalize(selectedType)}. Companion moves use their real
                  effectiveness in those matchups.
                </p>
              )}
            </section>

            <RaidCounterToolbar
              label="Attacker search"
              search={attackerSearch}
              onSearchChange={setAttackerSearch}
              bestOnly={bestOnly}
              onBestOnlyChange={setBestOnly}
              includeRankingSettings
              rankingSettingsOpen={rankingSettingsOpen}
              onRankingSettingsOpenChange={setRankingSettingsOpen}
            />

            {rankingSettingsOpen && (
              <section
                className="raid-ranking-settings"
                aria-label="Ranking settings"
              >
                <RaidModifiers
                  {...modifierProps}
                  includeShadowControls={false}
                  includeRelobbyControls
                  includeBossMovesetControls
                />
              </section>
            )}

            <RaidRankingTable
              ariaLabel="Type DPS counters"
              scores={typeDpsScores}
              sortMetric={sortMetric}
              sortDirection={sortDirection}
              onSort={handleMetricSort}
              emptyMessage={
                <>
                  No eligible attackers have a {capitalize(selectedType)} fast
                  or charged move.
                </>
              }
            />
          </main>
        </section>
      )}
    </div>
  );
};

export default Raid;
