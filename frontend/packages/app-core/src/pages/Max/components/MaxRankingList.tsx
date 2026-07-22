import { getTypeIconPath } from '@/utils/imageHelpers';
import { resolveAssetUrl } from '@/utils/assetUrl';

import { type MaxRankingEntry, type MaxRole } from '../utils/maxBattleModel';

type MaxRankingListProps = {
  entries: MaxRankingEntry[];
  role: MaxRole;
};

const formatName = (entry: MaxRankingEntry): string => entry.displayName;

const rankTier = (rank: number): string => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'standard';
};

const formatWhole = (value: number): string =>
  Math.round(value).toLocaleString();

const formatDecimal = (value: number, digits = 1): string =>
  value.toFixed(digits).replace(/\.0+$/, '');

const moveType = (move: MaxRankingEntry['fastMove']): string =>
  move.type_name?.trim() || move.type?.trim() || 'normal';

const primaryMetric = (entry: MaxRankingEntry) => {
  if (entry.role === 'tank') {
    if (entry.bossBenchmark) {
      return {
        label: 'Max cycles',
        value: formatDecimal(entry.bossBenchmark.meterCyclesSurvived),
      };
    }
    return { label: 'Effective bulk', value: formatWhole(entry.effectiveBulk) };
  }
  if (entry.role === 'healing') {
    return {
      label: `Spirit L${entry.maxSpiritLevel} / ally`,
      value: `${entry.healPerAlly} HP`,
    };
  }
  if (entry.bossBenchmark) {
    return { label: 'Max hit', value: `${entry.bossBenchmark.maxHitDamage} HP` };
  }
  return { label: 'Attack index', value: formatWhole(entry.attackIndex) };
};

const secondaryMetrics = (entry: MaxRankingEntry) => {
  if (entry.role === 'tank') {
    if (entry.bossBenchmark) {
      return [
        {
          label: 'Next Max',
          value: `${formatDecimal(entry.bossBenchmark.meterCycleSeconds)}s`,
        },
        {
          label: 'With Guard',
          value: `${formatDecimal(entry.bossBenchmark.guardedMeterCyclesSurvived)} cycles`,
        },
      ];
    }
    return [
      { label: 'HP', value: entry.hp.toLocaleString() },
      { label: 'Defense', value: formatWhole(entry.defense) },
    ];
  }
  if (entry.role === 'healing') {
    return [
      { label: 'All 4 active', value: `${entry.teamHeal} HP` },
      entry.bossBenchmark
        ? {
            label: 'Max cycles',
            value: formatDecimal(entry.bossBenchmark.meterCyclesSurvived),
          }
        : {
            label: 'Incoming damage',
            value: `${formatDecimal(entry.incomingMultiplier, 3)}x`,
          },
    ];
  }
  if (entry.bossBenchmark) {
    return [
      {
        label: 'Effectiveness',
        value: `${entry.outgoingMultiplier.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}x`,
      },
      { label: 'Attack', value: formatWhole(entry.attack) },
    ];
  }
  return [
    { label: 'Max power', value: entry.maxMovePower.toLocaleString() },
    { label: 'Attack', value: formatWhole(entry.attack) },
  ];
};

const moveSummary = (entry: MaxRankingEntry) => {
  if (entry.role === 'tank') {
    return {
      icon: null,
      label:
        entry.maxGuardLevel > 0
          ? `Max Guard L${entry.maxGuardLevel} · ${entry.maxGuardHp} shield HP`
          : 'Max Guard locked',
    };
  }
  if (entry.role === 'healing') {
    return {
      icon: null,
      label: `Max Spirit L${entry.maxSpiritLevel} · ${Math.round(entry.maxSpiritRate * 100)}% HP`,
    };
  }
  const typeLabel = `${entry.maxMoveType.charAt(0).toUpperCase()}${entry.maxMoveType.slice(1)}`;
  return {
    icon: getTypeIconPath(entry.maxMoveType),
    label:
      entry.maxForm === 'special' || entry.maxForm === 'gigantamax'
        ? entry.maxMoveName
        : `Max Move · ${typeLabel}`,
  };
};

const MaxRankingList = ({
  entries,
  role,
}: MaxRankingListProps) => (
  <section
    aria-label={`${role} rankings`}
    className="max-ranking-list"
  >
    <div className="max-ranking-rows">
      {entries.length > 0 ? (
        entries.map((entry, index) => {
          const rank = index + 1;
          const primary = primaryMetric(entry);
          const secondary = secondaryMetrics(entry);
          const move = moveSummary(entry);

          return (
            <article
              className="max-ranking-row"
              key={`${entry.variant.variant_id}-${entry.fastMove.move_id}-${entry.maxMoveType}`}
            >
              <span className={`max-rank max-rank--${rankTier(rank)}`}>{rank}</span>
              <div className="max-ranking-pokemon">
                <div className="max-ranking-image-shell">
                  <img
                    className="max-ranking-image"
                    src={resolveAssetUrl(
                      entry.variant.currentImage || entry.variant.image_url || '',
                    )}
                    alt=""
                    draggable={false}
                  />
                  {entry.maxForm !== 'special' && (
                    <img
                      className="max-ranking-form-icon"
                      src={
                        entry.maxForm === 'gigantamax'
                          ? '/images/gigantamax.png'
                          : '/images/dynamax.png'
                      }
                      alt=""
                      draggable={false}
                    />
                  )}
                </div>
                <div className="max-ranking-name">
                  <strong>{formatName(entry)}</strong>
                  {entry.personalized && (
                    <span className="max-ranking-owned-details">
                      {entry.variant.instanceData?.nickname?.trim() && (
                        <b>{entry.variant.instanceData.nickname.trim()}</b>
                      )}
                      <span>
                        CP {formatWhole(entry.cp)} · Level {entry.levelLabel}
                        {entry.ivPercent != null ? ` · ${entry.ivPercent}% IV` : ''}
                      </span>
                    </span>
                  )}
                  <span className="max-ranking-move">
                    {move.icon && <img src={move.icon} alt="" />}
                    <span>{move.label}</span>
                  </span>
                  <span className="max-ranking-fast-move">
                    <span>
                      <small>Fast</small>
                      <img src={getTypeIconPath(moveType(entry.fastMove))} alt="" />
                      <b>{entry.fastMove.name}</b>
                      <em>{formatDecimal(entry.meterSeconds)}s</em>
                    </span>
                  </span>
                </div>
              </div>
              <dl className="max-ranking-metrics">
                <div className="max-ranking-primary-metric">
                  <dt>{primary.label}</dt>
                  <dd>{primary.value}</dd>
                </div>
                {secondary.map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })
      ) : (
        <div className="max-ranking-empty">
          <strong>No eligible Max Pokémon</strong>
          <span>Try another role or matchup type.</span>
        </div>
      )}
    </div>
  </section>
);

export default MaxRankingList;
