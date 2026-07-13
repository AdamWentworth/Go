import React, { useEffect, useMemo, useState } from 'react';
import './Raid.css';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';
import LoadingSpinner from '../../components/LoadingSpinner';
import { TYPE_MAPPING } from './utils/constants';
import {
  FRIENDSHIP_DAMAGE_BONUS,
  MEGA_ALLY_DAMAGE_BONUS,
  RAID_TIER_PRESETS,
  calculateRaidBossStats,
  dedupeBestCounterPerVariant,
  estimateRaidGroup,
  formatSeconds,
  getPrimaryRaidMetadataForVariant,
  getRaidTierKeyForVariant,
  getVariantTypeNames,
  isEligibleRaidAttacker,
  isEligibleRaidBoss,
  isShadowRaidTier,
  scoreRaidCounters,
  type FriendshipKey,
  type MegaAllyBonusKey,
  type PartyPowerKey,
  type RaidCounterScore,
  type RaidCounterSettings,
  type RaidTierKey,
  type ShadowBossMode,
} from './utils/raidCalculations';

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

const getUniqueByVariant = (variants: PokemonVariant[]): PokemonVariant[] => {
  const seen = new Set<string>();
  return variants.filter((variant) => {
    const key = variant.variant_id || `${variant.pokemon_id}-${variant.variantType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const matchesCounterSearch = (score: RaidCounterScore, query: string): boolean => {
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

  const [bossSearch, setBossSearch] = useState('');
  const [selectedBossId, setSelectedBossId] = useState<string>('');
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

  const raidScores = useMemo(() => {
    if (!selectedBoss) return [];
    const allScores = scoreRaidCounters(attackers, selectedBoss, selectedTier, settings);
    const scored = bestOnly ? dedupeBestCounterPerVariant(allScores) : allScores;
    return scored.filter((score) => matchesCounterSearch(score, attackerSearch)).slice(0, 30);
  }, [attackerSearch, attackers, bestOnly, selectedBoss, selectedTier, settings]);

  const groupEstimate = useMemo(() => {
    if (!selectedBoss) return null;
    const allScores = scoreRaidCounters(attackers, selectedBoss, selectedTier, settings);
    return estimateRaidGroup(allScores, selectedBoss, selectedTier, activeShadowBossMode);
  }, [activeShadowBossMode, attackers, selectedBoss, selectedTier, settings]);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!selectedBoss || !bossStats || !groupEstimate) {
    return (
      <div className="raid-page">
        <section className="raid-empty-state">
          <p className="raid-eyebrow">Raid planner</p>
          <h1>No raid-ready Pokémon data yet.</h1>
          <p>Once the Pokédex data finishes loading, the planner can build raid boss options.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="raid-page">
      <section className="raid-hero">
        <div className="raid-hero-copy">
          <p className="raid-eyebrow">Raid planner</p>
          <h1>Build a raid team around today&apos;s Gym raid rules.</h1>
          <p>
            Pick a boss, let known raid data choose its category, then layer in current
            bonuses like friendship, Mega ally boosts, weather, Party Power, and Shadow raid
            enrage state.
          </p>
        </div>

        <div className="raid-mechanics-card" aria-label="Current raid mechanics summary">
          <div>
            <span>Lobby</span>
            <strong>20 Trainers</strong>
          </div>
          <div>
            <span>Team</span>
            <strong>6 Pokemon</strong>
          </div>
          <div>
            <span>Boss HP</span>
            <strong>{selectedTier.bossHp.toLocaleString()}</strong>
          </div>
          <div>
            <span>Timer</span>
            <strong>{formatSeconds(selectedTier.timeLimitSeconds)}</strong>
          </div>
        </div>
      </section>

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
                {getVariantTypeNames(selectedBoss).map(capitalize).join(' / ') || 'Unknown type'}
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
          </section>

          {shadowMechanicsEnabled && (
            <section className="raid-shadow-note">
              <strong>Purified Gem reminder</strong>
              <span>
                Each Trainer can use up to 5 Purified Gems. It takes coordinated Gems to subdue an
                enraged Shadow Raid Boss, so solo attempts should use the enraged estimate.
              </span>
            </section>
          )}

          <section className="raid-counter-toolbar">
            <label className="raid-field">
              <span>Counter search</span>
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

          <section className="raid-counter-list" aria-label="Raid counters">
            {raidScores.map((score, index) => (
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
            ))}
          </section>
        </main>
      </section>
    </div>
  );
};

export default Raid;
