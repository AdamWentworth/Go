import { useDeferredValue, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  MaxRankingEntry,
  MaxRole,
  MaxRoleCandidates,
} from '@pokemongonexus/app-core/max-battle-model';
import {
  getDefaultMaxBattleTier,
  getMaxBattleBossPreset,
  getMaxBattleTierOptions,
  MAX_BATTLE_EXECUTION_PRESETS,
  simulateMaxBattle,
  type MaxBattleExecution,
  type MaxBattleSimulationOutcome,
  type MaxBattleSimulationTeam,
  type MaxBattleTier,
} from '@pokemongonexus/app-core/max-battle-simulation';
import type { PokemonVariant } from '@pokemongonexus/shared-contracts/variants';
import { useNativeColorScheme } from '../../features/settings/useNativeColorScheme';

type Props = {
  assetBaseUrl: string;
  boss: PokemonVariant;
  candidates: MaxRoleCandidates;
  initialDifficulty?: MaxBattleTier | null;
  initialTrainerCount?: number | null;
  rosterScope: 'catalog' | 'owned';
};

type TeamSelection = Record<MaxRole, string>;

const ROLES: MaxRole[] = ['damage', 'tank', 'healing'];
const ROLE_LABELS: Record<MaxRole, string> = {
  damage: 'Damage',
  tank: 'Tank',
  healing: 'Healing',
};
const ROLE_ICONS: Record<MaxRole, string> = {
  damage: 'ϟ',
  tank: '◆',
  healing: '♥',
};
const OUTCOME_COPY: Record<MaxBattleSimulationOutcome, { detail: string; label: string }> = {
  'likely-clear': {
    detail: 'Useful time and survival reserve remain in this model.',
    label: 'Likely clear',
  },
  'close-call': {
    detail: 'Small execution, moveset, or teammate differences could decide it.',
    label: 'Close call',
  },
  unlikely: {
    detail: 'The group runs out of damage or endurance before the limit.',
    label: 'More help needed',
  },
};

const absoluteUri = (base: string, value?: string | null) => {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
};

const entryKey = (entry: MaxRankingEntry): string =>
  `${entry.variant.variant_id}::${entry.fastMove.move_id}::${entry.maxMoveType}`;

const recommendedSelection = (candidates: MaxRoleCandidates): TeamSelection => {
  const usedVariants = new Set<string>();
  const selection: TeamSelection = { damage: '', tank: '', healing: '' };
  ROLES.forEach((role) => {
    const entry = candidates[role].find(
      (candidate) => !usedVariants.has(candidate.variant.variant_id),
    ) ?? candidates[role][0];
    if (!entry) return;
    selection[role] = entryKey(entry);
    usedVariants.add(entry.variant.variant_id);
  });
  return selection;
};

const resolveTeam = (
  candidates: MaxRoleCandidates,
  selection: TeamSelection,
): MaxBattleSimulationTeam | null => {
  const damage = candidates.damage.find((entry) => entryKey(entry) === selection.damage)
    ?? candidates.damage[0];
  const tank = candidates.tank.find((entry) => entryKey(entry) === selection.tank)
    ?? candidates.tank[0];
  const healing = candidates.healing.find((entry) => entryKey(entry) === selection.healing)
    ?? candidates.healing[0];
  return damage && tank && healing ? { damage, tank, healing } : null;
};

