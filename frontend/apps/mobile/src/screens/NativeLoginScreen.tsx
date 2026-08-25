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
  useColorScheme,
} from 'react-native';
import { ApiClientError } from '@pokemongonexus/shared-api-client';
import { theme } from '../ui/theme';

type NativeLoginScreenProps = {
  notice?: string | null;
  onOpenPasswordReset: () => void;
  onOpenRegister: () => void;
  onSignIn: (username: string, password: string) => Promise<void>;
  onSocialSignIn: (provider: NativeLoginProvider) => void;
  onSignedIn: () => void;
};

export type NativeLoginProvider = 'google' | 'discord' | 'facebook';

const SOCIAL_PROVIDERS: {
  glyph: string;
  label: string;
  provider: NativeLoginProvider;
}[] = [
  { glyph: 'G', label: 'Login with Google', provider: 'google' },
  { glyph: '◉', label: 'Login with Discord', provider: 'discord' },
  { glyph: 'f', label: 'Login with Facebook', provider: 'facebook' },
];

const errorMessage = (error: unknown): string => {
  if (error instanceof ApiClientError && error.status === 401) {
    return 'That username, email, or password was not recognized.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Sign in could not be completed. Please try again.';
};

export const NativeLoginScreen = ({
  notice = null,
  onOpenPasswordReset,
  onOpenRegister,
  onSignIn,
  onSocialSignIn,
  onSignedIn,
}: NativeLoginScreenProps) => {
  const light = useColorScheme() === 'light';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
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
      style={[styles.screen, light && styles.screenLight]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, light && styles.cardLight]}>
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={[styles.notice, light && styles.noticeLight]}>
              {notice}
            </Text>
          ) : null}

          <Text style={[styles.label, light && styles.labelLight]}>Username or email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="username"
            editable={!isSubmitting}
            onChangeText={setUsername}
            placeholder="Username or Email"
            placeholderTextColor="#64748b"
            returnKeyType="next"
            style={styles.input}
            value={username}
          />

          <Text style={[styles.label, light && styles.labelLight]}>Password</Text>
          <View style={styles.passwordField}>
            <TextInput
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!isSubmitting}
              onChangeText={setPassword}
              onSubmitEditing={() => void submit()}
              placeholder="Password"
              placeholderTextColor="#64748b"
              returnKeyType="go"
              secureTextEntry={!passwordVisible}
              style={[styles.input, styles.passwordInput]}
              value={password}
            />
            <Pressable
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              accessibilityState={{ selected: passwordVisible }}
              onPress={() => setPasswordVisible((visible) => !visible)}
              style={({ pressed }) => [styles.passwordToggle, pressed && styles.pressed]}
            >
              <Text style={styles.passwordToggleText}>{passwordVisible ? '◉' : '⊙'}</Text>
            </Pressable>
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" role="alert" style={[styles.error, light && styles.errorLight]}>
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
              <Text style={styles.primaryButtonText}>Login</Text>
            )}
          </Pressable>

          <View style={styles.registerPrompt}>
            <Text style={[styles.registerCopy, light && styles.labelLight]}>New to Pokémon Go Nexus?</Text>
            <Pressable accessibilityRole="button" disabled={isSubmitting} onPress={onOpenRegister}>
              <Text style={[styles.registerLink, light && styles.resetButtonTextLight]}>Create account</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onOpenPasswordReset}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
          >
            <Text style={[styles.resetButtonText, light && styles.resetButtonTextLight]}>Reset Password</Text>
          </Pressable>

          <View style={styles.socialButtons}>
            {SOCIAL_PROVIDERS.map(({ glyph, label, provider }) => (
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                key={provider}
                onPress={() => onSocialSignIn(provider)}
                style={({ pressed }) => [
                  styles.socialButton,
                  provider === 'google' && styles.googleButton,
                  provider === 'discord' && styles.discordButton,
                  provider === 'facebook' && styles.facebookButton,
                  pressed && styles.socialPressed,
                ]}
              >
                <Text style={[
                  styles.socialGlyph,
                  provider === 'google' && styles.googleGlyph,
                ]}>{glyph}</Text>
                <Text style={[
                  styles.socialButtonText,
                  provider === 'google' && styles.googleButtonText,
                ]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0f0f0f' },
  screenLight: { backgroundColor: '#f6fdf9' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 92,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: '#555d61',
    borderRadius: 8,
    padding: 22,
    backgroundColor: '#222222',
  },
  cardLight: { borderColor: '#d7e5df', backgroundColor: '#e5f5ec' },
  label: { marginTop: 9, marginBottom: 2, color: '#ffffff', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  labelLight: { color: '#25443a' },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#c5ccd5',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#0f172a',
    backgroundColor: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordField: { position: 'relative' },
  passwordInput: { paddingRight: 52 },
  passwordToggle: { position: 'absolute', top: 5, right: 5, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  passwordToggleText: { color: '#52606d', fontSize: 18, fontWeight: '900' },
  error: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fb7185',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    color: '#fecdd3',
    backgroundColor: '#4c0519',
    lineHeight: 20,
  },
  errorLight: { color: '#8d1e32', backgroundColor: '#fff0f3' },
  notice: {
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#2dd4bf',
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    color: '#ccfbf1',
    backgroundColor: '#134e4a',
    lineHeight: 20,
  },
  noticeLight: { color: '#075b50', backgroundColor: '#e6fffa' },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
    borderRadius: 12,
    backgroundColor: '#0067c9',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  resetButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    borderRadius: 10,
  },
  resetButtonText: { color: '#58abff', fontSize: 15, fontWeight: '900' },
  resetButtonTextLight: { color: '#005bb5' },
  registerPrompt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 5 },
  registerCopy: { color: '#d9e1e5', fontSize: 13, fontWeight: '700' },
  registerLink: { color: '#58abff', fontSize: 13, fontWeight: '900' },
  socialButtons: { gap: 12, marginTop: 1 },
  socialButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: 'transparent', borderRadius: 12 },
  googleButton: { borderColor: '#d8dce1', backgroundColor: '#ffffff' },
  discordButton: { backgroundColor: '#5865f2' },
  facebookButton: { backgroundColor: '#1877f2' },
  socialGlyph: { minWidth: 24, color: '#ffffff', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  googleGlyph: { color: '#4285f4', fontSize: 21 },
  socialButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  googleButtonText: { color: '#202124' },
  socialPressed: { opacity: 0.88, transform: [{ scale: 0.995 }] },
  pressed: { opacity: 0.72 },
});
