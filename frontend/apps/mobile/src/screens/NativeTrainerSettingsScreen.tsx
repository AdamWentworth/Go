import type {
  FriendRequestPermission,
  ProfileVisibility,
  TradeCoordinationMethod,
  TrainerCodeVisibility,
} from '@pokemongonexus/shared-contracts/users';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NativeOptionPicker,
  type NativeOptionPickerEntry,
} from '../components/NativeOptionPicker';
import { NativeSettingsWorkspaceNav } from '../components/NativeSettingsWorkspaceNav';
import {
  changeNativeCoordinationMethod,
  type NativeTrainerPreferencesDraft,
} from '../features/social/nativeTrainerPreferencesModel';

type PickerKey =
  | 'profileVisibility'
  | 'collectionVisibility'
  | 'friendRequestPermission'
  | 'trainerCodeVisibility'
  | 'coordinationMethod';

type Props = {
  draft: NativeTrainerPreferencesDraft | null;
  error?: string | null;
  feedback?: { tone: 'success' | 'error'; text: string } | null;
  isLoading?: boolean;
  isSaving?: boolean;
  onBack: () => void;
  onChange: (draft: NativeTrainerPreferencesDraft) => void;
  onDismissFeedback?: () => void;
  onOpenAccount: () => void;
  onRetry: () => void;
  onSaveCoordination: () => void;
  onSavePrivacy: () => void;
};

const VISIBILITY_OPTIONS: NativeOptionPickerEntry[] = [
  { key: 'public', label: 'Everyone' },
  { key: 'friends', label: 'Friends only' },
  { key: 'private', label: 'Only me' },
];
const FRIEND_OPTIONS: NativeOptionPickerEntry[] = [
  { key: 'everyone', label: 'Allow requests' },
  { key: 'nobody', label: 'Do not allow requests' },
];
const COORDINATION_OPTIONS: NativeOptionPickerEntry[] = [
  { key: 'campfire', label: 'Campfire', description: 'Recommended for Niantic Friends and direct messages.' },
  { key: 'discord', label: 'Discord' },
  { key: 'other', label: 'Another community or app' },
  { key: 'none', label: 'Do not share coordination details' },
];

const labelFor = (options: NativeOptionPickerEntry[], value: string): string => (
  options.find((option) => option.key === value)?.label ?? value
);

type SelectionFieldProps = {
  description?: string;
  label: string;
  onPress: () => void;
  value: string;
  light: boolean;
};

const SelectionField = ({ description, label, light, onPress, value }: SelectionFieldProps) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, light && styles.labelLight]}>{label}</Text>
    <Pressable
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.select, light && styles.selectLight]}
    >
      <Text style={[styles.selectText, light && styles.textLight]}>{value}</Text>
      <Text style={[styles.chevron, light && styles.labelLight]}>⌄</Text>
    </Pressable>
    {description ? <Text style={[styles.help, light && styles.mutedLight]}>{description}</Text> : null}
  </View>
);

type ToggleFieldProps = {
  description?: string;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
  disabled?: boolean;
  light: boolean;
};

const ToggleField = ({ description, disabled, label, light, onChange, value }: ToggleFieldProps) => (
  <View style={[styles.toggleRow, light && styles.toggleRowLight, disabled && styles.disabled]}>
    <View style={styles.toggleCopy}>
      <Text style={[styles.toggleLabel, light && styles.textLight]}>{label}</Text>
      {description ? <Text style={[styles.help, light && styles.mutedLight]}>{description}</Text> : null}
    </View>
    <Switch
      accessibilityLabel={label}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ false: light ? '#b6c0c2' : '#46595b', true: '#2cbba8' }}
      thumbColor={value ? '#efffff' : '#e7eaeb'}
      value={value}
    />
  </View>
);

