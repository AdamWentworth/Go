import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import type {
  NativeRaidAttackerLevel,
  NativeRaidFriendship,
  NativeRaidMegaAlly,
  NativeRaidPartyPower,
  NativeRaidSettings,
} from '../../features/tools/nativeBattleModels';
import { NATIVE_BATTLE_TYPES } from '../../features/tools/nativeBattleModels';

type Props = {
  onChange: (settings: NativeRaidSettings) => void;
  settings: NativeRaidSettings;
};

type Choice<T extends string | number> = { label: string; value: T };

const ChoiceRow = <T extends string | number>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: Choice<T>[];
  value: T;
}) => {
  const light = useColorScheme() === 'light';
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, light && styles.mutedLight]}>{label}</Text>
      <View accessibilityLabel={label} style={styles.choices}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={[styles.choice, light && styles.choiceLight, selected && styles.choiceActive]}
            >
              <Text style={[styles.choiceText, light && styles.textLight, selected && styles.choiceTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export const NativeRaidSettingsPanel = ({ onChange, settings }: Props) => {
  const light = useColorScheme() === 'light';
  const update = <K extends keyof NativeRaidSettings>(key: K, value: NativeRaidSettings[K]) => (
    onChange({ ...settings, [key]: value })
  );
  return (
    <View accessibilityLabel="Ranking settings" style={[styles.panel, light && styles.panelLight]}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>BATTLE SETTINGS</Text>
        <Text style={[styles.title, light && styles.textLight]}>Ranking conditions</Text>
      </View>
      <ChoiceRow<NativeRaidAttackerLevel>
        label="Attacker level"
        onChange={(value) => update('attackerLevel', value)}
        options={['40.0', '50.0', '51.0'].map((value) => ({ label: `Lv ${value.replace('.0', '')}`, value: value as NativeRaidAttackerLevel }))}
        value={settings.attackerLevel}
      />
      <ChoiceRow<NativeRaidFriendship>
        label="Friendship"
        onChange={(value) => update('friendship', value)}
        options={[
          { label: 'None', value: 'none' }, { label: 'Good', value: 'good' },
          { label: 'Great', value: 'great' }, { label: 'Ultra', value: 'ultra' },
          { label: 'Best', value: 'best' },
        ]}
        value={settings.friendship}
      />
      <ChoiceRow<NativeRaidMegaAlly>
        label="Mega ally"
        onChange={(value) => update('megaAllyBonus', value)}
        options={[
          { label: 'None', value: 'none' }, { label: 'Any Mega', value: 'general' },
          { label: 'Same type', value: 'matching' },
        ]}
        value={settings.megaAllyBonus}
      />
      <ChoiceRow<NativeRaidPartyPower>
        label="Party Power"
        onChange={(value) => update('partyPower', value)}
        options={[
          { label: 'Off', value: 'none' }, { label: '2', value: 'party2' },
          { label: '3', value: 'party3' }, { label: '4', value: 'party4' },
        ]}
        value={settings.partyPower}
      />
      <ChoiceRow<number>
        label="Relobby delay"
        onChange={(value) => update('relobbySeconds', value)}
        options={[0, 5, 10, 15, 20].map((value) => ({ label: value === 0 ? 'None' : `${value}s`, value }))}
        value={settings.relobbySeconds}
      />
      <ChoiceRow<string>
        label="Weather boost"
        onChange={(value) => update('weatherBoostedType', value)}
        options={[
          { label: 'None', value: '' },
          ...NATIVE_BATTLE_TYPES.map((value) => ({ label: value.charAt(0).toUpperCase() + value.slice(1), value })),
        ]}
        value={settings.weatherBoostedType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { gap: 13, borderWidth: 1, borderColor: '#355052', borderRadius: 13, padding: 12, backgroundColor: '#101819' },
  panelLight: { borderColor: '#b9cdcd', backgroundColor: '#fff' },
  heading: { gap: 2 },
  eyebrow: { color: '#2fd6d0', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#fff', fontSize: 17, fontWeight: '900' },
  field: { gap: 6 },
  fieldLabel: { color: '#a7b8b9', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  choice: { minHeight: 36, justifyContent: 'center', borderWidth: 1, borderColor: '#465658', borderRadius: 999, paddingHorizontal: 11, backgroundColor: '#20292a' },
  choiceLight: { borderColor: '#b8c8c8', backgroundColor: '#eef4f4' },
  choiceActive: { borderColor: '#2fd6d0', backgroundColor: '#45dbc4' },
  choiceText: { color: '#dce8e8', fontSize: 10, fontWeight: '900' },
  choiceTextActive: { color: '#071214' },
  textLight: { color: '#142629' },
  mutedLight: { color: '#657879' },
});
