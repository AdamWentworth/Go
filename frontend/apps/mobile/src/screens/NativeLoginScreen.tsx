import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ApiClientError } from '@pokemongonexus/shared-api-client';
import { theme } from '../ui/theme';

type NativeLoginScreenProps = {
  onSignIn: (username: string, password: string) => Promise<void>;
  onUseCurrentApp: () => void;
  onSignedIn: () => void;
};

const errorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 401) {
    return 'That username, email, or password was not recognized.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Sign in could not be completed. Please try again.';
};

export const NativeLoginScreen = ({
  onSignIn,
  onUseCurrentApp,
  onSignedIn,
}: NativeLoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = username.trim().length >= 3 && password.length >= 6;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await onSignIn(username, password);
      onSignedIn();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>NATIVE PREVIEW</Text>
          <Text accessibilityRole="header" style={styles.title}>Welcome back</Text>
          <Text style={styles.description}>
            Sign in with your Pokémon Go Nexus username or email. Social sign-in
            remains available in the current app during migration.
          </Text>

          <Text style={styles.label}>Username or email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="username"
            editable={!isSubmitting}
            onChangeText={setUsername}
            placeholder="Trainer name or email"
            placeholderTextColor="#64748b"
            returnKeyType="next"
            style={styles.input}
            value={username}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="current-password"
            editable={!isSubmitting}
            onChangeText={setPassword}
            onSubmitEditing={() => void submit()}
            placeholder="Password"
            placeholderTextColor="#64748b"
            returnKeyType="go"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {error ? (
            <Text accessibilityLiveRegion="polite" role="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSubmit || isSubmitting}
            onPress={() => void submit()}
            style={[styles.primaryButton, (!canSubmit || isSubmitting) && styles.disabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign in</Text>
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onUseCurrentApp}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Use social sign-in or current app</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#06162f' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    backgroundColor: '#111827',
  },
  eyebrow: {
    color: '#5ed8ff',
    fontSize: theme.type.caption,
    fontWeight: '800',
    letterSpacing: 1.4,
    textAlign: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginBottom: theme.spacing.md,
    color: '#cbd5e1',
    fontSize: theme.type.body,
    lineHeight: 21,
    textAlign: 'center',
  },
  label: { color: '#f8fafc', fontSize: theme.type.body, fontWeight: '700' },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#94a3b8',
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    color: '#0f172a',
    backgroundColor: '#fff',
    fontSize: theme.type.subtitle,
  },
  error: {
    borderWidth: 1,
    borderColor: '#fb7185',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    color: '#fecdd3',
    backgroundColor: '#4c0519',
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.selectedBorder,
  },
  primaryButtonText: { color: '#fff', fontSize: theme.type.subtitle, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: theme.radius.md,
  },
  secondaryButtonText: { color: '#e2e8f0', fontSize: theme.type.body, fontWeight: '700' },
});