const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '—';
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${remainder}s`;
};

export const NativeMaxBattleSimulator = ({
  assetBaseUrl,
  boss,
  candidates,
  initialDifficulty = null,
  initialTrainerCount = null,
  rosterScope,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const difficultyOptions = useMemo(() => getMaxBattleTierOptions(boss), [boss]);
  const defaultDifficulty = useMemo(() => (
    initialDifficulty && difficultyOptions.includes(initialDifficulty)
      ? initialDifficulty
      : getDefaultMaxBattleTier(boss)
  ), [boss, difficultyOptions, initialDifficulty]);
  const [difficulty, setDifficulty] = useState<MaxBattleTier>(defaultDifficulty);
  const preset = useMemo(
    () => getMaxBattleBossPreset(boss, difficulty),
    [boss, difficulty],
  );
  const defaults = useMemo(() => recommendedSelection(candidates), [candidates]);
  const [selection, setSelection] = useState<TeamSelection>(defaults);
  const [trainerCount, setTrainerCount] = useState(() => {
    const initialPreset = getMaxBattleBossPreset(boss, defaultDifficulty);
    return initialTrainerCount == null
      ? initialPreset.defaultTrainers
      : Math.min(initialPreset.maxTrainers, Math.max(1, Math.round(initialTrainerCount)));
  });
  const [execution, setExecution] = useState<MaxBattleExecution>('standard');
  const [advanced, setAdvanced] = useState(false);

  const team = useMemo(
    () => resolveTeam(candidates, selection),
    [candidates, selection],
  );
  const deferredDifficulty = useDeferredValue(difficulty);
  const deferredTeam = useDeferredValue(team);
  const deferredTrainerCount = useDeferredValue(trainerCount);
  const scenarios = useMemo(() => deferredTeam ? {
    standard: simulateMaxBattle({
      boss,
      execution: 'standard',
      trainerCount: deferredTrainerCount,
      team: deferredTeam,
      tier: deferredDifficulty,
    }),
    'stress-test': simulateMaxBattle({
      boss,
      execution: 'stress-test',
      trainerCount: deferredTrainerCount,
      team: deferredTeam,
      tier: deferredDifficulty,
    }),
  } : null, [boss, deferredDifficulty, deferredTeam, deferredTrainerCount]);
  const result = scenarios?.[execution] ?? null;

  const cycleCandidate = (role: MaxRole) => {
    const options = candidates[role];
    if (options.length < 2) return;
    const currentIndex = options.findIndex((entry) => entryKey(entry) === selection[role]);
    const next = options[(currentIndex + 1 + options.length) % options.length];
    setSelection((current) => ({ ...current, [role]: entryKey(next) }));
  };

  const setBoundedTrainers = (value: number) => {
    setTrainerCount(Math.min(preset.maxTrainers, Math.max(1, Math.round(value))));
  };

  return (
    <View accessibilityLabel="Max Battle simulator" style={[styles.root, light && styles.rootLight]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>RECOMMENDED PARTY</Text>
          <Text style={[styles.title, light && styles.textLight]}>Can this group beat {boss.name}?</Text>
        </View>
        <View style={styles.profile}>
          <Text style={[styles.profileLabel, light && styles.textLight]}>{preset.label}</Text>
          <Text style={styles.confidence}>{preset.confidence} profile</Text>
        </View>
      </View>

      {difficultyOptions.length > 1 ? (
        <View accessibilityLabel="Max Battle difficulty" style={styles.optionRow}>
          {difficultyOptions.map((tier) => {
            const option = getMaxBattleBossPreset(boss, tier);
            const selected = difficulty === tier;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={tier}
                onPress={() => {
                  setDifficulty(tier);
                  setTrainerCount(option.defaultTrainers);
                }}
                style={[styles.option, light && styles.controlLight, selected && styles.optionActive]}
              >
                <Text style={[styles.optionText, light && styles.textLight, selected && styles.optionTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {team && result ? (
        <>
          <View style={[styles.decision, styles[`decision_${result.outcome}`]]}>
            <View style={styles.decisionCopy}>
              <Text style={styles.decisionLabel}>{OUTCOME_COPY[result.outcome].label}</Text>
              <Text style={styles.decisionMetric}>
                {Math.round(result.damagePercent * 100)}% modeled damage · {formatDuration(result.estimatedClearSeconds)} clear
              </Text>
              <Text style={styles.decisionDetail}>{OUTCOME_COPY[result.outcome].detail}</Text>
            </View>
            <View style={[styles.trainerControl, light && styles.controlLight]}>
              <Text style={[styles.trainerLabel, light && styles.mutedLight]}>TRAINERS</Text>
              <View style={styles.trainerButtons}>
                <Pressable
                  accessibilityLabel="Remove one Trainer"
                  accessibilityRole="button"
                  disabled={trainerCount <= 1}
                  onPress={() => setBoundedTrainers(trainerCount - 1)}
                  style={styles.trainerButton}
                >
                  <Text style={styles.trainerButtonText}>−</Text>
                </Pressable>
                <Text accessibilityLabel={`${trainerCount} Trainers`} style={[styles.trainerCount, light && styles.textLight]}>{trainerCount}</Text>
                <Pressable
                  accessibilityLabel="Add one Trainer"
                  accessibilityRole="button"
                  disabled={trainerCount >= preset.maxTrainers}
                  onPress={() => setBoundedTrainers(trainerCount + 1)}
                  style={styles.trainerButton}
                >
                  <Text style={styles.trainerButtonText}>+</Text>
                </Pressable>
              </View>
              <Text style={[styles.trainerLimit, light && styles.mutedLight]}>up to {preset.maxTrainers}</Text>
            </View>
          </View>

          <View accessibilityLabel="Recommended three-Pokémon party" style={styles.party}>
            {ROLES.map((role) => {
              const entry = team[role];
              return (
                <Pressable
                  accessibilityLabel={`${ROLE_LABELS[role]} team member, ${entry.displayName}. Tap to use the next recommendation.`}
                  accessibilityRole="button"
                  key={role}
                  onPress={() => cycleCandidate(role)}
                  style={[styles.member, light && styles.memberLight]}
                >
                  <Text style={[styles.role, styles[`role_${role}`]]}>{ROLE_ICONS[role]} {ROLE_LABELS[role]}</Text>
                  <Image fadeDuration={0}
                    resizeMode="contain"
                    source={{ uri: absoluteUri(assetBaseUrl, entry.variant.currentImage || entry.variant.image_url) }}
                    style={styles.image}
                  />
                  <Text numberOfLines={2} style={[styles.memberName, light && styles.textLight]}>{entry.displayName}</Text>
                  <Text numberOfLines={1} style={[styles.memberMove, light && styles.mutedLight]}>{entry.maxMoveName}</Text>
                  {candidates[role].length > 1 ? <Text style={styles.change}>Tap to change</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <View accessibilityLabel="Execution model" style={styles.execution}>
            {(Object.keys(MAX_BATTLE_EXECUTION_PRESETS) as MaxBattleExecution[]).map((value) => {
              const selected = execution === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={value}
                  onPress={() => setExecution(value)}
                  style={[styles.executionButton, light && styles.controlLight, selected && styles.executionActive]}
                >
                  <Text style={[styles.executionText, light && styles.textLight, selected && styles.executionTextActive]}>{MAX_BATTLE_EXECUTION_PRESETS[value].label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.executionDetail, light && styles.mutedLight]}>{MAX_BATTLE_EXECUTION_PRESETS[execution].detail}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: advanced }}
            onPress={() => setAdvanced((current) => !current)}
            style={styles.advancedToggle}
          >
            <Text style={[styles.advancedLabel, light && styles.textLight]}>Advanced setup and model details</Text>
            <Text style={styles.advancedChevron}>{advanced ? '⌃' : '⌄'}</Text>
          </Pressable>

          {advanced && scenarios ? (
            <View style={[styles.advanced, light && styles.advancedLight]}>
              <View style={styles.metrics}>
                <View style={styles.metric}><Text style={[styles.metricLabel, light && styles.mutedLight]}>CLEAR TIME</Text><Text style={[styles.metricValue, light && styles.textLight]}>{formatDuration(result.estimatedClearSeconds)}</Text></View>
                <View style={styles.metric}><Text style={[styles.metricLabel, light && styles.mutedLight]}>LOBBY DAMAGE</Text><Text style={[styles.metricValue, light && styles.textLight]}>{result.lobbyDps.toFixed(1)}/s</Text></View>
                <View style={styles.metric}><Text style={[styles.metricLabel, light && styles.mutedLight]}>MAX PHASES</Text><Text style={[styles.metricValue, light && styles.textLight]}>{result.estimatedMaxPhases}</Text></View>
              </View>
              <Text style={[styles.assumption, light && styles.mutedLight]}>
                Standard: {OUTCOME_COPY[scenarios.standard.outcome].label}, {formatDuration(scenarios.standard.estimatedClearSeconds)} · Stress: {OUTCOME_COPY[scenarios['stress-test'].outcome].label}, {formatDuration(scenarios['stress-test'].estimatedClearSeconds)}.
              </Text>
              <Text style={[styles.assumption, light && styles.mutedLight]}>
                {rosterScope === 'owned'
                  ? 'Uses your recorded level, IVs, Fast Move, and unlocked Max Move levels.'
                  : 'Catalog entries use level 50, perfect IVs, and level-3 Max Moves.'}
              </Text>
              <Text style={[styles.assumption, light && styles.mutedLight]}>
                Charge plan: {result.meterPlan.fastMove.name}{result.meterPlan.chargedMove ? ` + ${result.meterPlan.chargedMove.name}` : ' only'} · limiting window {formatDuration(result.limitingSeconds)}.
              </Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, light && styles.textLight]}>A complete three-Pokémon party is required</Text>
          <Text style={[styles.detail, light && styles.mutedLight]}>Add eligible Damage, Tank, and Healing Pokémon to this roster.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 10, marginTop: 10, borderWidth: 1, borderColor: '#365a5c', borderRadius: 12, padding: 11, backgroundColor: '#101a1b' },
  rootLight: { borderColor: '#9bbabb', backgroundColor: '#f7fbfb' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  headerCopy: { minWidth: 0, flex: 1 },
  eyebrow: { color: '#57d9cb', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { marginTop: 2, color: '#fff', fontSize: 17, lineHeight: 21, fontWeight: '900' },
  textLight: { color: '#112a2b' },
  mutedLight: { color: '#5d7273' },
  profile: { alignItems: 'flex-end' },
  profileLabel: { color: '#eef9f8', fontSize: 9, fontWeight: '900' },
  confidence: { marginTop: 3, color: '#57d9cb', fontSize: 7, fontWeight: '900', textTransform: 'capitalize' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  option: { minHeight: 34, justifyContent: 'center', borderWidth: 1, borderColor: '#405253', borderRadius: 8, paddingHorizontal: 9, backgroundColor: '#141f20' },
  controlLight: { borderColor: '#b5c7c7', backgroundColor: '#fff' },
  optionActive: { borderColor: '#e9bd4f', backgroundColor: '#f0cf6c' },
  optionText: { color: '#b8c5c4', fontSize: 8, fontWeight: '900' },
  optionTextActive: { color: '#171b1b' },
  decision: { flexDirection: 'row', alignItems: 'stretch', gap: 8, borderLeftWidth: 4, borderRadius: 8, padding: 9, backgroundColor: '#142323' },
  'decision_likely-clear': { borderLeftColor: '#36cb82' },
  'decision_close-call': { borderLeftColor: '#f0c857' },
  decision_unlikely: { borderLeftColor: '#ec6681' },
  decisionCopy: { minWidth: 0, flex: 1 },
  decisionLabel: { color: '#57d9cb', fontSize: 13, fontWeight: '900' },
  decisionMetric: { marginTop: 2, color: '#fff', fontSize: 10, lineHeight: 14, fontWeight: '800' },
  decisionDetail: { marginTop: 3, color: '#a7b8b7', fontSize: 8.5, lineHeight: 12 },
  detail: { marginTop: 3, color: '#99acab', fontSize: 8.5, lineHeight: 12 },
  trainerControl: { minWidth: 94, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3b4e4f', borderRadius: 8, padding: 5, backgroundColor: '#0d1718' },
  trainerLabel: { color: '#91a5a4', fontSize: 7, fontWeight: '900' },
  trainerButtons: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  trainerButton: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#296d68' },
  trainerButtonText: { color: '#fff', fontSize: 17, lineHeight: 18, fontWeight: '900' },
  trainerCount: { minWidth: 20, color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  trainerLimit: { marginTop: 2, color: '#899d9c', fontSize: 7 },
  party: { flexDirection: 'row', gap: 6 },
  member: { minWidth: 0, flex: 1, minHeight: 155, alignItems: 'center', borderWidth: 1, borderColor: '#385052', borderRadius: 9, padding: 6, backgroundColor: '#111c1d' },
  memberLight: { borderColor: '#b8caca', backgroundColor: '#fff' },
  role: { alignSelf: 'stretch', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  role_damage: { color: '#ee6692' },
  role_tank: { color: '#73d9d1' },
  role_healing: { color: '#f1c65b' },
  image: { width: 70, height: 70, marginTop: 2 },
  memberName: { minHeight: 28, color: '#fff', fontSize: 10, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  memberMove: { marginTop: 2, color: '#9daead', fontSize: 7.5, textAlign: 'center' },
  change: { marginTop: 'auto', color: '#4dcfc2', fontSize: 7, fontWeight: '800' },
  execution: { flexDirection: 'row', gap: 6 },
  executionButton: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3b4d4e', borderRadius: 8, backgroundColor: '#111c1d' },
  executionActive: { borderColor: '#45d6c8', backgroundColor: '#225f5c' },
  executionText: { color: '#a9b8b7', fontSize: 9, fontWeight: '900' },
  executionTextActive: { color: '#fff' },
  executionDetail: { marginTop: -5, color: '#92a5a4', fontSize: 8, lineHeight: 11, textAlign: 'center' },
  advancedToggle: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#314748', paddingTop: 7 },
  advancedLabel: { color: '#eef7f6', fontSize: 10, fontWeight: '900' },
  advancedChevron: { color: '#58d7cb', fontSize: 15 },
  advanced: { gap: 8, borderRadius: 8, padding: 9, backgroundColor: '#0b1516' },
  advancedLight: { backgroundColor: '#eaf2f2' },
  metrics: { flexDirection: 'row', gap: 5 },
  metric: { minWidth: 0, flex: 1 },
  metricLabel: { color: '#8fa3a2', fontSize: 6.5, fontWeight: '900' },
  metricValue: { marginTop: 2, color: '#fff', fontSize: 11, fontWeight: '900' },
  assumption: { color: '#9aacaa', fontSize: 8, lineHeight: 12 },
  empty: { alignItems: 'center', gap: 3, paddingVertical: 18 },
  emptyTitle: { color: '#fff', fontSize: 13, fontWeight: '900', textAlign: 'center' },
});
