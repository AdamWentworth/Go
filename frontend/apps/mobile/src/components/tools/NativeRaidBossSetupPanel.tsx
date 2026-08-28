import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type {
  NativeCombatEntry,
  NativeRaidBossEntry,
} from '../../features/tools/nativeBattleModels';
import {
  estimateNativeRaidGroup,
  resolveNativeRaidTier,
  simulateNativeRaidLobby,
  type NativeRaidPartyResult,
} from '../../features/tools/nativeRaidPlannerModel';
import { NativeRaidCalibrationPanel } from './NativeRaidCalibrationPanel';
import { NativeRaidPartyBuilder } from './NativeRaidPartyBuilder';
import { useNativeColorScheme } from '../../features/settings/useNativeColorScheme';

type Props = {
  assetBaseUrl: string;
  boss: NativeRaidBossEntry;
  onObservedDodgeRateChange?: (rate: number | null) => void;
  scores: NativeCombatEntry[];
};

const trainerLabel = (count: number) => count > 0 ? `${count} trainer${count === 1 ? '' : 's'}` : '—';

export const NativeRaidBossSetupPanel = ({ assetBaseUrl, boss, onObservedDodgeRateChange, scores }: Props) => {
  const light = useNativeColorScheme() === 'light';
  const [open, setOpen] = useState(false);
  const [partyResult, setPartyResult] = useState<NativeRaidPartyResult | null>(null);
  const tier = useMemo(() => resolveNativeRaidTier(boss), [boss]);
  const estimate = useMemo(() => estimateNativeRaidGroup(scores, tier), [scores, tier]);
  const calibrationPrediction = partyResult ?? simulateNativeRaidLobby(estimate, tier, Math.max(1, estimate.minimumTrainers || 1));
  const shadow = tier.key.startsWith('shadow');

  return (
    <View style={[styles.panel, light && styles.panelLight]}>
      <Pressable
        accessibilityLabel="Raid setup"
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        style={styles.toggle}
      >
        <Text style={styles.toggleIcon}>⚒</Text>
        <View style={styles.toggleCopy}>
          <Text style={[styles.toggleTitle, light && styles.textLight]}>Raid setup</Text>
          <Text numberOfLines={1} style={[styles.toggleMeta, light && styles.mutedLight]}>{tier.label} · team, settings, and raid log</Text>
        </View>
        <Text style={[styles.chevron, light && styles.textLight]}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.content}>
          <View style={[styles.overview, light && styles.subpanelLight]}>
            <View style={styles.overviewHeader}>
              <View style={styles.overviewCopy}>
                <Text style={styles.eyebrow}>{tier.label.toLocaleUpperCase()}</Text>
                <Text style={[styles.note, light && styles.mutedLight]}>{tier.note}</Text>
              </View>
              <View style={styles.hp}><Text style={[styles.hpValue, light && styles.textLight]}>{tier.bossHp.toLocaleString()}</Text><Text style={styles.hpLabel}>BOSS HP</Text></View>
            </View>
            <View style={styles.stats}>
              <View style={[styles.primaryStat, styles.stat]}><Text style={styles.statLabel}>MINIMUM</Text><Text style={styles.statValue}>{trainerLabel(estimate.minimumTrainers)}</Text></View>
              <View style={styles.stat}><Text style={[styles.statLabel, light && styles.mutedLight]}>COMFORTABLE</Text><Text style={[styles.statValue, light && styles.textLight]}>{trainerLabel(estimate.comfortableTrainers)}</Text></View>
              <View style={styles.stat}><Text style={[styles.statLabel, light && styles.mutedLight]}>TEAM DPS</Text><Text style={[styles.statValue, light && styles.textLight]}>{estimate.teamDps.toFixed(1)}</Text></View>
            </View>
            <View style={[styles.catchRanges, light && styles.catchRangesLight]}>
              <Text style={[styles.catchText, light && styles.mutedLight]}>Catch CP  <Text style={[styles.catchValue, light && styles.textLight]}>{boss.boss.min_unboosted_cp}–{boss.boss.max_unboosted_cp}</Text></Text>
              <Text style={[styles.catchText, light && styles.mutedLight]}>Weather boosted  <Text style={[styles.catchValue, light && styles.textLight]}>{boss.boss.min_boosted_cp}–{boss.boss.max_boosted_cp}</Text></Text>
            </View>
          </View>

          <NativeRaidPartyBuilder assetBaseUrl={assetBaseUrl} onResultChange={setPartyResult} scores={scores} tier={tier} />

          <NativeRaidCalibrationPanel
            disabled={scores.length === 0}
            onObservedDodgeRateChange={onObservedDodgeRateChange}
            predictedCleared={calibrationPrediction.clears}
            predictedSeconds={Number.isFinite(calibrationPrediction.seconds) ? calibrationPrediction.seconds : null}
          />

          {shadow ? <View style={styles.shadowNote}><Text style={styles.shadowTitle}>Purified Gem reminder</Text><Text style={styles.shadowCopy}>Each Trainer can use up to 5 Purified Gems. Coordinate Gems to subdue an enraged Shadow Raid Boss.</Text></View> : null}
          <Text style={[styles.rules, light && styles.mutedLight]}>Estimates use six distinct attackers and at most one Mega or Primal. One caught Pokémon cannot fill two team slots.</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { overflow: 'hidden', borderWidth: 1, borderColor: '#355052', borderRadius: 13, backgroundColor: '#101819' },
  panelLight: { borderColor: '#b9cdcd', backgroundColor: '#fff' },
  toggle: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  toggleIcon: { color: '#55ddd4', fontSize: 21 },
  toggleCopy: { minWidth: 0, flex: 1 },
  toggleTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  toggleMeta: { marginTop: 1, color: '#9db0b1', fontSize: 9.5 },
  chevron: { color: '#eaf5f5', fontSize: 13, fontWeight: '900' },
  content: { gap: 9, borderTopWidth: 1, borderTopColor: '#2b4142', padding: 9 },
  overview: { overflow: 'hidden', borderRadius: 11, backgroundColor: '#172223' },
  subpanelLight: { backgroundColor: '#eef5f4' },
  overviewHeader: { flexDirection: 'row', gap: 8, padding: 10 },
  overviewCopy: { minWidth: 0, flex: 1 },
  eyebrow: { color: '#4ddbd0', fontSize: 8.5, fontWeight: '900', letterSpacing: .8 },
  note: { marginTop: 2, color: '#a1b3b4', fontSize: 9.5, lineHeight: 13 },
  hp: { alignItems: 'flex-end' },
  hpValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  hpLabel: { color: '#62dcd4', fontSize: 7, fontWeight: '900' },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2c4243' },
  stat: { flex: 1, gap: 2, padding: 9 },
  primaryStat: { backgroundColor: '#236f68' },
  statLabel: { color: '#a4b5b6', fontSize: 7, fontWeight: '900' },
  statValue: { color: '#fff', fontSize: 12, fontWeight: '900' },
  catchRanges: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, borderTopWidth: 1, borderTopColor: '#2c4243', padding: 9 },
  catchRangesLight: { borderTopColor: '#cedddd' },
  catchText: { color: '#9db0b1', fontSize: 8.5 },
  catchValue: { color: '#fff', fontWeight: '900' },
  shadowNote: { gap: 3, borderWidth: 1, borderColor: '#9569c7', borderRadius: 10, padding: 10, backgroundColor: '#2a183a' },
  shadowTitle: { color: '#ead6ff', fontSize: 11, fontWeight: '900' },
  shadowCopy: { color: '#ceb6e7', fontSize: 9.5, lineHeight: 13 },
  rules: { color: '#8fa2a3', fontSize: 8.5, lineHeight: 12 },
  textLight: { color: '#142629' },
  mutedLight: { color: '#657879' },
});
