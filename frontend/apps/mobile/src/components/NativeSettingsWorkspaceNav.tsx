import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

type Props = {
  active: 'settings' | 'account';
  onOpenAccount: () => void;
  onOpenSettings: () => void;
};

export const NativeSettingsWorkspaceNav = ({
  active,
  onOpenAccount,
  onOpenSettings,
}: Props) => {
  const light = useColorScheme() === 'light';
  return (
    <View
      accessibilityLabel="Settings pages"
      accessibilityRole="tablist"
      style={[styles.nav, light && styles.navLight]}
    >
      {([
        ['settings', 'Settings', onOpenSettings],
        ['account', 'Account', onOpenAccount],
      ] as const).map(([workspace, label, onPress]) => {
        const selected = workspace === active;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            disabled={selected}
            key={workspace}
            onPress={onPress}
            style={({ pressed }) => [
              styles.button,
              selected && styles.buttonActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[
              styles.label,
              light && styles.labelLight,
              selected && styles.labelActive,
            ]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', padding: 3, borderWidth: 1, borderColor: '#35494d', borderRadius: 9, backgroundColor: '#0e1517' },
  navLight: { borderColor: '#9eafb2', backgroundColor: '#ffffff' },
  button: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  buttonActive: { backgroundColor: '#34cfc4' },
  label: { color: '#9daaac', fontSize: 13, fontWeight: '800' },
  labelLight: { color: '#536164' },
  labelActive: { color: '#061617', fontWeight: '900' },
  pressed: { opacity: 0.66 },
});
