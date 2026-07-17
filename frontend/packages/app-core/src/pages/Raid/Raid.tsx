import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Raid.css";
import { useInstancesStore } from "@/features/instances/store/useInstancesStore";
import { useVariantsStore } from "@/features/variants/store/useVariantsStore";
import { useAuthStore } from "@/stores/useAuthStore";
import type { PokemonVariant } from "@/types/pokemonVariants";
import { getTypeIconPath } from "@/utils/imageHelpers";
import { getStorageString, STORAGE_KEYS } from "@/utils/storage";
import ConfirmDialog from "../../components/modals/ConfirmDialog";
import LoadingSpinner from "../../components/LoadingSpinner";
import RaidCalibrationPanel from "./components/RaidCalibrationPanel";
import RaidBossCounterList from "./components/RaidBossCounterList";
import RaidBossDetails from "./components/RaidBossDetails";
import RaidBossPicker from "./components/RaidBossPicker";
import RaidCounterToolbar from "./components/RaidCounterToolbar";
import RaidModeTabs from "./components/RaidModeTabs";
import RaidModifiers from "./components/RaidModifiers";
import RaidModelProvenance from "./components/RaidModelProvenance";
import RaidRankingTable from "./components/RaidRankingTable";
import RaidRosterScope from "./components/RaidRosterScope";
import RaidObservationDialog from "./components/RaidObservationDialog";
import { TYPE_MAPPING } from "./utils/constants";
import {
  DEFAULT_RAID_RELOBBY_SECONDS,
  RAID_ROUTE_READY_MEASURE,
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
  simulateRaidGroupAtTrainerCount,
  RAID_SIMULATION_MODEL_VERSION,
  type FriendshipKey,
  type MegaAllyBonusKey,
  type PartyPowerKey,
  type RaidBossMovesetMode,
  type RaidCounterSettings,
  type RaidDodgeStrategy,
  type RaidTierKey,
  type ShadowBossMode,
} from "./utils/raidCalculations";
import {
  analyzeRaidCalibration,
  appendRaidCalibrationObservation,
  clearRaidCalibrationObservations,
  createRaidCalibrationObservation,
  loadRaidCalibrationObservations,
  type RaidObservationActual,
} from "./utils/raidCalibration";
import { scoreRaidCountersAsync } from "./utils/raidCounterWorkers";
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
import {
  buildRaidRoster,
  type RaidRosterScope as RaidRosterScopeValue,
} from "./utils/raidRoster";

