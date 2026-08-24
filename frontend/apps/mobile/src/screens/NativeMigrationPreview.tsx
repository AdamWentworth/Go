import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../ui/theme';

type NativeMigrationPreviewProps = {
  onOpenWebExperience: () => void;
};

export const NativeMigrationPreview = ({
  onOpenWebExperience,
}: NativeMigrationPreviewProps) => (
  <View testID="native-parity-lab" style={styles.container}>
    <Text style={styles.eyebrow}>DEVELOPMENT PARITY LAB</Text>
    <Text style={styles.title}>No native workflow is ready for review</Text>
    <Text style={styles.body}>
      The current app remains the specification. A native workflow will only
      appear here after it passes its automated parity gates.
    </Text>
    <View style={styles.actions}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenWebExperience}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Open canonical app</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: '#06162f',
  },
  eyebrow: {
    color: '#5ed8ff',
    fontSize: theme.type.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#fff',
    fontSize: theme.type.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    maxWidth: 420,
    color: '#cbd5e1',
    fontSize: theme.type.body,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.selectedBorder,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: theme.spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: theme.type.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
