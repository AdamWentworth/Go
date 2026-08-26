import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type { NativeCombatEntry, NativeRaidBossEntry } from '../../features/tools/nativeBattleModels';
import {
  estimateNativeRaidGroup,
  getNativeRaidTeam,
  resolveNativeRaidTier,
  simulateNativeRaidLobby,
} from '../../features/tools/nativeRaidPlannerModel';

type Props = {
  assetBaseUrl: string;
  boss: NativeRaidBossEntry;
  scores: NativeCombatEntry[];
};

const assetUri = (base: string, value: string | null) => {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
};

const trainerLabel = (count: number) => count > 0 ? `${count} trainer${count === 1 ? '' : 's'}` : '—';

export const NativeRaidBossSetupPanel = ({ assetBaseUrl, boss, scores }: Props) => {
  const light = useColorScheme() === 'light';
  const [open, setOpen] = useState(false);
  const [partyOpen, setPartyOpen] = useState(false);
  const tier = useMemo(() => resolveNativeRaidTier(boss), [boss]);
  const estimate = useMemo(() => estimateNativeRaidGroup(scores, tier), [scores, tier]);
  const team = useMemo(() => getNativeRaidTeam(scores), [scores]);
  const [trainerCount, setTrainerCount] = useState(Math.max(1, estimate.minimumTrainers || 1));
  const [simulationCount, setSimulationCount] = useState<number | null>(null);
  const simulation = simulationCount == null ? null : simulateNativeRaidLobby(estimate, tier, simulationCount);
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
              <View style={styles.hp}><Text style={[styles.hpValue, light && styles.textLight]}>{tier.hp.toLocaleString()}</Text><Text style={styles.hpLabel}>BOSS HP</Text></View>
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

          <View style={[styles.party, light && styles.subpanelLight]}>
            <Pressable
              accessibilityLabel="Custom raid party"
              accessibilityRole="button"
              accessibilityState={{ expanded: partyOpen }}
              onPress={() => setPartyOpen((current) => !current)}
              style={styles.partyToggle}
            >
              <Text style={styles.partyIcon}>♟</Text>
              <View style={styles.toggleCopy}><Text style={[styles.partyTitle, light && styles.textLight]}>Custom raid party</Text><Text style={[styles.toggleMeta, light && styles.mutedLight]}>Build and test a lobby with your top team</Text></View>
              <Text style={[styles.chevron, light && styles.textLight]}>{partyOpen ? '⌃' : '⌄'}</Text>
            </Pressable>
            {partyOpen ? (
              <View style={styles.partyContent}>
                <View style={styles.lobbyRow}>
                  <View><Text style={styles.eyebrow}>LOBBY SIZE</Text><Text style={[styles.lobbyTitle, light && styles.textLight]}>{trainerCount} Trainer{trainerCount === 1 ? '' : 's'}</Text></View>
                  <View style={styles.stepper}>
                    <Pressable accessibilityLabel="Remove Trainer" accessibilityRole="button" disabled={trainerCount <= 1} onPress={() => { setTrainerCount((count) => Math.max(1, count - 1)); setSimulationCount(null); }} style={[styles.stepperButton, light && styles.controlLight, trainerCount <= 1 && styles.disabled]}><Text style={[styles.stepperText, light && styles.textLight]}>−</Text></Pressable>
                    <Pressable accessibilityLabel="Add Trainer" accessibilityRole="button" disabled={trainerCount >= 20} onPress={() => { setTrainerCount((count) => Math.min(20, count + 1)); setSimulationCount(null); }} style={[styles.stepperButton, light && styles.controlLight]}><Text style={[styles.stepperText, light && styles.textLight]}>+</Text></Pressable>
                  </View>
                </View>
                <View accessibilityLabel="Suggested raid team" style={styles.team}>
                  {team.map((member) => <View key={member.id} style={[styles.teamMember, light && styles.controlLight]}><Image resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, member.imageUri) }} style={styles.teamImage} /><Text numberOfLines={1} style={[styles.teamName, light && styles.textLight]}>{member.name}</Text></View>)}
                </View>
                <Pressable accessibilityRole="button" disabled={team.length === 0} onPress={() => setSimulationCount(trainerCount)} style={[styles.simulate, team.length === 0 && styles.disabled]}><Text style={styles.simulateText}>⚡ Simulate lobby</Text></Pressable>
                {simulation ? <View accessibilityRole="summary" style={[styles.result, simulation.clears ? styles.resultClear : styles.resultFailed]}><Text style={styles.resultTitle}>{simulation.clears ? 'Likely clear' : 'Time expired'}</Text><Text style={styles.resultCopy}>{Number.isFinite(simulation.seconds) ? `${simulation.seconds.toFixed(1)} seconds` : 'No clear'} · {simulation.dps.toFixed(1)} group DPS</Text></View> : null}
              </View>
            ) : null}
          </View>

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
  party: { overflow: 'hidden', borderRadius: 11, backgroundColor: '#172223' },
  partyToggle: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  partyIcon: { color: '#55ddd4', fontSize: 18 },
  partyTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  partyContent: { gap: 9, borderTopWidth: 1, borderTopColor: '#2c4243', padding: 9 },
  lobbyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  lobbyTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  stepper: { flexDirection: 'row', gap: 6 },
  stepperButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#465b5c', borderRadius: 20, backgroundColor: '#202b2c' },
  stepperText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  controlLight: { borderColor: '#b9caca', backgroundColor: '#fff' },
  disabled: { opacity: .4 },
  team: { flexDirection: 'row', gap: 4 },
  teamMember: { minWidth: 0, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#3d5253', borderRadius: 8, padding: 3, backgroundColor: '#101819' },
  teamImage: { width: 37, height: 37 },
  teamName: { maxWidth: '100%', color: '#e8f2f2', fontSize: 6.5, fontWeight: '900' },
  simulate: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#2fd6d0' },
  simulateText: { color: '#071214', fontSize: 11, fontWeight: '900' },
  result: { gap: 2, borderWidth: 1, borderRadius: 10, padding: 9 },
  resultClear: { borderColor: '#39c99d', backgroundColor: '#12372e' },
  resultFailed: { borderColor: '#df5770', backgroundColor: '#39151e' },
  resultTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  resultCopy: { color: '#dbe8e8', fontSize: 9 },
  shadowNote: { gap: 3, borderWidth: 1, borderColor: '#9569c7', borderRadius: 10, padding: 10, backgroundColor: '#2a183a' },
  shadowTitle: { color: '#ead6ff', fontSize: 11, fontWeight: '900' },
  shadowCopy: { color: '#ceb6e7', fontSize: 9.5, lineHeight: 13 },
  rules: { color: '#8fa2a3', fontSize: 8.5, lineHeight: 12 },
  textLight: { color: '#142629' },
  mutedLight: { color: '#657879' },
});
