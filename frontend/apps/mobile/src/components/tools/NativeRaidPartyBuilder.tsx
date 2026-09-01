import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeCombatEntry } from '../../features/tools/nativeBattleModels';
import {
  createNativeRaidParty,
  createNativeRaidPartyTrainer,
  getNativeRaidTeam,
  optimizeNativeRaidParty,
  simulateNativeRaidParty,
  type NativeRaidPartyResult,
  type NativeRaidPartyTrainerDraft,
  type NativeRaidTier,
} from '../../features/tools/nativeRaidPlannerModel';
import { useNativeModalAnimation } from '../../features/settings/useNativeMotion';
import { useNativeColorScheme } from '../../features/settings/useNativeColorScheme';
import { NativeUiIcon } from '../NativeUiIcon';

type Props = {
  assetBaseUrl: string;
  onResultChange: (result: NativeRaidPartyResult | null) => void;
  scores: NativeCombatEntry[];
  tier: NativeRaidTier;
};

type Picker = { slotIndex: number; trainerId: string } | null;
const assetUri = (base: string, value: string | null) => {
  if (!value) return undefined;
  try { return new URL(value, base).toString(); } catch { return undefined; }
};
const seconds = (value: number) => Number.isFinite(value) ? `${value.toFixed(1)}s` : 'No clear';

