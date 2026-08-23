import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../ui/theme';

type NativeMigrationPreviewProps = {
  onOpenNativeExperience?: () => void;
  onOpenWebExperience: () => void;
};

export const NativeMigrationPreview = ({
  onOpenNativeExperience,
  onOpenWebExperience,
}: NativeMigrationPreviewProps) => (
  <View testID="native-migration-preview" style={styles.container}>
    <Text style={styles.eyebrow}>NATIVE PREVIEW</Text>
    <Text style={styles.title}>Pokémon Go Nexus</Text>
    <Text style={styles.body}>
      Native workflows are being introduced incrementally. The complete web
      experience remains available while each workflow is validated.
    </Text>
    <View style={styles.actions}>
      {onOpenNativeExperience ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpenNativeExperience}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Try native sign in</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onOpenWebExperience}
        style={[styles.button, styles.secondaryButton]}
      >
        <Text style={styles.buttonText}>Open current app</Text>
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: '#1e293b',
  },
  buttonText: {
    color: '#fff',
    fontSize: theme.type.body,
    fontWeight: '700',
    textAlign: 'center',
  },
});