const Raid: React.FC = () => {
  const routeReadyMeasured = useRef(false);
  const variants = useVariantsStore(
    (state) => state.variants,
  ) as PokemonVariant[];
  const loading = useVariantsStore((state) => state.variantsLoading);
  const movesLoading = useVariantsStore((state) => state.isMovesLoading);
  const raidDataLoading = useVariantsStore((state) => state.isRaidDataLoading);
  const ensureMoves = useVariantsStore((state) => state.ensureMoves);
  const ensureRaidData = useVariantsStore((state) => state.ensureRaidData);
  const instances = useInstancesStore((state) => state.instances);
  const instancesLoading = useInstancesStore((state) => state.instancesLoading);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const calibrationOwnerKey =
    user?.user_id ??
    getStorageString(STORAGE_KEYS.deviceId) ??
    "signed-out-device";

  const [viewMode, setViewMode] = useState<RaidViewMode>("overall");
  const [rosterScope, setRosterScope] =
    useState<RaidRosterScopeValue>(isLoggedIn ? "owned" : "catalog");
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
  const [dodgeStrategy, setDodgeStrategy] =
    useState<RaidDodgeStrategy>("none");
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
  const [bossCounterScores, setBossCounterScores] = useState<
    ReturnType<typeof scoreRaidCounters>
  >([]);
  const [bossCounterScoresLoading, setBossCounterScoresLoading] =
    useState(false);
  const [calibrationObservations, setCalibrationObservations] = useState(
    loadRaidCalibrationObservations,
  );
  const [dodgeCalibrationEnabled, setDodgeCalibrationEnabled] =
    useState(false);
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [clearCalibrationConfirmOpen, setClearCalibrationConfirmOpen] =
    useState(false);

  const calibrationProfile = useMemo(
    () =>
      analyzeRaidCalibration(
        calibrationObservations.filter(
          (observation) => observation.ownerKey === calibrationOwnerKey,
        ),
      ),
    [calibrationObservations, calibrationOwnerKey],
  );

  useEffect(() => {
    void ensureMoves();
    void ensureRaidData();
  }, [ensureMoves, ensureRaidData]);

  useEffect(() => {
    setRosterScope(isLoggedIn ? "owned" : "catalog");
  }, [isLoggedIn]);

  useEffect(() => {
    setDodgeCalibrationEnabled(false);
  }, [calibrationOwnerKey]);

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

  const catalogAttackers = useMemo(
    () => getUniqueByVariant(variants.filter(isEligibleRaidAttacker)),
    [variants],
  );
  const raidRoster = useMemo(
    () => buildRaidRoster(variants, instances),
    [instances, variants],
  );
  const attackers =
    rosterScope === "owned" ? raidRoster.attackers : catalogAttackers;
  const personalized = rosterScope === "owned";

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
      dodgeStrategy,
      weatherBoostedType:
        weatherBoostedType === "none" ? "" : weatherBoostedType,
      shadowBossMode: activeShadowBossMode,
      bossMovesetMode,
      relobbySeconds,
      dodgeSuccessRate:
        dodgeCalibrationEnabled &&
        calibrationProfile.canApplyDodgeCalibration
          ? calibrationProfile.dodgeSuccessRate
          : 1,
    }),
    [
      activeShadowBossMode,
      attackerLevel,
      bossMovesetMode,
      friendship,
      megaAllyBonus,
      partyPower,
      dodgeStrategy,
      dodgeCalibrationEnabled,
      calibrationProfile.canApplyDodgeCalibration,
      calibrationProfile.dodgeSuccessRate,
      relobbySeconds,
      weatherBoostedType,
    ],
  );

  useEffect(() => {
    if (viewMode !== "boss" || !selectedBoss) {
      setBossCounterScores([]);
      setBossCounterScoresLoading(false);
      return;
    }

    if (attackers.length === 0) {
      setBossCounterScores([]);
      setBossCounterScoresLoading(false);
      return;
    }

    setBossCounterScores([]);
    setBossCounterScoresLoading(true);

    if (typeof Worker !== "function") {
      setBossCounterScores(
        scoreRaidCounters(attackers, selectedBoss, selectedTier, settings),
      );
      setBossCounterScoresLoading(false);
      return;
    }

    const controller = new AbortController();
    void scoreRaidCountersAsync(
      attackers,
      selectedBoss,
      selectedTier,
      settings,
      bestOnly,
      controller.signal,
    )
      .then((scores) => {
        if (!controller.signal.aborted) {
          setBossCounterScores(scores);
          setBossCounterScoresLoading(false);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setBossCounterScores(
          scoreRaidCounters(attackers, selectedBoss, selectedTier, settings),
        );
        setBossCounterScoresLoading(false);
      });

    return () => controller.abort();
  }, [attackers, bestOnly, selectedBoss, selectedTier, settings, viewMode]);

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
      : scoreRaidOverallAttackers(attackers, settings);
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

  useEffect(() => {
    if (
      routeReadyMeasured.current ||
      viewMode !== "overall" ||
      loading ||
      movesLoading ||
      overallScores.length === 0 ||
      typeof performance === "undefined"
    ) {
      return;
    }

    routeReadyMeasured.current = true;
    performance.clearMeasures(RAID_ROUTE_READY_MEASURE);
    performance.measure(RAID_ROUTE_READY_MEASURE, {
      start: 0,
      end: performance.now(),
    });
  }, [loading, movesLoading, overallScores.length, viewMode]);

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
      settings,
    );
  }, [
    bossCounterScores,
    selectedBoss,
    selectedTier,
    settings,
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
    dodgeStrategy,
    onDodgeStrategyChange: setDodgeStrategy,
    bossMovesetMode,
    onBossMovesetModeChange: setBossMovesetMode,
    shadowMechanicsEnabled,
    selectedBossIsShadowRaid,
    shadowRaid,
    onShadowRaidChange: setShadowRaid,
    shadowBossMode,
    onShadowBossModeChange: setShadowBossMode,
    includeAttackerLevel: !personalized,
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

  const handleSaveObservation = (actual: RaidObservationActual) => {
    if (!selectedBoss) return;

    const prediction = simulateRaidGroupAtTrainerCount(
      bossCounterScores,
      selectedBoss,
      selectedTier,
      settings,
      actual.trainerCount,
    );
    if (!prediction) return;

    const observation = createRaidCalibrationObservation({
      ownerKey: calibrationOwnerKey,
      modelVersion: RAID_SIMULATION_MODEL_VERSION,
      catalogVersion:
        getStorageString(STORAGE_KEYS.pokemonCatalogVersion) ?? "unknown",
      bossVariantId: selectedBoss.variant_id,
      bossName: getRaidVariantDisplayName(selectedBoss),
      tierKey: selectedTierKey,
      dodgeCalibrationApplied:
        dodgeCalibrationEnabled &&
        calibrationProfile.canApplyDodgeCalibration,
      predicted: {
        clearTimeSeconds: prediction.projectedTimeToWinSeconds,
        faints: prediction.faints,
        relobbies: prediction.relobbies,
      },
      actual,
    });

    setCalibrationObservations(appendRaidCalibrationObservation(observation));
    setObservationDialogOpen(false);
  };

  const handleClearCalibration = () => {
    setCalibrationObservations(
      clearRaidCalibrationObservations(calibrationOwnerKey),
    );
    setDodgeCalibrationEnabled(false);
    setClearCalibrationConfirmOpen(false);
  };

  if (loading || movesLoading || (viewMode === "boss" && raidDataLoading)) {
    return <LoadingSpinner />;
  }

  if (catalogAttackers.length === 0) {
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
      <RaidRosterScope
        scope={rosterScope}
        onChange={setRosterScope}
        isLoggedIn={isLoggedIn}
        loading={instancesLoading}
        summary={raidRoster}
      />

      {viewMode === "overall" && (
        <section className="raid-layout raid-overall-layout">
          <main className="raid-panel raid-main-panel raid-overall-panel">
            <header className="raid-leaderboard-header">
              <div>
                <p className="raid-eyebrow">Overall eDPS</p>
                <h1>
                  {personalized ? "Your top raid attackers" : "Top raid attackers"}
                </h1>
              </div>
              <div className="raid-leaderboard-meta">
                <span>Team of six, {relobbySeconds}s relobby</span>
                <span>
                  {personalized
                    ? "Caught levels, IVs, CP, and moves"
                    : "Neutral typeless benchmark"}
                </span>
                <RaidModelProvenance />
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
              bestOnlyLabel={personalized ? "Best current" : "Best moves"}
              allMovesLabel={personalized ? "All current" : "All moves"}
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
                />
              </section>
            )}

            <RaidRankingTable
              ariaLabel={
                personalized ? "Your top raid attackers" : "Top raid attackers"
              }
              scores={overallScores}
              attackerLevel={attackerLevel}
              sortMetric={sortMetric}
              sortDirection={sortDirection}
              onSort={handleMetricSort}
              emptyMessage={
                personalized
                  ? "No caught attackers match the current filters. Add level, IV, and move details to improve personalized rankings."
                  : "No attackers match the current filters."
              }
            />
          </main>
        </section>
      )}

      {viewMode === "boss" &&
        (selectedBoss && bossStats ? (
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
              {groupEstimate ? (
                <RaidBossDetails
                  tier={selectedTier}
                  bossStats={bossStats}
                  groupEstimate={groupEstimate}
                  metadata={bossMetadata}
                />
              ) : personalized && attackers.length === 0 ? (
                <section className="raid-calculation-status" role="status">
                  <strong>No caught raid-ready Pokémon</strong>
                  <span>
                    Mark Pokémon as caught to build a personalized counter
                    team for {selectedBoss.name}.
                  </span>
                </section>
              ) : !bossCounterScoresLoading &&
                bossCounterScores.length === 0 ? (
                <section className="raid-calculation-status" role="status">
                  <strong>No compatible raid counters</strong>
                  <span>
                    The selected roster has no legal movesets for this battle.
                  </span>
                </section>
              ) : (
                <section className="raid-calculation-status" role="status">
                  <strong>Calculating raid counters</strong>
                  <span>
                    Evaluating legal movesets against {selectedBoss.name}.
                  </span>
                </section>
              )}

              <RaidCalibrationPanel
                profile={calibrationProfile}
                enabled={dodgeCalibrationEnabled}
                disabled={
                  bossCounterScoresLoading ||
                  bossCounterScores.length === 0 ||
                  !groupEstimate
                }
                onEnabledChange={setDodgeCalibrationEnabled}
                onLogRaid={() => setObservationDialogOpen(true)}
                onClear={() => setClearCalibrationConfirmOpen(true)}
              />

              <RaidModifiers
                {...modifierProps}
                includeShadowControls
                includeRelobbyControls
                includeBossMovesetControls
                includeMonteCarloOption
              />

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
                bestOnlyLabel={personalized ? "Best current" : "Best moves"}
                allMovesLabel={personalized ? "All current" : "All moves"}
              />

              <RaidModelProvenance />

              {bossCounterScoresLoading ? (
                <div className="raid-list-empty" role="status">
                  Modeling raid timelines…
                </div>
              ) : (
                <RaidBossCounterList
                  scores={raidScores}
                  attackerLevel={attackerLevel}
                />
              )}
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
              bestOnlyLabel={personalized ? "Best current" : "Best moves"}
              allMovesLabel={personalized ? "All current" : "All moves"}
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

            <RaidModelProvenance />

            <RaidRankingTable
              ariaLabel="Type DPS counters"
              scores={typeDpsScores}
              attackerLevel={attackerLevel}
              sortMetric={sortMetric}
              sortDirection={sortDirection}
              onSort={handleMetricSort}
              emptyMessage={
                personalized ? (
                  <>
                    None of your caught Pokémon have a usable{" "}
                    {capitalize(selectedType)} moveset for this ranking.
                  </>
                ) : (
                  <>
                    No eligible attackers have a {capitalize(selectedType)} fast
                    or charged move.
                  </>
                )
              }
            />
          </main>
        </section>
      )}

      {observationDialogOpen && selectedBoss && groupEstimate && (
        <RaidObservationDialog
          bossName={getRaidVariantDisplayName(selectedBoss)}
          defaultTrainerCount={Math.max(1, groupEstimate.minTrainers)}
          onCancel={() => setObservationDialogOpen(false)}
          onSave={handleSaveObservation}
        />
      )}
      {clearCalibrationConfirmOpen && (
        <ConfirmDialog
          message="Clear your locally stored raid observations? This cannot be undone."
          onCancel={() => setClearCalibrationConfirmOpen(false)}
          onConfirm={handleClearCalibration}
        />
      )}
    </div>
  );
};

export default Raid;
