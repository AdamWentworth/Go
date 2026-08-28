import { TRAINER_TITLE_OPTIONS, type TrainerTitle } from '@pokemongonexus/shared-contracts/users';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeTrainerProfileDraft } from './nativeTrainerProfileEditorModel';
import { NativeLocationAutocompleteInput } from '../../components/NativeLocationAutocompleteInput';
import { useNativeColorScheme } from '../settings/useNativeColorScheme';

type Props = {
  draft: NativeTrainerProfileDraft;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (draft: NativeTrainerProfileDraft) => void;
  onSave: () => void;
};

const TEAMS = ['', 'Mystic', 'Valor', 'Instinct'] as const;

export const NativeTrainerProfileEditorPanel = ({
  draft,
  isSaving,
  onCancel,
  onChange,
  onSave,
}: Props) => {
  const light = useNativeColorScheme() === 'light';
  const setField = <K extends keyof NativeTrainerProfileDraft>(
    field: K,
    value: NativeTrainerProfileDraft[K],
  ) => onChange({ ...draft, [field]: value });
  const toggleTitle = (title: TrainerTitle) => {
    if (draft.trainerTitles.includes(title)) {
      setField('trainerTitles', draft.trainerTitles.filter((entry) => entry !== title));
      return;
    }
    if (draft.trainerTitles.length >= 3) return;
    setField('trainerTitles', [...draft.trainerTitles, title]);
  };

  const inputStyle = [styles.input, light && styles.inputLight];
  const inputTextColor = light ? '#172124' : '#f7fbfa';
  const placeholderColor = light ? '#718083' : '#7f9495';

  return (
    <View style={[styles.panel, light && styles.panelLight]} testID="native-profile-editor">
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>EDIT TRAINER CARD</Text>
          <Text style={[styles.title, light && styles.textLight]}>Your trainer details</Text>
          <Text style={[styles.copy, light && styles.mutedLight]}>
            Keep the identity and play styles other trainers use to recognize you up to date.
          </Text>
        </View>
        <Text style={[styles.selectionCount, light && styles.selectionCountLight]}>
          {draft.trainerTitles.length}/3 styles
        </Text>
      </View>

      <View style={styles.fieldGrid}>
        <View style={styles.fieldWide}>
          <Text style={[styles.label, light && styles.labelLight]}>POKÉMON GO NAME</Text>
          <TextInput
            accessibilityLabel="Pokémon GO name"
            autoCapitalize="none"
            maxLength={64}
            onChangeText={(value) => setField('pokemonGoName', value)}
            placeholder="Your in-game name"
            placeholderTextColor={placeholderColor}
            selectionColor="#35a8ff"
            style={[...inputStyle, { color: inputTextColor }]}
            value={draft.pokemonGoName}
          />
        </View>
        <View style={styles.fieldWide}>
          <Text style={[styles.label, light && styles.labelLight]}>TRAINER CODE</Text>
          <TextInput
            accessibilityLabel="Trainer code"
            keyboardType="number-pad"
            maxLength={14}
            onChangeText={(value) => setField('trainerCode', value)}
            placeholder="0000 0000 0000"
            placeholderTextColor={placeholderColor}
            selectionColor="#35a8ff"
            style={[...inputStyle, { color: inputTextColor }]}
            value={draft.trainerCode}
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, light && styles.labelLight]}>LEVEL</Text>
          <TextInput
            accessibilityLabel="Trainer level"
            keyboardType="number-pad"
            maxLength={2}
            onChangeText={(value) => setField('trainerLevel', value)}
            placeholder="1–80"
            placeholderTextColor={placeholderColor}
            selectionColor="#35a8ff"
            style={[...inputStyle, { color: inputTextColor }]}
            value={draft.trainerLevel}
          />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={[styles.label, light && styles.labelLight]}>TOTAL XP</Text>
          <TextInput
            accessibilityLabel="Total XP"
            keyboardType="number-pad"
            onChangeText={(value) => setField('totalXp', value)}
            placeholder="Total experience"
            placeholderTextColor={placeholderColor}
            selectionColor="#35a8ff"
            style={[...inputStyle, { color: inputTextColor }]}
            value={draft.totalXp}
          />
        </View>
        <View style={styles.fieldWide}>
          <Text style={[styles.label, light && styles.labelLight]}>STARTED PLAYING</Text>
          <TextInput
            accessibilityLabel="Started playing"
            autoCapitalize="none"
            maxLength={10}
            onChangeText={(value) => setField('startedOn', value)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={placeholderColor}
            selectionColor="#35a8ff"
            style={[...inputStyle, { color: inputTextColor }]}
            value={draft.startedOn}
          />
        </View>
        <View style={styles.fieldWide}>
          <Text style={[styles.label, light && styles.labelLight]}>LOCATION</Text>
          <NativeLocationAutocompleteInput
            accessibilityLabel="Location"
            compact
            light={light}
            maxLength={255}
            onChangeText={(value) => setField('location', value)}
            placeholder="City or region"
            value={draft.location}
          />
        </View>
      </View>

      <View style={styles.choiceSection}>
        <Text style={[styles.label, light && styles.labelLight]}>TEAM</Text>
        <View style={styles.teamChoices}>
          {TEAMS.map((team) => {
            const selected = draft.team === team;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={team || 'unaffiliated'}
                onPress={() => setField('team', team)}
                style={[
                  styles.choice,
                  light && styles.choiceLight,
                  selected && styles.choiceSelected,
                ]}
              >
                <Text style={[
                  styles.choiceText,
                  light && styles.textLight,
                  selected && styles.choiceTextSelected,
                ]}>
                  {team || 'Unaffiliated'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.choiceSection}>
        <Text style={[styles.label, light && styles.labelLight]}>PLAY STYLES · CHOOSE UP TO THREE</Text>
        <View style={styles.titleChoices}>
          {TRAINER_TITLE_OPTIONS.map((option) => {
            const selected = draft.trainerTitles.includes(option.id);
            const disabled = !selected && draft.trainerTitles.length >= 3;
            return (
              <Pressable
                aria-checked={selected}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected, disabled }}
                disabled={disabled}
                key={option.id}
                onPress={() => toggleTitle(option.id)}
                style={[
                  styles.titleChoice,
                  light && styles.choiceLight,
                  selected && styles.choiceSelected,
                  disabled && styles.choiceDisabled,
                ]}
              >
                <Text style={[styles.titleChoiceLabel, light && styles.textLight, selected && styles.choiceTextSelected]}>
                  {option.label}
                </Text>
                <Text numberOfLines={1} style={[styles.titleChoiceCopy, light && styles.mutedLight]}>
                  {option.description}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onCancel}
          style={[styles.cancelButton, light && styles.cancelButtonLight]}
        >
          <Text style={[styles.cancelButtonText, light && styles.textLight]}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onSave}
          style={[styles.saveButton, isSaving && styles.choiceDisabled]}
        >
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save profile'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { gap: 16, padding: 14, borderWidth: 1, borderColor: '#315052', borderRadius: 10, backgroundColor: '#11191a' },
  panelLight: { borderColor: '#bdc8ca', backgroundColor: '#f6f9f9' },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: '#35a8ff', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#f7fbfa', fontSize: 20, lineHeight: 25, fontWeight: '900' },
  copy: { color: '#9db5b4', fontSize: 12, lineHeight: 17 },
  selectionCount: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 13, backgroundColor: '#203032', color: '#b9c9c8', fontSize: 10, fontWeight: '900' },
  selectionCountLight: { backgroundColor: '#dfe8e9', color: '#445456' },
  fieldGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fieldWide: { width: '100%', gap: 5 },
  fieldHalf: { flexGrow: 1, flexBasis: 130, gap: 5 },
  label: { color: '#8fb0ae', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  labelLight: { color: '#4f6667' },
  input: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#456265', borderRadius: 8, backgroundColor: '#171f20', fontSize: 14, fontWeight: '700' },
  inputLight: { borderColor: '#aababc', backgroundColor: '#ffffff' },
  choiceSection: { gap: 8 },
  teamChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choice: { minHeight: 42, flexGrow: 1, flexBasis: 112, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#456265', borderRadius: 8, backgroundColor: '#171f20' },
  choiceLight: { borderColor: '#aababc', backgroundColor: '#ffffff' },
  choiceSelected: { borderColor: '#35a8ff', backgroundColor: '#153b5c' },
  choiceDisabled: { opacity: 0.45 },
  choiceText: { color: '#f7fbfa', fontSize: 12, fontWeight: '900' },
  choiceTextSelected: { color: '#dff3ff' },
  titleChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  titleChoice: { flexGrow: 1, flexBasis: 145, minHeight: 58, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#456265', borderRadius: 8, backgroundColor: '#171f20' },
  titleChoiceLabel: { color: '#f7fbfa', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  titleChoiceCopy: { color: '#9db5b4', fontSize: 9, lineHeight: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  cancelButton: { minHeight: 48, flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#536467', borderRadius: 8, backgroundColor: '#171c1d' },
  cancelButtonLight: { borderColor: '#acbabc', backgroundColor: '#ffffff' },
  cancelButtonText: { color: '#f7fbfa', fontSize: 13, fontWeight: '900' },
  saveButton: { minHeight: 48, flex: 1.35, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#2f9cff' },
  saveButtonText: { color: '#061617', fontSize: 13, fontWeight: '900' },
  textLight: { color: '#172124' },
  mutedLight: { color: '#5e6c6f' },
});