export const NativeRaidPartyBuilder = ({ assetBaseUrl, onResultChange, scores, tier }: Props) => {
  const light = useNativeColorScheme() === 'light';
  const animationType = useNativeModalAnimation('slide');
  const [open, setOpen] = useState(false);
  const [trainers, setTrainers] = useState<NativeRaidPartyTrainerDraft[]>(() => createNativeRaidParty(scores));
  const [expandedId, setExpandedId] = useState('trainer-1');
  const [picker, setPicker] = useState<Picker>(null);
  const [result, setResult] = useState<NativeRaidPartyResult | null>(null);
  const candidates = useMemo(() => getNativeRaidTeam(scores).length > 0 ? scores.slice(0, 80) : [], [scores]);
  const scoreById = useMemo(() => new Map(scores.map((entry) => [entry.id, entry])), [scores]);
  const selectedTrainer = picker ? trainers.find((trainer) => trainer.id === picker.trainerId) ?? null : null;

  const updateTrainer = (id: string, update: (trainer: NativeRaidPartyTrainerDraft) => NativeRaidPartyTrainerDraft) => {
    setTrainers((current) => current.map((trainer) => trainer.id === id ? update(trainer) : trainer));
    setResult(null);
    onResultChange(null);
  };
  const run = () => {
    const next = simulateNativeRaidParty(trainers, scores, tier);
    setResult(next);
    onResultChange(next);
  };
  const optimize = () => {
    const optimized = optimizeNativeRaidParty(trainers, scores);
    const next = simulateNativeRaidParty(optimized, scores, tier);
    setTrainers(optimized);
    setResult(next);
    onResultChange(next);
  };
  const addTrainer = () => {
    if (trainers.length >= 20) return;
    const nextIndex = Math.max(0, ...trainers.map((trainer) => Number(trainer.id.match(/(\d+)$/)?.[1]) || 0));
    const next = createNativeRaidPartyTrainer(nextIndex, scores);
    setTrainers((current) => [...current, next]);
    setExpandedId(next.id);
    setResult(null);
    onResultChange(null);
  };
  const removeTrainer = (id: string) => {
    if (trainers.length <= 1) return;
    setTrainers((current) => current.filter((trainer) => trainer.id !== id));
    if (expandedId === id) setExpandedId('');
    setResult(null);
    onResultChange(null);
  };
  const selectMember = (entry: NativeCombatEntry | null) => {
    if (!picker) return;
    updateTrainer(picker.trainerId, (trainer) => {
      const memberIds = [...trainer.memberIds];
      if (entry) memberIds[picker.slotIndex] = entry.id;
      else memberIds.splice(picker.slotIndex, 1);
      return { ...trainer, memberIds };
    });
    setPicker(null);
  };

  return (
    <View style={[styles.panel, light && styles.panelLight]}>
      <Pressable accessibilityLabel="Custom raid party" accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((current) => !current)} style={styles.toggle}>
        <NativeUiIcon color={light ? '#08766b' : '#42d5c2'} name="trainers" size={18} />
        <View style={styles.flex}><Text style={[styles.toggleTitle, light && styles.textLight]}>Custom raid party</Text><Text style={[styles.meta, light && styles.mutedLight]}>Independent teams, dodges, relobbies, and contribution</Text></View>
        <Text style={[styles.chevron, light && styles.textLight]}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>

      {open ? (
        <View style={styles.content}>
          <View style={[styles.lobby, light && styles.controlLight]}>
            <View style={styles.lobbySummary}>
              <View><Text style={[styles.lobbyCount, light && styles.textLight]}>{trainers.length} Trainer{trainers.length === 1 ? '' : 's'}</Text><Text style={[styles.meta, light && styles.mutedLight]}>Lobby size</Text></View>
              <View style={styles.outcome}><Text style={[styles.outcomeTitle, result?.clears ? styles.success : result ? styles.failure : light && styles.textLight]}>{result ? result.clears ? 'Likely clear' : 'Time expired' : 'Ready to test'}</Text><Text style={[styles.meta, light && styles.mutedLight]}>{result ? `${seconds(result.seconds)} · ${result.dps.toFixed(1)} DPS` : 'Build and simulate this lobby'}</Text></View>
            </View>
            <View style={styles.lobbyActions}>
              <Pressable accessibilityLabel="Add Trainer" accessibilityRole="button" disabled={trainers.length >= 20} onPress={addTrainer} style={[styles.secondary, light && styles.controlLight]}><Text style={[styles.secondaryText, light && styles.textLight]}>＋ Add</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={scores.length === 0} onPress={run} style={styles.primary}><View style={styles.primaryContent}><NativeUiIcon color="#061816" name="bolt" size={14} /><Text style={styles.primaryText}>Simulate</Text></View></Pressable>
              <Pressable accessibilityRole="button" disabled={scores.length === 0} onPress={optimize} style={styles.optimize}><Text style={styles.primaryText}>✦ Optimize</Text></Pressable>
            </View>
          </View>

          <View style={styles.trainers}>
            {trainers.map((trainer, trainerIndex) => {
              const expanded = expandedId === trainer.id;
              const members = trainer.memberIds.flatMap((id) => scoreById.get(id) ?? []);
              return (
                <View key={trainer.id} style={[styles.trainer, light && styles.controlLight]}>
                  <Pressable accessibilityLabel={`${trainer.label} settings`} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpandedId(expanded ? '' : trainer.id)} style={styles.trainerHeader}>
                    <View style={styles.number}><Text style={styles.numberText}>{trainerIndex + 1}</Text></View>
                    <View style={styles.flex}><Text style={[styles.trainerTitle, light && styles.textLight]}>{trainer.label}</Text><Text style={[styles.meta, light && styles.mutedLight]}>{members.length} Pokémon{members.some((entry) => entry.name.toLocaleLowerCase().includes('mega') || entry.name.toLocaleLowerCase().includes('primal')) ? ' · Mega/Primal' : ''}</Text></View>
                    <Text style={[styles.chevron, light && styles.textLight]}>{expanded ? '⌃' : '⌄'}</Text>
                  </Pressable>
                  {expanded ? (
                    <View style={styles.trainerContent}>
                      <View style={styles.field}><Text style={[styles.label, light && styles.mutedLight]}>TRAINER NAME</Text><TextInput accessibilityLabel={`${trainer.label} name`} onChangeText={(label) => updateTrainer(trainer.id, (current) => ({ ...current, label }))} style={[styles.input, light && styles.inputLight]} value={trainer.label} /></View>
                      <View style={styles.settingsGrid}>
                        <Setting label="Dodging" light={light} options={[['None', 'none'], ['Charged', 'charged']]} value={trainer.dodgeStrategy} onChange={(value) => updateTrainer(trainer.id, (current) => ({ ...current, dodgeStrategy: value as NativeRaidPartyTrainerDraft['dodgeStrategy'] }))} />
                        <Setting disabled={trainer.dodgeStrategy === 'none'} label="Dodge success" light={light} options={[['25%', .25], ['50%', .5], ['75%', .75], ['100%', 1]]} value={trainer.dodgeSuccessRate} onChange={(value) => updateTrainer(trainer.id, (current) => ({ ...current, dodgeSuccessRate: value as NativeRaidPartyTrainerDraft['dodgeSuccessRate'] }))} />
                        <Setting label="Relobby" light={light} options={[["5s", 5], ["10s", 10], ["15s", 15], ["20s", 20]]} value={trainer.relobbySeconds} onChange={(value) => updateTrainer(trainer.id, (current) => ({ ...current, relobbySeconds: value as NativeRaidPartyTrainerDraft['relobbySeconds'] }))} />
                        <Setting label="Action delay" light={light} options={[["None", 0], ["0.5s", .5], ["1.0s", 1]]} value={trainer.actionDelaySeconds} onChange={(value) => updateTrainer(trainer.id, (current) => ({ ...current, actionDelaySeconds: value as NativeRaidPartyTrainerDraft['actionDelaySeconds'] }))} />
                      </View>
                      <View style={styles.teamHeading}><Text style={[styles.trainerTitle, light && styles.textLight]}>Battle team</Text><Pressable accessibilityRole="button" onPress={() => updateTrainer(trainer.id, (current) => ({ ...current, memberIds: getNativeRaidTeam(scores).map((entry) => entry.id) }))}><Text style={styles.autoFill}>↻ Auto fill</Text></Pressable></View>
                      <View accessibilityLabel={`${trainer.label} battle team`} style={styles.team}>
                        {Array.from({ length: 6 }, (_, slotIndex) => {
                          const member = scoreById.get(trainer.memberIds[slotIndex] ?? '');
                          return (
                            <Pressable accessibilityLabel={`${trainer.label} team slot ${slotIndex + 1}`} accessibilityRole="button" key={`${trainer.id}-${slotIndex}`} onPress={() => setPicker({ slotIndex, trainerId: trainer.id })} style={[styles.teamSlot, light && styles.teamSlotLight]}>
                              <Text style={[styles.slotNumber, light && styles.mutedLight]}>{slotIndex + 1}</Text>
                              {member ? <Image fadeDuration={0} resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, member.imageUri) }} style={styles.teamImage} /> : <Text style={[styles.emptySlot, light && styles.mutedLight]}>＋</Text>}
                              <Text numberOfLines={1} style={[styles.teamName, light && styles.textLight]}>{member?.name ?? 'Empty'}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {trainers.length > 1 ? <Pressable accessibilityLabel={`Remove ${trainer.label}`} accessibilityRole="button" onPress={() => removeTrainer(trainer.id)} style={styles.remove}><Text style={styles.removeText}>⌫ Remove Trainer</Text></Pressable> : null}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {result ? (
            <View accessibilityLabel="Raid party result" style={[styles.result, result.clears ? styles.resultClear : styles.resultFailed]}>
              <Text style={styles.resultTitle}>{result.clears ? 'Likely clear' : 'Time expired'} · {seconds(result.seconds)}</Text>
              <Text style={styles.resultMeta}>{result.dps.toFixed(1)} DPS · {result.faints} faints · {result.relobbies} relobbies</Text>
              {result.trainers.map((trainer) => <View key={trainer.id} style={styles.contribution}><View style={styles.contributionCopy}><Text style={styles.contributionName}>{trainer.label}</Text><Text style={styles.contributionMeta}>{trainer.dps.toFixed(1)} DPS · {Math.round(trainer.damageShare * 100)}%</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${Math.max(2, trainer.damageShare * 100)}%` }]} /></View></View>)}
            </View>
          ) : null}
        </View>
      ) : null}

      <Modal animationType={animationType} onRequestClose={() => setPicker(null)} transparent visible={Boolean(picker)}>
        <View style={styles.backdrop}>
          <View style={[styles.picker, light && styles.pickerLight]}>
            <View style={styles.pickerHeader}><View style={styles.flex}><Text style={styles.eyebrow}>TEAM SLOT</Text><Text style={[styles.pickerTitle, light && styles.textLight]}>Choose an attacker</Text></View><Pressable accessibilityLabel="Close attacker picker" accessibilityRole="button" onPress={() => setPicker(null)} style={[styles.close, light && styles.controlLight]}><Text style={[styles.closeText, light && styles.textLight]}>×</Text></Pressable></View>
            <ScrollView contentContainerStyle={styles.candidateList}>
              <Pressable accessibilityRole="button" onPress={() => selectMember(null)} style={[styles.candidate, light && styles.controlLight]}><Text style={[styles.candidateName, light && styles.textLight]}>Empty slot</Text></Pressable>
              {candidates.map((entry) => {
                const selectedElsewhere = selectedTrainer?.memberIds.some((id, index) => id === entry.id && index !== picker?.slotIndex);
                return <Pressable accessibilityRole="button" disabled={selectedElsewhere} key={entry.id} onPress={() => selectMember(entry)} style={[styles.candidate, light && styles.controlLight, selectedElsewhere && styles.disabled]}><Image fadeDuration={0} resizeMode="contain" source={{ uri: assetUri(assetBaseUrl, entry.imageUri) }} style={styles.candidateImage} /><View style={styles.flex}><Text numberOfLines={1} style={[styles.candidateName, light && styles.textLight]}>{entry.name}</Text><Text numberOfLines={1} style={[styles.meta, light && styles.mutedLight]}>{entry.fastMove?.name ?? '—'} · {entry.chargedMove?.name ?? '—'}</Text></View><Text style={styles.score}>{entry.score.toFixed(1)}</Text></Pressable>;
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Setting = ({ disabled = false, label, light, onChange, options, value }: { disabled?: boolean; label: string; light: boolean; onChange: (value: string | number) => void; options: [string, string | number][]; value: string | number }) => (
  <View style={[styles.setting, disabled && styles.disabled]}><Text style={[styles.label, light && styles.mutedLight]}>{label.toLocaleUpperCase()}</Text><View style={styles.settingChoices}>{options.map(([optionLabel, optionValue]) => <Pressable accessibilityRole="button" accessibilityState={{ selected: value === optionValue }} disabled={disabled} key={String(optionValue)} onPress={() => onChange(optionValue)} style={[styles.settingChoice, light && styles.settingChoiceLight, value === optionValue && styles.settingActive]}><Text style={[styles.settingText, light && styles.textLight, value === optionValue && styles.settingTextActive]}>{optionLabel}</Text></Pressable>)}</View></View>
);

const styles = StyleSheet.create({
  panel: { overflow: 'hidden', borderRadius: 11, backgroundColor: '#172223' },
  panelLight: { backgroundColor: '#eef5f4' },
  toggle: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  toggleIcon: { color: '#55ddd4', fontSize: 18 },
  toggleTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  meta: { marginTop: 1, color: '#9db0b1', fontSize: 8.5 },
  chevron: { color: '#eaf5f5', fontSize: 13, fontWeight: '900' },
  flex: { minWidth: 0, flex: 1 },
  content: { gap: 8, borderTopWidth: 1, borderTopColor: '#2c4243', padding: 8 },
  lobby: { gap: 8, borderWidth: 1, borderColor: '#3d5253', borderRadius: 10, padding: 8, backgroundColor: '#101819' },
  lobbySummary: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lobbyCount: { color: '#fff', fontSize: 13, fontWeight: '900' },
  outcome: { minWidth: 0, flex: 1, alignItems: 'flex-end' },
  outcomeTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  success: { color: '#4be0ad' },
  failure: { color: '#ff8197' },
  lobbyActions: { flexDirection: 'row', gap: 5 },
  secondary: { minHeight: 39, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#44595a', borderRadius: 999, backgroundColor: '#202b2c' },
  secondaryText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  primary: { minHeight: 39, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#2fd6d0' },
  primaryContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  optimize: { minHeight: 39, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#8b63cf' },
  primaryText: { color: '#071214', fontSize: 9, fontWeight: '900' },
  trainers: { gap: 6 },
  trainer: { overflow: 'hidden', borderWidth: 1, borderColor: '#3d5253', borderRadius: 10, backgroundColor: '#101819' },
  trainerHeader: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  number: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#836414' },
  numberText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  trainerTitle: { color: '#fff', fontSize: 10.5, fontWeight: '900' },
  trainerContent: { gap: 9, borderTopWidth: 1, borderTopColor: '#2c4243', padding: 8 },
  field: { gap: 4 },
  label: { color: '#92a5a6', fontSize: 7, fontWeight: '900' },
  input: { minHeight: 42, borderWidth: 1, borderColor: '#45595a', borderRadius: 9, paddingHorizontal: 10, color: '#fff', backgroundColor: '#1b2526', fontSize: 11, fontWeight: '800' },
  inputLight: { borderColor: '#bdd0d0', color: '#142629', backgroundColor: '#fff' },
  settingsGrid: { gap: 8 },
  setting: { gap: 4 },
  settingChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  settingChoice: { minHeight: 34, justifyContent: 'center', borderWidth: 1, borderColor: '#435657', borderRadius: 999, paddingHorizontal: 9, backgroundColor: '#202a2b' },
  settingChoiceLight: { borderColor: '#bfd0d0', backgroundColor: '#fff' },
  settingActive: { borderColor: '#2fd6d0', backgroundColor: '#45dbc4' },
  settingText: { color: '#dce8e8', fontSize: 8, fontWeight: '900' },
  settingTextActive: { color: '#071214' },
  teamHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  autoFill: { color: '#55ddd4', fontSize: 9, fontWeight: '900' },
  team: { flexDirection: 'row', gap: 3 },
  teamSlot: { minWidth: 0, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#3d5253', borderRadius: 7, padding: 2, backgroundColor: '#172223' },
  teamSlotLight: { borderColor: '#bfd0d0', backgroundColor: '#f4f8f8' },
  slotNumber: { alignSelf: 'flex-start', color: '#8fa2a3', fontSize: 6, fontWeight: '900' },
  teamImage: { width: 31, height: 31 },
  emptySlot: { height: 31, color: '#819596', fontSize: 20 },
  teamName: { maxWidth: '100%', color: '#e5efef', fontSize: 5.8, fontWeight: '900' },
  remove: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#8a3948', borderRadius: 999, backgroundColor: '#3b1720' },
  removeText: { color: '#ff9bad', fontSize: 9, fontWeight: '900' },
  result: { gap: 7, borderWidth: 1, borderRadius: 10, padding: 9 },
  resultClear: { borderColor: '#39c99d', backgroundColor: '#12372e' },
  resultFailed: { borderColor: '#df5770', backgroundColor: '#39151e' },
  resultTitle: { color: '#fff', fontSize: 12, fontWeight: '900' },
  resultMeta: { color: '#dbe8e8', fontSize: 8.5 },
  contribution: { gap: 3 },
  contributionCopy: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  contributionName: { color: '#fff', fontSize: 8.5, fontWeight: '900' },
  contributionMeta: { color: '#c8d9d9', fontSize: 8 },
  track: { height: 5, overflow: 'hidden', borderRadius: 999, backgroundColor: '#1a2526' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#45dbc4' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.72)' },
  picker: { maxHeight: '84%', gap: 8, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 12, paddingBottom: 28, backgroundColor: '#101819' },
  pickerLight: { backgroundColor: '#fff' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#55ddd4', fontSize: 8, fontWeight: '900', letterSpacing: .8 },
  pickerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#435657', borderRadius: 21, backgroundColor: '#202a2b' },
  closeText: { color: '#fff', fontSize: 25 },
  candidateList: { gap: 5, paddingBottom: 20 },
  candidate: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#3d5253', borderRadius: 10, padding: 6, backgroundColor: '#172223' },
  candidateImage: { width: 45, height: 45 },
  candidateName: { color: '#fff', fontSize: 10.5, fontWeight: '900' },
  score: { color: '#54ddd4', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: .38 },
  controlLight: { borderColor: '#bfd0d0', backgroundColor: '#fff' },
  textLight: { color: '#142629' },
  mutedLight: { color: '#657879' },
});
