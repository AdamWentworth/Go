import React, { useEffect, useMemo, useState } from 'react';
import './Raid.css';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { getTypeIconPath } from '@/utils/imageHelpers';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TYPE_MAPPING } from './utils/constants';
import {
  FRIENDSHIP_DAMAGE_BONUS,
  MEGA_ALLY_DAMAGE_BONUS,
  RAID_TIER_PRESETS,
  calculateRaidBossStats,
  dedupeBestCounterPerVariant,
  dedupeBestTypeDpsPerVariant,
  estimateRaidGroup,
  formatSeconds,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  getVariantTypeNames,
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
  type RaidCounterScore,
  type RaidCounterSettings,
  type RaidOverallScore,
  type RaidTypeDpsScore,
  type RaidTierKey,
  type ShadowBossMode,
} from './utils/raidCalculations';

type RaidViewMode = 'overall' | 'type-dps' | 'boss';
type SearchableCounterScore = {
  variant: PokemonVariant;
  fastMove: RaidCounterScore['fastMove'];
  chargedMove: RaidCounterScore['chargedMove'];
};

const DEFAULT_TYPE_DPS_PAGE = 'dark';

const FRIENDSHIP_OPTIONS: Array<{ key: FriendshipKey; label: string }> = [
  { key: 'none', label: 'No friendship' },
  { key: 'good', label: 'Good' },
  { key: 'great', label: 'Great' },
  { key: 'ultra', label: 'Ultra' },
  { key: 'best', label: 'Best' },
];

const MEGA_OPTIONS: Array<{ key: MegaAllyBonusKey; label: string }> = [
  { key: 'none', label: 'No Mega ally' },
  { key: 'general', label: 'Mega ally' },
  { key: 'matching', label: 'Matching Mega' },
];

const PARTY_POWER_OPTIONS: Array<{ key: PartyPowerKey; label: string }> = [
  { key: 'none', label: 'No Party Power' },
  { key: 'occasional', label: 'Occasional' },
  { key: 'frequent', label: 'Frequent' },
  { key: 'every', label: 'Every charge' },
];

const ATTACKER_LEVEL_OPTIONS: RaidCounterSettings['attackerLevel'][] = ['40.0', '50.0', '51.0'];

const capitalize = (value: string): string =>
  value.length === 0 ? value : `${value.charAt(0).toUpperCase()}${value.slice(1)}`;

const formatTypeList = (types: string[]): string => types.map(capitalize).join(' / ');

const getPokemonImage = (variant: PokemonVariant): string =>
  resolveAssetUrl(variant.currentImage || variant.image_url || variant.sprite_url || '');

const getVariantBadge = (variant: PokemonVariant): string => {
  const type = variant.variantType.toLowerCase();
  if (type.includes('shadow')) return 'Shadow';
  if (type.includes('primal')) return 'Primal';
  if (type.includes('mega')) return 'Mega';
  if (type.includes('fusion')) return 'Fusion';
  if (type.includes('dynamax')) return 'Dynamax';
  if (type.includes('gigantamax')) return 'Gigantamax';
  return 'Pokemon';
};

const formatDps = (value: number): string => value.toFixed(1);
const formatEr = (value: number): string => value.toFixed(2);
const formatWholeNumber = (value: number): string => Math.round(value).toLocaleString();

const getMoveTypeName = (move: RaidTypeDpsScore['fastMove']): string =>
  capitalize(move.type_name || move.type || 'unknown');

const getMoveTypeIcon = (move: SearchableCounterScore['fastMove']): string =>
  getTypeIconPath(move.type_name || move.type || 'unknown');

const getTypeClassName = (typeName?: string): string =>
  `type-${(typeName || 'unknown').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

const getUniqueByVariant = (variants: PokemonVariant[]): PokemonVariant[] => {
  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key = variant.variant_id || `${variant.pokemon_id}-${variant.variantType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const matchesCounterSearch = (score: SearchableCounterScore, query: string): boolean => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const types = getVariantTypeNames(score.variant);
  return (
    score.variant.name.toLowerCase().includes(normalized) ||
    score.fastMove.name.toLowerCase().includes(normalized) ||
    score.chargedMove.name.toLowerCase().includes(normalized) ||
    types.some((type) => type.includes(normalized))
  );
};

