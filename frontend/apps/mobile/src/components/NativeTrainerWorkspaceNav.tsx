import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

type NativeTrainerWorkspace = 'profile' | 'friends';

type Props = {
  active: NativeTrainerWorkspace;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
};

export const NativeTrainerWorkspaceNav = ({
  active,
  onOpenFriends,
  onOpenProfile,
}: Props) => {
  const light = useColorScheme() === 'light';
  return (
    <View
      accessibilityLabel="Profile pages"
      accessibilityRole="tablist"
      style={[styles.nav, light && styles.navLight]}
      testID="native-trainer-workspace-nav"
    >
      {([
        ['profile', 'Profile', onOpenProfile],
        ['friends', 'Friends', onOpenFriends],
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
  nav: {
    alignSelf: 'center',
    flexDirection: 'row',
    padding: 3,
    borderWidth: 1,
    borderColor: '#35494d',
    borderRadius: 10,
    backgroundColor: '#0e1517',
  },
  navLight: { borderColor: '#9eafb2', backgroundColor: '#ffffff' },
  button: {
    minWidth: 92,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  buttonActive: { backgroundColor: '#1b6d62' },
  label: { color: '#9daaac', fontSize: 13, fontWeight: '800' },
  labelLight: { color: '#536164' },
  labelActive: { color: '#ffffff', fontWeight: '900' },
  pressed: { opacity: 0.66 },
});
