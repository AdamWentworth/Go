import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import {
  clearNativeRaidObservations,
  loadNativeRaidObservations,
  saveNativeRaidObservations,
  serializeNativeRaidObservations,
  summarizeNativeRaidCalibration,
  type NativeRaidObservation,
} from '../../features/tools/nativeRaidCalibration';

type Props = {
  disabled?: boolean;
  onObservedDodgeRateChange?: (rate: number | null) => void;
  predictedCleared: boolean;
  predictedSeconds: number | null;
};

const percent = (value: number) => `${Math.round(value * 100)}%`;
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const NativeRaidCalibrationPanel = ({
  disabled = false,
  onObservedDodgeRateChange,
  predictedCleared,
  predictedSeconds,
}: Props) => {
  const light = useColorScheme() === 'light';
  const [observations, setObservations] = useState<NativeRaidObservation[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [actualCleared, setActualCleared] = useState(predictedCleared);
  const [actualSeconds, setActualSeconds] = useState(predictedSeconds == null ? '' : predictedSeconds.toFixed(1));
  const [exactParty, setExactParty] = useState(true);
  const [dodgeAttempts, setDodgeAttempts] = useState('0');
  const [dodgeSuccesses, setDodgeSuccesses] = useState('0');
  const [useObservedDodges, setUseObservedDodges] = useState(false);
  const [error, setError] = useState('');
  const profile = useMemo(() => summarizeNativeRaidCalibration(observations), [observations]);

  useEffect(() => {
    let active = true;
    void loadNativeRaidObservations().then((rows) => {
      if (!active) return;
      setObservations(rows);
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  const observedDodgesEnabled = profile.canApplyDodgeCalibration && useObservedDodges;

  useEffect(() => {
    onObservedDodgeRateChange?.(
      observedDodgesEnabled ? profile.dodgeSuccessRate : null,
    );
  }, [observedDodgesEnabled, onObservedDodgeRateChange, profile.dodgeSuccessRate]);

  useEffect(
    () => () => onObservedDodgeRateChange?.(null),
    [onObservedDodgeRateChange],
  );

  const openLog = () => {
    setActualCleared(predictedCleared);
    setActualSeconds(predictedSeconds == null ? '' : predictedSeconds.toFixed(1));
    setExactParty(true);
    setDodgeAttempts('0');
    setDodgeSuccesses('0');
    setError('');
    setDialogOpen(true);
  };

  const save = async () => {
    const seconds = actualCleared ? Number(actualSeconds) : null;
    const attempts = Math.max(0, Math.round(Number(dodgeAttempts) || 0));
    const successes = Math.max(0, Math.round(Number(dodgeSuccesses) || 0));
    if (actualCleared && (!Number.isFinite(seconds) || Number(seconds) <= 0)) {
      setError('Enter the actual clear time in seconds.');
      return;
    }
    if (successes > attempts) {
      setError('Successful dodges cannot exceed dodge attempts.');
      return;
    }
    const next = [...observations, {
      actualCleared,
      actualSeconds: seconds,
      createdAt: new Date().toISOString(),
      dodgeAttempts: attempts,
      dodgeSuccesses: successes,
      exactParty,
      id: newId(),
      latencyMs: null,
      predictedCleared,
      predictedSeconds,
    } satisfies NativeRaidObservation].slice(-100);
    await saveNativeRaidObservations(next);
    setObservations(next);
    setDialogOpen(false);
  };

  const clear = async () => {
    await clearNativeRaidObservations();
    setObservations([]);
    setClearOpen(false);
  };

  return (
    <View accessibilityLabel="Observed raid calibration" style={[styles.panel, light && styles.panelLight]}>
      <View style={styles.heading}>
        <Text style={styles.icon}>⌁</Text>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, light && styles.textLight]}>Battle calibration</Text>
          <Text style={[styles.subtitle, light && styles.mutedLight]}>
            {!loaded ? 'Loading device raid log…' : profile.sampleCount === 0 ? 'No raids logged on this device' : `Private to this device${profile.medianLatencyMs == null ? '' : ` · ${Math.round(profile.medianLatencyMs)} ms median`}`}
          </Text>
        </View>
      </View>

      {profile.sampleCount > 0 ? (
        <View accessibilityLabel="Raid calibration metrics" style={styles.metrics}>
          {[
            ['RAIDS', String(profile.sampleCount)],
            ['EXACT PARTIES', String(profile.exactPartySampleCount)],
            ['TTW ERROR', profile.clearSampleCount ? percent(profile.meanAbsoluteTimingErrorPercent) : '—'],
            ['P90 ERROR', profile.clearSampleCount ? `${Math.round(profile.p90AbsoluteTimingErrorSeconds)}s` : '—'],
            ['OUTCOME', percent(profile.predictedOutcomeAccuracy)],
            ['DODGE', profile.dodgeAttempts ? percent(profile.dodgeSuccessRate) : '—'],
          ].map(([label, value]) => (
            <View key={label} style={[styles.metric, light && styles.controlLight]}><Text style={[styles.metricLabel, light && styles.mutedLight]}>{label}</Text><Text style={[styles.metricValue, light && styles.textLight]}>{value}</Text></View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={disabled} onPress={openLog} style={[styles.log, disabled && styles.disabled]}><Text style={styles.logText}>◷  Log raid</Text></Pressable>
        {profile.sampleCount > 0 ? (
          <>
            <View style={[styles.observedToggle, light && styles.controlLight]}>
              <Text style={[styles.observedText, light && styles.textLight]}>Use observed dodges</Text>
              <Switch accessibilityLabel="Use observed dodges" disabled={!profile.canApplyDodgeCalibration} onValueChange={setUseObservedDodges} value={observedDodgesEnabled} />
            </View>
            <Pressable accessibilityLabel="Export observed raid data" accessibilityRole="button" onPress={() => Share.share({ message: serializeNativeRaidObservations(observations), title: 'Pokémon Go Nexus raid observations' })} style={[styles.iconButton, light && styles.controlLight]}><Text style={[styles.iconButtonText, light && styles.textLight]}>⇧</Text></Pressable>
            <Pressable accessibilityLabel="Clear observed raid data" accessibilityRole="button" onPress={() => setClearOpen(true)} style={[styles.iconButton, light && styles.controlLight]}><Text style={styles.clearText}>⌫</Text></Pressable>
          </>
        ) : null}
      </View>

      <Modal animationType="slide" onRequestClose={() => setDialogOpen(false)} transparent visible={dialogOpen}>
        <View style={styles.backdrop}>
          <View style={[styles.dialog, light && styles.dialogLight]}>
            <View style={styles.dialogHeading}><View><Text style={styles.eyebrow}>OBSERVED RAID</Text><Text style={[styles.dialogTitle, light && styles.textLight]}>Log the actual result</Text></View><Pressable accessibilityLabel="Close raid log" accessibilityRole="button" onPress={() => setDialogOpen(false)} style={[styles.close, light && styles.controlLight]}><Text style={[styles.closeText, light && styles.textLight]}>×</Text></Pressable></View>
            <Text style={[styles.dialogLead, light && styles.mutedLight]}>This stays on this device and helps compare predictions with your real raids.</Text>
            <View style={styles.segmented}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: actualCleared }} onPress={() => setActualCleared(true)} style={[styles.segment, actualCleared && styles.segmentActive]}><Text style={[styles.segmentText, actualCleared && styles.segmentTextActive]}>Raid cleared</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: !actualCleared }} onPress={() => setActualCleared(false)} style={[styles.segment, !actualCleared && styles.segmentFailed]}><Text style={styles.segmentText}>Time expired</Text></Pressable>
            </View>
            {actualCleared ? <View style={styles.field}><Text style={[styles.fieldLabel, light && styles.mutedLight]}>ACTUAL CLEAR TIME (SECONDS)</Text><TextInput accessibilityLabel="Actual clear time" keyboardType="decimal-pad" onChangeText={setActualSeconds} placeholder="120.5" placeholderTextColor="#718284" style={[styles.input, light && styles.inputLight]} value={actualSeconds} /></View> : null}
            <View style={[styles.checkRow, light && styles.controlLight]}><View style={styles.headingCopy}><Text style={[styles.checkTitle, light && styles.textLight]}>Exact party</Text><Text style={[styles.checkCopy, light && styles.mutedLight]}>Team and settings matched the prediction.</Text></View><Switch accessibilityLabel="Exact party" onValueChange={setExactParty} value={exactParty} /></View>
            <View style={styles.inputRow}>
              <View style={[styles.field, styles.half]}><Text style={[styles.fieldLabel, light && styles.mutedLight]}>DODGE ATTEMPTS</Text><TextInput accessibilityLabel="Dodge attempts" keyboardType="number-pad" onChangeText={setDodgeAttempts} style={[styles.input, light && styles.inputLight]} value={dodgeAttempts} /></View>
              <View style={[styles.field, styles.half]}><Text style={[styles.fieldLabel, light && styles.mutedLight]}>SUCCESSFUL</Text><TextInput accessibilityLabel="Successful dodges" keyboardType="number-pad" onChangeText={setDodgeSuccesses} style={[styles.input, light && styles.inputLight]} value={dodgeSuccesses} /></View>
            </View>
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => void save()} style={styles.save}><Text style={styles.saveText}>Save raid observation</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal animationType="fade" onRequestClose={() => setClearOpen(false)} transparent visible={clearOpen}>
        <View style={styles.backdrop}><View style={[styles.confirm, light && styles.dialogLight]}><Text style={[styles.dialogTitle, light && styles.textLight]}>Clear raid observations?</Text><Text style={[styles.dialogLead, light && styles.mutedLight]}>This removes the private calibration log stored on this device.</Text><View style={styles.confirmActions}><Pressable accessibilityRole="button" onPress={() => setClearOpen(false)} style={[styles.cancel, light && styles.controlLight]}><Text style={[styles.cancelText, light && styles.textLight]}>Keep log</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void clear()} style={styles.destructive}><Text style={styles.saveText}>Clear log</Text></Pressable></View></View></View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { gap: 10, borderWidth: 1, borderColor: '#355052', borderRadius: 11, padding: 10, backgroundColor: '#172223' },
  panelLight: { borderColor: '#c5d7d7', backgroundColor: '#eef5f4' },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { minWidth: 0, flex: 1 },
  icon: { color: '#50ddd4', fontSize: 22, fontWeight: '900' },
  title: { color: '#fff', fontSize: 12, fontWeight: '900' },
  subtitle: { marginTop: 1, color: '#9fb1b2', fontSize: 9 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  metric: { width: '31.8%', gap: 2, borderWidth: 1, borderColor: '#405354', borderRadius: 8, padding: 7, backgroundColor: '#101819' },
  metricLabel: { color: '#91a4a5', fontSize: 6.5, fontWeight: '900' },
  metricValue: { color: '#fff', fontSize: 11, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  log: { minHeight: 40, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#2fd6d0' },
  logText: { color: '#061314', fontSize: 10, fontWeight: '900' },
  observedToggle: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#435657', borderRadius: 999, paddingLeft: 10, backgroundColor: '#101819' },
  observedText: { color: '#e4eeee', fontSize: 8, fontWeight: '800' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#435657', borderRadius: 20, backgroundColor: '#101819' },
  iconButtonText: { color: '#e6f1f1', fontSize: 18, fontWeight: '900' },
  clearText: { color: '#f07186', fontSize: 18, fontWeight: '900' },
  disabled: { opacity: .4 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, .72)' },
  dialog: { gap: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 32, backgroundColor: '#101819' },
  dialogLight: { backgroundColor: '#fff' },
  dialogHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { color: '#4edcd3', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  dialogTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  dialogLead: { color: '#9fb1b2', fontSize: 10.5, lineHeight: 15 },
  close: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#435657', borderRadius: 21, backgroundColor: '#202a2b' },
  closeText: { color: '#fff', fontSize: 25 },
  segmented: { flexDirection: 'row', gap: 5, borderRadius: 12, padding: 4, backgroundColor: '#202a2b' },
  segment: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  segmentActive: { backgroundColor: '#2bbf8c' },
  segmentFailed: { backgroundColor: '#7e2c3b' },
  segmentText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  segmentTextActive: { color: '#061314' },
  field: { gap: 5 },
  fieldLabel: { color: '#91a4a5', fontSize: 7.5, fontWeight: '900', letterSpacing: .6 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#45595a', borderRadius: 10, paddingHorizontal: 12, color: '#fff', backgroundColor: '#1b2526', fontSize: 13, fontWeight: '800' },
  inputLight: { borderColor: '#b9caca', color: '#142629', backgroundColor: '#f2f7f7' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#405354', borderRadius: 10, padding: 9, backgroundColor: '#172223' },
  checkTitle: { color: '#fff', fontSize: 11, fontWeight: '900' },
  checkCopy: { color: '#9fb1b2', fontSize: 8.5 },
  inputRow: { flexDirection: 'row', gap: 8 },
  half: { flex: 1 },
  error: { color: '#ff9bad', fontSize: 10, fontWeight: '800' },
  save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#2fd6d0' },
  saveText: { color: '#071214', fontSize: 11, fontWeight: '900' },
  confirm: { gap: 10, margin: 14, marginBottom: 24, borderRadius: 16, padding: 15, backgroundColor: '#172223' },
  confirmActions: { flexDirection: 'row', gap: 8 },
  cancel: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#46595a', borderRadius: 999, backgroundColor: '#202a2b' },
  cancelText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  destructive: { minHeight: 44, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 999, backgroundColor: '#df5770' },
  controlLight: { borderColor: '#bfd0d0', backgroundColor: '#fff' },
  textLight: { color: '#142629' },
  mutedLight: { color: '#657879' },
});