const Raid: React.FC = () => {
  const variants = useVariantsStore((state) => state.variants) as PokemonVariant[];
  const loading = useVariantsStore((state) => state.variantsLoading);
  const movesLoading = useVariantsStore((state) => state.isMovesLoading);
  const raidDataLoading = useVariantsStore((state) => state.isRaidDataLoading);
  const ensureMoves = useVariantsStore((state) => state.ensureMoves);
  const ensureRaidData = useVariantsStore((state) => state.ensureRaidData);

  const [viewMode, setViewMode] = useState<RaidViewMode>('overall');
  const [bossSearch, setBossSearch] = useState('');
  const [selectedBossId, setSelectedBossId] = useState<string>('');
  const [selectedType, setSelectedType] = useState(DEFAULT_TYPE_DPS_PAGE);
  const [shadowRaid, setShadowRaid] = useState(false);
  const [shadowBossMode, setShadowBossMode] = useState<ShadowBossMode>('subdued');
  const [attackerSearch, setAttackerSearch] = useState('');
  const [attackerLevel, setAttackerLevel] =
    useState<RaidCounterSettings['attackerLevel']>('50.0');
  const [friendship, setFriendship] = useState<FriendshipKey>('best');
  const [megaAllyBonus, setMegaAllyBonus] = useState<MegaAllyBonusKey>('none');
  const [partyPower, setPartyPower] = useState<PartyPowerKey>('none');
  const [weatherBoostedType, setWeatherBoostedType] = useState('none');
  const [bestOnly, setBestOnly] = useState(true);

  useEffect(() => {
    void ensureMoves();
    void ensureRaidData();
  }, [ensureMoves, ensureRaidData]);

  const bossOptions = useMemo(
    () =>
      getUniqueByVariant(variants.filter(isEligibleRaidBoss)).sort(
        (a, b) => {
          const aHasRaidData = (a.raid_boss?.length ?? 0) > 0 ? 0 : 1;
          const bHasRaidData = (b.raid_boss?.length ?? 0) > 0 ? 0 : 1;
          return (
            aHasRaidData - bHasRaidData ||
            a.pokedex_number - b.pokedex_number ||
            a.name.localeCompare(b.name)
          );
        },
      ),
    [variants],
  );

  const selectedBoss =
    bossOptions.find((boss) => boss.variant_id === selectedBossId) ?? bossOptions[0] ?? null;

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
          boss.name.toLowerCase().includes(query) ||
          String(boss.pokedex_number).padStart(4, '0').includes(query),
      )
      .slice(0, 6);
  }, [bossOptions, bossSearch]);

  const attackers = useMemo(
    () => getUniqueByVariant(variants.filter(isEligibleRaidAttacker)),
    [variants],
  );

  const selectedTierKey: RaidTierKey = selectedBoss
    ? getRaidTierKeyForVariant(selectedBoss) ?? 'legendary'
    : 'legendary';
  const selectedTier = RAID_TIER_PRESETS[selectedTierKey];
  const selectedBossIsShadowRaid = isShadowRaidTier(selectedTierKey);
  const shadowMechanicsEnabled = selectedBossIsShadowRaid || shadowRaid;
  const activeShadowBossMode: ShadowBossMode = shadowMechanicsEnabled ? shadowBossMode : 'normal';
  const settings = useMemo<RaidCounterSettings>(
    () => ({
      attackerLevel,
      friendship,
      megaAllyBonus,
      partyPower,
      weatherBoostedType: weatherBoostedType === 'none' ? '' : weatherBoostedType,
      shadowBossMode: activeShadowBossMode,
    }),
    [
      activeShadowBossMode,
      attackerLevel,
      friendship,
      megaAllyBonus,
      partyPower,
      weatherBoostedType,
    ],
  );

  const bossCounterScores = useMemo(() => {
    if (viewMode !== 'boss') return [];
    if (!selectedBoss) return [];
    return scoreRaidCounters(attackers, selectedBoss, selectedTier, settings);
  }, [attackers, selectedBoss, selectedTier, settings, viewMode]);

  const raidScores = useMemo(() => {
    const scored = bestOnly ? dedupeBestCounterPerVariant(bossCounterScores) : bossCounterScores;
    return scored.filter((score) => matchesCounterSearch(score, attackerSearch)).slice(0, 30);
  }, [attackerSearch, bestOnly, bossCounterScores]);

  const overallScores = useMemo(() => {
    if (viewMode !== 'overall') return [];
    const scored = bestOnly
      ? scoreBestRaidOverallAttackers(attackers, settings, bossOptions)
      : scoreRaidOverallAttackers(attackers, settings, bossOptions);
    return scored.filter((score) => matchesCounterSearch(score, attackerSearch)).slice(0, 30);
  }, [attackerSearch, attackers, bestOnly, bossOptions, settings, viewMode]);

  const typeDpsScores = useMemo(() => {
    if (viewMode !== 'type-dps') return [];
    const allScores = scoreRaidTypeDps(attackers, selectedType, settings);
    const scored = bestOnly ? dedupeBestTypeDpsPerVariant(allScores) : allScores;
    return scored.filter((score) => matchesCounterSearch(score, attackerSearch)).slice(0, 30);
  }, [attackerSearch, attackers, bestOnly, selectedType, settings, viewMode]);

  const groupEstimate = useMemo(() => {
    if (viewMode !== 'boss') return null;
    if (!selectedBoss) return null;
    return estimateRaidGroup(bossCounterScores, selectedBoss, selectedTier, activeShadowBossMode);
  }, [activeShadowBossMode, bossCounterScores, selectedBoss, selectedTier, viewMode]);

  const bossStats = selectedBoss
    ? calculateRaidBossStats(selectedBoss, selectedTier, activeShadowBossMode)
    : null;
  const bossMetadata = selectedBoss ? getPrimaryRaidMetadataForVariant(selectedBoss) : null;
  const typeOptions = Object.values(TYPE_MAPPING).map((type) => type.name);
  const bossSearchActive = bossSearch.trim().length > 0;

  const handleBossSelect = (boss: PokemonVariant) => {
    setSelectedBossId(boss.variant_id);
    setBossSearch('');
  };

  const renderCounterToolbar = (label: string) => (
    <section className="raid-counter-toolbar">
      <label className="raid-field">
        <span>{label}</span>
        <input
          type="search"
          value={attackerSearch}
          onChange={(event) => setAttackerSearch(event.target.value)}
          placeholder="Pokemon, type, or move"
        />
      </label>
      <button
        className={`raid-toggle-button ${bestOnly ? 'active' : ''}`}
        onClick={() => setBestOnly((previous) => !previous)}
        type="button"
      >
        {bestOnly ? 'Best moves only' : 'All move pairs'}
      </button>
    </section>
  );

  const renderSharedModifiers = (includeShadowControls: boolean) => (
    <section className="raid-settings-grid" aria-label="Raid modifiers">
      <label className="raid-field">
        <span>Attacker level</span>
        <select
          value={attackerLevel}
          onChange={(event) =>
            setAttackerLevel(event.target.value as RaidCounterSettings['attackerLevel'])
          }
        >
          {ATTACKER_LEVEL_OPTIONS.map((level) => (
            <option key={level} value={level}>
              Level {level.replace('.0', '')}
            </option>
          ))}
        </select>
      </label>

      <label className="raid-field">
        <span>Friendship</span>
        <select
          value={friendship}
          onChange={(event) => setFriendship(event.target.value as FriendshipKey)}
        >
          {FRIENDSHIP_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label} ({FRIENDSHIP_DAMAGE_BONUS[option.key].toFixed(2)}x)
            </option>
          ))}
        </select>
      </label>

      <label className="raid-field">
        <span>Mega ally</span>
        <select
          value={megaAllyBonus}
          onChange={(event) => setMegaAllyBonus(event.target.value as MegaAllyBonusKey)}
        >
          {MEGA_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label} ({MEGA_ALLY_DAMAGE_BONUS[option.key].toFixed(1)}x)
            </option>
          ))}
        </select>
      </label>

      <label className="raid-field">
        <span>Party Power</span>
        <select
          value={partyPower}
          onChange={(event) => setPartyPower(event.target.value as PartyPowerKey)}
        >
          {PARTY_POWER_OPTIONS.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="raid-field">
        <span>Weather boost</span>
        <select
          value={weatherBoostedType}
          onChange={(event) => setWeatherBoostedType(event.target.value)}
        >
          <option value="none">No weather boost</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {capitalize(type)}
            </option>
          ))}
        </select>
      </label>

      {includeShadowControls && (
        <div className="raid-shadow-controls">
          <button
            className={`raid-toggle-button ${shadowMechanicsEnabled ? 'active' : ''}`}
            disabled={selectedBossIsShadowRaid}
            onClick={() => setShadowRaid((previous) => !previous)}
            type="button"
          >
            {selectedBossIsShadowRaid ? 'Shadow raid data' : 'Shadow raid'}
          </button>
          {shadowMechanicsEnabled && (
            <div className="raid-segmented-control" aria-label="Shadow boss state">
              {(['subdued', 'enraged'] as ShadowBossMode[]).map((mode) => (
                <button
                  className={shadowBossMode === mode ? 'active' : ''}
                  key={mode}
                  onClick={() => setShadowBossMode(mode)}
                  type="button"
                >
                  {capitalize(mode)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );

  const renderBossCounterCard = (score: RaidCounterScore, index: number) => (
    <article className="raid-counter-card" key={`${score.variant.variant_id}-${index}`}>
      <div className="raid-counter-rank">{index + 1}</div>
      <img src={getPokemonImage(score.variant)} alt="" />
      <div className="raid-counter-main">
        <strong>{score.variant.name}</strong>
        <span>
          {score.fastMove.name} / {score.chargedMove.name}
        </span>
        <small>
          CP {score.cp.toLocaleString()} at level {attackerLevel.replace('.0', '')}
        </small>
      </div>
      <div className="raid-counter-stats">
        <span>{formatDps(score.dps)} DPS</span>
        <span>{score.trainersNeeded} trainers</span>
        <span>{formatSeconds(score.soloTimeSeconds)}</span>
      </div>
    </article>
  );

  const renderTypeDpsMove = (
    label: 'Fast' | 'Charged',
    move: RaidTypeDpsScore['fastMove'],
    matchesType: boolean,
  ) => (
    <span className="raid-type-table-move">
      <span
        className={`raid-type-table-move-type ${getTypeClassName(
          move.type_name || move.type,
        )} ${matchesType ? 'type-match' : ''}`}
      >
        <img src={getMoveTypeIcon(move)} alt="" draggable={false} />
        {label} {getMoveTypeName(move)}
      </span>
      <span className="raid-type-table-move-name">{move.name}</span>
    </span>
  );

  const renderOverallRow = (score: RaidOverallScore, index: number) => (
    <tr key={`${score.variant.variant_id}-${index}`}>
      <td>
        <div className="raid-type-table-pokemon">
          <span className="raid-type-table-rank">{index + 1}</span>
          <img src={getPokemonImage(score.variant)} alt="" />
          <span className="raid-type-table-pokemon-copy">
            <strong>{score.variant.name}</strong>
            <small>{formatTypeList(getVariantTypeNames(score.variant)) || 'Unknown type'}</small>
          </span>
        </div>
      </td>
      <td>
        <div className="raid-type-table-moves">
          {renderTypeDpsMove('Fast', score.fastMove, false)}
          {renderTypeDpsMove('Charged', score.chargedMove, false)}
        </div>
      </td>
      <td className="raid-type-table-number">{formatDps(score.dps)}</td>
      <td className="raid-type-table-number">{formatWholeNumber(score.tdo)}</td>
      <td className="raid-type-table-number">{formatEr(score.er)}</td>
      <td className="raid-type-table-number">{score.cp.toLocaleString()}</td>
    </tr>
  );

  const renderTypeDpsRow = (score: RaidTypeDpsScore, index: number) => (
    <tr key={`${score.variant.variant_id}-${index}`}>
      <td>
        <div className="raid-type-table-pokemon">
          <span className="raid-type-table-rank">{index + 1}</span>
          <img src={getPokemonImage(score.variant)} alt="" />
          <span className="raid-type-table-pokemon-copy">
            <strong>{score.variant.name}</strong>
            <small>{formatTypeList(getVariantTypeNames(score.variant)) || 'Unknown type'}</small>
          </span>
        </div>
      </td>
      <td>
        <div className="raid-type-table-moves">
          {renderTypeDpsMove('Fast', score.fastMove, score.fastMatchesType)}
          {renderTypeDpsMove('Charged', score.chargedMove, score.chargedMatchesType)}
        </div>
      </td>
      <td className="raid-type-table-number">{formatDps(score.dps)}</td>
      <td className="raid-type-table-number">{formatWholeNumber(score.tdo)}</td>
      <td className="raid-type-table-number">{formatEr(score.er)}</td>
      <td className="raid-type-table-number">{score.cp.toLocaleString()}</td>
    </tr>
  );

  if (loading || movesLoading || raidDataLoading) {
    return <LoadingSpinner />;
  }

  if (attackers.length === 0) {
    return (
      <div className="raid-page">
        <section className="raid-empty-state">
          <p className="raid-eyebrow">Raid planner</p>
          <h1>No raid-ready attacker data yet.</h1>
          <p>Once the Pokédex data finishes loading, the planner can rank raid attackers.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="raid-page">
      <section className="raid-mode-tabs" aria-label="Raid planner views">
        <button
          className={viewMode === 'overall' ? 'active' : ''}
          onClick={() => setViewMode('overall')}
          type="button"
        >
          Top attackers
        </button>
        <button
          className={viewMode === 'type-dps' ? 'active' : ''}
          onClick={() => setViewMode('type-dps')}
          type="button"
        >
          Type breakdowns
        </button>
        <button
          className={viewMode === 'boss' ? 'active' : ''}
          onClick={() => setViewMode('boss')}
          type="button"
        >
          Boss counters
        </button>
      </section>

      {viewMode === 'overall' && (
        <section className="raid-layout raid-overall-layout">
          <aside className="raid-panel raid-type-panel">
            <div className="raid-panel-header">
              <p className="raid-eyebrow">Raid attackers</p>
              <h2>Overall</h2>
            </div>

            <p className="raid-panel-copy">
              Ranked by ER against known raid-boss typings so broadly useful attackers rise without
              forcing a single boss matchup.
            </p>

            <div className="raid-type-grid" aria-label="Type DPS pages">
              {typeOptions.map((type) => (
                <button
                  className={getTypeClassName(type)}
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setViewMode('type-dps');
                  }}
                  type="button"
                >
                  <img src={getTypeIconPath(type)} alt="" draggable={false} />
                  <span>{capitalize(type)}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="raid-panel raid-main-panel">
            <section className="raid-category-card" aria-label="Overall attacker category">
              <div>
                <span>Leaderboard</span>
                <strong>Overall ER</strong>
              </div>
              <p>
                ER balances raid DPS with time on field. Use the type breakdowns for same-type
                attacker roles, or boss counters for actual matchup effectiveness.
              </p>
            </section>

            {renderSharedModifiers(false)}
            {renderCounterToolbar('Attacker search')}

            <section className="raid-type-results" aria-label="Top raid attackers">
              {overallScores.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Pokémon</th>
                      <th scope="col">Moves</th>
                      <th scope="col">DPS</th>
                      <th scope="col">TDO</th>
                      <th scope="col">ER</th>
                      <th scope="col">CP</th>
                    </tr>
                  </thead>
                  <tbody>{overallScores.map(renderOverallRow)}</tbody>
                </table>
              ) : (
                <div className="raid-list-empty">No attackers match the current filters.</div>
              )}
            </section>
          </main>
        </section>
      )}

      {viewMode === 'boss' &&
        (selectedBoss && bossStats && groupEstimate ? (
          <section className="raid-layout">
            <aside className="raid-panel raid-boss-panel">
              <div className="raid-panel-header">
                <p className="raid-eyebrow">Raid boss</p>
                <h2>{selectedBoss.name}</h2>
              </div>

              <div className="raid-boss-card">
                <div className="raid-boss-image-shell">
                  <img src={getPokemonImage(selectedBoss)} alt={selectedBoss.name} />
                </div>
                <div className="raid-boss-summary">
                  <span>{getVariantBadge(selectedBoss)}</span>
                  <strong>CP {bossStats.bossCp.toLocaleString()}</strong>
                  <small>
                    {formatTypeList(getVariantTypeNames(selectedBoss)) || 'Unknown type'}
                  </small>
                </div>
              </div>

              <label className="raid-field">
                <span>Find boss</span>
                <input
                  type="search"
                  value={bossSearch}
                  autoComplete="off"
                  onChange={(event) => setBossSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredBossOptions[0]) {
                      handleBossSelect(filteredBossOptions[0]);
                    }
                  }}
                  placeholder="Search by name or number"
                />
              </label>

              {bossSearchActive && (
                <div className="raid-boss-suggestions" aria-label="Raid boss suggestions">
                  {filteredBossOptions.length > 0 ? (
                    filteredBossOptions.map((boss) => (
                      <button
                        className={`raid-boss-option ${
                          boss.variant_id === selectedBoss.variant_id ? 'active' : ''
                        }`}
                        key={boss.variant_id}
                        onClick={() => handleBossSelect(boss)}
                        type="button"
                      >
                        <img src={getPokemonImage(boss)} alt="" />
                        <span>{boss.name}</span>
                        <small>#{String(boss.pokedex_number).padStart(4, '0')}</small>
                      </button>
                    ))
                  ) : (
                    <p className="raid-boss-empty">No matching raid boss found.</p>
                  )}
                </div>
              )}
            </aside>

            <main className="raid-panel raid-main-panel">
              <section className="raid-category-card" aria-label="Raid category">
                <div>
                  <span>Raid category</span>
                  <strong>{selectedTier.label}</strong>
                </div>
                <p>{selectedTier.note}</p>
              </section>

              <section className="raid-boss-math">
                <div>
                  <span>Boss CP</span>
                  <strong>{bossStats.bossCp.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Boss HP</span>
                  <strong>{bossStats.hp.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Tier</span>
                  <strong>{selectedTier.shortLabel}</strong>
                </div>
                <div>
                  <span>Top team DPS</span>
                  <strong>{formatDps(groupEstimate.topTeamDps)}</strong>
                </div>
                <div>
                  <span>Min trainers</span>
                  <strong>{groupEstimate.minTrainers || '-'}</strong>
                </div>
                <div>
                  <span>Comfortable</span>
                  <strong>{groupEstimate.comfortableTrainers || '-'}</strong>
                </div>
              </section>

              {bossMetadata && (
                <section className="raid-catch-card">
                  <div>
                    <span>Known raid data</span>
                    <strong>{bossMetadata.tier}</strong>
                  </div>
                  <div>
                    <span>Catch CP</span>
                    <strong>
                      {bossMetadata.min_unboosted_cp} - {bossMetadata.max_unboosted_cp}
                    </strong>
                  </div>
                  <div>
                    <span>Boosted CP</span>
                    <strong>
                      {bossMetadata.min_boosted_cp} - {bossMetadata.max_boosted_cp}
                    </strong>
                  </div>
                </section>
              )}

              {renderSharedModifiers(true)}

              {shadowMechanicsEnabled && (
                <section className="raid-shadow-note">
                  <strong>Purified Gem reminder</strong>
                  <span>
                    Each Trainer can use up to 5 Purified Gems. It takes coordinated Gems to subdue
                    an enraged Shadow Raid Boss, so solo attempts should use the enraged estimate.
                  </span>
                </section>
              )}

              {renderCounterToolbar('Counter search')}

              <section className="raid-counter-list" aria-label="Raid counters">
                {raidScores.length > 0 ? (
                  raidScores.map(renderBossCounterCard)
                ) : (
                  <div className="raid-list-empty">No counters match the current filters.</div>
                )}
              </section>
            </main>
          </section>
        ) : (
          <section className="raid-empty-state">
            <div className="raid-panel-header">
              <p className="raid-eyebrow">Boss counters</p>
              <h2>No raid boss data yet.</h2>
            </div>
            <p>Overall and type leaderboards can still rank attackers while boss data loads.</p>
          </section>
        ))}

      {viewMode === 'type-dps' && (
        <section className="raid-layout raid-type-layout">
          <aside className="raid-panel raid-type-panel">
            <div className="raid-panel-header">
              <p className="raid-eyebrow">Type DPS</p>
              <h2>{capitalize(selectedType)}</h2>
            </div>

            <div className="raid-type-grid" aria-label="Type DPS pages">
              {typeOptions.map((type) => (
                <button
                  className={`${getTypeClassName(type)} ${selectedType === type ? 'active' : ''}`}
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
              {selectedType === 'normal' ? (
                <p>
                  Normal has no super-effective matchup, so this page uses neutral raid damage.
                </p>
              ) : (
                <p>
                  {capitalize(selectedType)} moves get the selected-type raid boost. DPS, TDO, and
                  ER are ranked by selected-type role damage while mixed off-type moves stay
                  neutral.
                </p>
              )}
            </section>

            {renderSharedModifiers(false)}
            {renderCounterToolbar('DPS search')}

            <section className="raid-type-results" aria-label="Type DPS counters">
              {typeDpsScores.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Pokémon</th>
                      <th scope="col">Moves</th>
                      <th scope="col">DPS</th>
                      <th scope="col">TDO</th>
                      <th scope="col">ER</th>
                      <th scope="col">CP</th>
                    </tr>
                  </thead>
                  <tbody>{typeDpsScores.map(renderTypeDpsRow)}</tbody>
                </table>
              ) : (
                <div className="raid-list-empty">
                  No eligible attackers have a {capitalize(selectedType)} fast or charged move.
                </div>
              )}
            </section>
          </main>
        </section>
      )}
    </div>
  );
};

export default Raid;
