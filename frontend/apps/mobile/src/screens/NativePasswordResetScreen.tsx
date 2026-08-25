import { useMemo, useState } from 'react';
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
import { validateNativePassword } from '../features/auth/nativeRegistrationModel';

type Props = {
  onBackToLogin: () => void;
  onConfirm: (token: string, password: string) => Promise<void>;
  onRequest: (identifier: string) => Promise<void>;
  token?: string | null;
};

export const NativePasswordResetScreen = ({
  onBackToLogin,
  onConfirm,
  onRequest,
  token = null,
}: Props) => {
  const light = useColorScheme() === 'light';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirming = Boolean(token);
  const passwordError = useMemo(() => validateNativePassword(password), [password]);

  const submit = async () => {
    if (submitting) return;
    setError(null);
    if (confirming) {
      if (!token) return;
      if (passwordError) {
        setError(passwordError);
        return;
      }
      if (password !== confirmation) {
        setError('Passwords do not match.');
        return;
      }
    } else if (!identifier.trim()) {
      setError('Enter your username or email.');
      return;
    }
    setSubmitting(true);
    try {
      if (confirming && token) await onConfirm(token, password);
      else await onRequest(identifier.trim());
      setComplete(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Password recovery could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, light && styles.rootLight]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, light && styles.cardLight]}>
          <View style={styles.icon}><Text style={styles.iconText}>{complete ? '✓' : '⚿'}</Text></View>
          <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
          <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>
            {complete
              ? confirming ? 'Password updated' : 'Check your email'
              : confirming ? 'Choose a new password' : 'Reset your password'}
          </Text>
          <Text style={[styles.intro, light && styles.mutedLight]}>
            {complete
              ? confirming
                ? 'Your other sessions have been signed out. You can now sign in with your new password.'
                : 'If that account exists, a secure single-use reset link is on the way.'
              : confirming
                ? 'Use a strong password you do not use on another site.'
                : 'Enter the username or email attached to your account. The reset link expires after 30 minutes.'}
          </Text>
          {!complete && !confirming ? (
            <View style={styles.field}>
              <Text style={[styles.label, light && styles.textLight]}>Username or email</Text>
              <TextInput autoCapitalize="none" autoComplete="username" onChangeText={setIdentifier} placeholder="you@example.com" placeholderTextColor="#718087" style={[styles.input, light && styles.inputLight]} value={identifier} />
            </View>
          ) : null}
          {!complete && confirming ? (
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.label, light && styles.textLight]}>New password</Text>
                <TextInput autoCapitalize="none" autoComplete="new-password" onChangeText={setPassword} placeholder="Create a strong password" placeholderTextColor="#718087" secureTextEntry style={[styles.input, light && styles.inputLight]} value={password} />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, light && styles.textLight]}>Confirm new password</Text>
                <TextInput autoCapitalize="none" autoComplete="new-password" onChangeText={setConfirmation} placeholder="Enter it again" placeholderTextColor="#718087" secureTextEntry style={[styles.input, light && styles.inputLight]} value={confirmation} />
              </View>
              <Text style={[styles.rules, light && styles.mutedLight]}>8+ characters with uppercase, lowercase, a number, and a symbol.</Text>
            </View>
          ) : null}
          {error ? <Text accessibilityRole="alert" style={[styles.error, light && styles.errorLight]}>{error}</Text> : null}
          {!complete ? (
            <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={styles.primaryButton}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{confirming ? 'Update password' : 'Email reset link'}</Text>}
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={onBackToLogin} style={[styles.secondaryButton, light && styles.secondaryLight]}>
            <Text style={[styles.secondaryText, light && styles.textLight]}>Return to login</Text>
          </Pressable>
          {!complete && !confirming ? <Text style={[styles.privacy, light && styles.mutedLight]}>For your privacy, we show the same confirmation whether or not an account matches.</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07111e' }, rootLight: { backgroundColor: '#eef5f8' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 500, alignSelf: 'center', alignItems: 'stretch', borderWidth: 1, borderColor: '#4179a1', borderRadius: 20, padding: 22, backgroundColor: '#202428' },
  cardLight: { borderColor: '#9bc2df', backgroundColor: '#fff' },
  icon: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10, borderRadius: 28, backgroundColor: '#0b86ee' }, iconText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  eyebrow: { color: '#2098ff', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' },
  title: { marginTop: 4, color: '#fff', fontSize: 27, fontWeight: '900', textAlign: 'center' },
  intro: { marginTop: 8, marginBottom: 18, color: '#b3bec5', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  fields: { gap: 12 }, field: { gap: 5 }, label: { color: '#f7fafb', fontSize: 13, fontWeight: '900' },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#59666d', borderRadius: 11, paddingHorizontal: 14, color: '#f7fafb', backgroundColor: '#14191c', fontSize: 16 }, inputLight: { borderColor: '#aebdc4', color: '#152126', backgroundColor: '#fff' },
  rules: { color: '#a7b6bd', fontSize: 11, lineHeight: 16 },
  error: { marginTop: 12, borderWidth: 1, borderColor: '#ef6077', borderRadius: 10, padding: 11, color: '#ffd5dc', backgroundColor: '#451923', fontWeight: '700' }, errorLight: { color: '#8f2638', backgroundColor: '#fff0f3' },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderRadius: 11, backgroundColor: '#0b86ee' }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 9, borderWidth: 1, borderColor: '#56636a', borderRadius: 11, backgroundColor: '#252b2f' }, secondaryText: { color: '#fff', fontWeight: '900' },
  privacy: { marginTop: 12, color: '#9caab0', fontSize: 10.5, lineHeight: 15, textAlign: 'center' },
  secondaryLight: { borderColor: '#b5c1c6', backgroundColor: '#f5f8f9' }, textLight: { color: '#142126' }, mutedLight: { color: '#5e7077' },
});