export const NativeTrainerSettingsScreen = ({
  draft,
  error = null,
  feedback = null,
  isLoading = false,
  isSaving = false,
  onBack,
  onChange,
  onDismissFeedback,
  onOpenAccount,
  onRetry,
  onSaveCoordination,
  onSavePrivacy,
}: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const [picker, setPicker] = useState<PickerKey | null>(null);

  const update = <K extends keyof NativeTrainerPreferencesDraft>(
    key: K,
    value: NativeTrainerPreferencesDraft[K],
  ) => {
    if (!draft) return;
    onChange({ ...draft, [key]: value });
  };

  const pickerConfig = draft && picker ? ({
    profileVisibility: {
      title: 'Profile visibility', options: VISIBILITY_OPTIONS, selected: draft.profileVisibility,
      select: (key: string) => update('profileVisibility', key as ProfileVisibility),
    },
    collectionVisibility: {
      title: 'Pokémon visibility', options: VISIBILITY_OPTIONS, selected: draft.collectionVisibility,
      select: (key: string) => update('collectionVisibility', key as ProfileVisibility),
    },
    friendRequestPermission: {
      title: 'Friend requests', options: FRIEND_OPTIONS, selected: draft.friendRequestPermission,
      select: (key: string) => update('friendRequestPermission', key as FriendRequestPermission),
    },
    trainerCodeVisibility: {
      title: 'Trainer code visibility', options: VISIBILITY_OPTIONS, selected: draft.trainerCodeVisibility,
      select: (key: string) => update('trainerCodeVisibility', key as TrainerCodeVisibility),
    },
    coordinationMethod: {
      title: 'Preferred coordination method', options: COORDINATION_OPTIONS, selected: draft.coordinationMethod,
      select: (key: string) => onChange(changeNativeCoordinationMethod(draft, key as TradeCoordinationMethod)),
    },
  } as const)[picker] : null;

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-trainer-settings-screen">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}>
            <Text style={[styles.backText, light && styles.textLight]}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>TRAINER CONTROLS</Text>
            <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Settings</Text>
          </View>
        </View>

        <NativeSettingsWorkspaceNav active="settings" onOpenAccount={onOpenAccount} onOpenSettings={() => {}} />

        {feedback ? (
          <View accessibilityRole="alert" style={[styles.feedback, feedback.tone === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
            <Text style={styles.feedbackText}>{feedback.text}</Text>
            {onDismissFeedback ? (
              <Pressable accessibilityLabel="Dismiss message" accessibilityRole="button" onPress={onDismissFeedback} style={styles.feedbackDismissButton}>
                <Text style={styles.feedbackDismiss}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.status}><ActivityIndicator color="#35a8ff" /><Text style={[styles.statusText, light && styles.mutedLight]}>Loading settings…</Text></View>
        ) : null}
        {error ? (
          <View accessibilityRole="alert" style={[styles.feedback, styles.feedbackError]}>
            <Text style={styles.feedbackText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
          </View>
        ) : null}

        {draft ? (
          <>
            <View style={[styles.section, light && styles.sectionLight]}>
              <View style={styles.sectionHeader}>
                <View><Text style={styles.sectionEyebrow}>WHO CAN SEE YOU</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Privacy</Text></View>
                <Text style={styles.sectionIcon}>◈</Text>
              </View>
              <SelectionField label="Profile visibility" light={light} onPress={() => setPicker('profileVisibility')} value={labelFor(VISIBILITY_OPTIONS, draft.profileVisibility)} description="Controls your trainer card and profile statistics." />
              <SelectionField label="Pokémon visibility" light={light} onPress={() => setPicker('collectionVisibility')} value={labelFor(VISIBILITY_OPTIONS, draft.collectionVisibility)} description="Controls access to your public Pokémon catalog." />
              <SelectionField label="Friend requests" light={light} onPress={() => setPicker('friendRequestPermission')} value={labelFor(FRIEND_OPTIONS, draft.friendRequestPermission)} />
              <SelectionField label="Trainer code visibility" light={light} onPress={() => setPicker('trainerCodeVisibility')} value={labelFor(VISIBILITY_OPTIONS, draft.trainerCodeVisibility)} description="Accepted-trade sharing is configured separately below." />
              <ToggleField label="Show Pokémon GO name" light={light} onChange={(value) => update('showPokemonGoName', value)} value={draft.showPokemonGoName} />
              <ToggleField label="Show profile location" light={light} onChange={(value) => update('showLocation', value)} value={draft.showLocation} />
              <Pressable accessibilityRole="button" disabled={isSaving} onPress={onSavePrivacy} style={[styles.save, isSaving && styles.disabled]}>
                <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save privacy'}</Text>
              </Pressable>
            </View>

            <View style={[styles.note, light && styles.noteLight]}><Text style={styles.noteIcon}>⌾</Text><Text style={[styles.noteText, light && styles.textLight]}>Private account data is never shown on public profiles.</Text></View>

            <View style={[styles.section, light && styles.sectionLight]}>
              <View style={styles.sectionHeader}>
                <View><Text style={styles.sectionEyebrow}>AFTER AN OFFER IS ACCEPTED</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Trade coordination</Text></View>
                <Text style={styles.sectionIcon}>◌</Text>
              </View>
              <Text style={[styles.sectionCopy, light && styles.mutedLight]}>Pokémon GO Nexus does not provide messaging. Choose how an accepted trade partner can connect with you.</Text>
              <SelectionField label="Preferred coordination method" light={light} onPress={() => setPicker('coordinationMethod')} value={labelFor(COORDINATION_OPTIONS, draft.coordinationMethod)} description="Campfire is recommended for Niantic Friends and direct messages." />
              {draft.coordinationMethod !== 'none' ? (
                <View style={styles.field}>
                  <Text style={[styles.fieldLabel, light && styles.labelLight]}>{draft.coordinationMethod === 'campfire' ? 'Campfire username or Niantic ID (optional)' : draft.coordinationMethod === 'discord' ? 'Discord username' : 'Community or app handle'}</Text>
                  <TextInput
                    accessibilityLabel="Coordination handle"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={80}
                    onChangeText={(value) => update('coordinationHandle', value)}
                    placeholder="Platform username—not an email or phone number"
                    placeholderTextColor={light ? '#69777a' : '#829397'}
                    style={[styles.input, light && styles.inputLight, light && styles.textLight]}
                    value={draft.coordinationHandle}
                  />
                </View>
              ) : null}
              <ToggleField disabled={draft.coordinationMethod === 'none'} label="Share with accepted trade partners" light={light} onChange={(value) => update('shareTradeContact', value)} value={draft.shareTradeContact} />
              <View style={[styles.coordinationNote, light && styles.coordinationNoteLight]}><Text style={[styles.noteText, light && styles.textLight]}>These details are never added to search results. They become available only while a trade is accepted and active.</Text></View>
              <Pressable accessibilityRole="button" disabled={isSaving} onPress={onSaveCoordination} style={[styles.save, isSaving && styles.disabled]}>
                <Text style={styles.saveText}>{isSaving ? 'Saving…' : 'Save coordination'}</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>

      <NativeOptionPicker
        onClose={() => setPicker(null)}
        onSelect={(entry) => { pickerConfig?.select(entry.key); setPicker(null); }}
        options={pickerConfig?.options ?? []}
        selectedKey={pickerConfig?.selected ?? null}
        title={pickerConfig?.title ?? 'Setting'}
        visible={Boolean(pickerConfig)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#081012' },
  rootLight: { backgroundColor: '#eef4f5' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 12, paddingHorizontal: 12 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#456265', borderRadius: 10, backgroundColor: '#171f20' },
  backLight: { borderColor: '#aababc', backgroundColor: '#ffffff' },
  backText: { color: '#ffffff', fontSize: 35, lineHeight: 35 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#35a8ff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f7fbfa', fontSize: 25, fontWeight: '900' },
  feedback: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderWidth: 1, borderRadius: 10 },
  feedbackSuccess: { borderColor: '#2fbd79', backgroundColor: '#13372b' },
  feedbackError: { borderColor: '#ef5b72', backgroundColor: '#3a1820' },
  feedbackText: { flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '800' },
  feedbackDismissButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  feedbackDismiss: { color: '#ffffff', fontSize: 24 },
  retry: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 },
  retryText: { color: '#ffffff', fontWeight: '900' },
  status: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusText: { color: '#9db5b4', fontWeight: '800' },
  section: { gap: 12, padding: 14, borderWidth: 1, borderColor: '#315052', borderRadius: 10, backgroundColor: '#171c1d' },
  sectionLight: { borderColor: '#b1c0c2', backgroundColor: '#ffffff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: { color: '#92c7cc', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: '#f7fbfa', fontSize: 21, fontWeight: '900' },
  sectionIcon: { color: '#42d7c6', fontSize: 28 },
  sectionCopy: { color: '#9db5b4', fontSize: 13, lineHeight: 18 },
  field: { gap: 5 },
  fieldLabel: { color: '#92c7cc', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  select: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: '#456265', borderRadius: 8, backgroundColor: '#202728' },
  selectLight: { borderColor: '#aababc', backgroundColor: '#f6f9f9' },
  selectText: { color: '#f7fbfa', fontSize: 14, fontWeight: '800' },
  chevron: { color: '#9db5b4', fontSize: 21 },
  help: { color: '#9db5b4', fontSize: 11, lineHeight: 15 },
  toggleRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11, paddingVertical: 8, borderWidth: 1, borderColor: '#315052', borderRadius: 8, backgroundColor: '#202728' },
  toggleRowLight: { borderColor: '#bbc7c9', backgroundColor: '#f6f9f9' },
  toggleCopy: { flex: 1, gap: 2 },
  toggleLabel: { color: '#f7fbfa', fontSize: 13, fontWeight: '900' },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: '#456265', borderRadius: 8, backgroundColor: '#202728', color: '#f7fbfa', fontSize: 14, fontWeight: '700' },
  inputLight: { borderColor: '#aababc', backgroundColor: '#f6f9f9' },
  save: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#42d7c6' },
  saveText: { color: '#061617', fontSize: 14, fontWeight: '900' },
  note: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderWidth: 1, borderColor: '#315052', borderRadius: 9, backgroundColor: '#11191a' },
  noteLight: { borderColor: '#b1c0c2', backgroundColor: '#ffffff' },
  noteIcon: { color: '#42d7c6', fontSize: 23 },
  noteText: { flex: 1, color: '#f7fbfa', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  coordinationNote: { padding: 11, borderLeftWidth: 3, borderLeftColor: '#42d7c6', borderRadius: 6, backgroundColor: '#102526' },
  coordinationNoteLight: { backgroundColor: '#eaf8f6' },
  textLight: { color: '#172124' },
  labelLight: { color: '#49666b' },
  mutedLight: { color: '#5e6c6f' },
  disabled: { opacity: 0.5 },
});
