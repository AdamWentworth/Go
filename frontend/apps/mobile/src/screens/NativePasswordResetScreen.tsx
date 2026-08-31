import { useMemo, useState } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { validateNativePassword } from "../features/auth/nativeRegistrationModel";
import { useNativeColorScheme } from '../features/settings/useNativeColorScheme';

type Props = {
  onBackToLogin: () => void;
  onConfirm: (token: string, password: string) => Promise<void>;
  onRequest: (identifier: string) => Promise<void>;
  token?: string | null;
};

const RecoveryGlyph = ({ complete }: { complete: boolean }) => (
  <Svg height={38} viewBox="0 0 32 32" width={38}>
    {complete ? (
      <>
        <Circle cx={16} cy={16} fill="#0b86ee" r={15} />
        <Path d="m9 16.5 4.3 4.2L23 11" fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
      </>
    ) : (
      <Path d="M12.5 4a8.5 8.5 0 1 0 6.9 13.45L23 21v4h4v-4h3v-4h-8.3l-3.65-3.65A8.5 8.5 0 0 0 12.5 4Zm0 5.25a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Z" fill="#0b86ee" />
    )}
  </Svg>
);

const PasswordRuleGlyph = ({ color }: { color: string }) => (
  <Svg height={15} viewBox="0 0 16 16" width={15}>
    <Path d="M4.4 7V5.3a3.6 3.6 0 0 1 7.2 0V7h.7c.8 0 1.4.6 1.4 1.4v5.2c0 .8-.6 1.4-1.4 1.4H3.7c-.8 0-1.4-.6-1.4-1.4V8.4C2.3 7.6 3 7 3.7 7h.7Zm1.5 0h4.2V5.3a2.1 2.1 0 1 0-4.2 0V7Z" fill={color} />
  </Svg>
);

const NativePasswordResetForm = ({
  onBackToLogin,
  onConfirm,
  onRequest,
  token = null,
}: Props) => {
  const light = useNativeColorScheme() === "light";
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirming = Boolean(token);
  const passwordError = useMemo(
    () => validateNativePassword(password),
    [password],
  );

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
        setError("Passwords do not match.");
        return;
      }
    } else if (!identifier.trim()) {
      setError("Enter your username or email.");
      return;
    }
    setSubmitting(true);
    try {
      if (confirming && token) await onConfirm(token, password);
      else await onRequest(identifier.trim());
      setComplete(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Password recovery could not be completed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, light && styles.rootLight]}
      testID="native-password-reset-screen"
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, light && styles.cardLight]}>
          <Text style={[styles.brand, light && styles.brandLight]}>POKÉMON GO NEXUS</Text>
          <View style={styles.icon}>
            <RecoveryGlyph complete={complete} />
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.title, light && styles.textLight]}
          >
            {complete
              ? confirming
                ? "Password updated"
                : "Check your email"
              : confirming
                ? "Choose a new password"
                : "Reset your password"}
          </Text>
          <Text style={[styles.intro, light && styles.mutedLight]}>
            {complete
              ? confirming
                ? "Your other sessions have been signed out. You can now sign in with your new password."
                : "If that account exists, a secure single-use reset link is on the way."
              : confirming
                ? "Use a strong password you do not use on another site."
                : "Enter the username or email attached to your account. The reset link expires after 30 minutes."}
          </Text>
          {!complete && !confirming ? (
            <View style={styles.field}>
              <Text style={[styles.label, light && styles.textLight]}>
                Username or email
              </Text>
              <TextInput
                accessibilityLabel="Username or email"
                autoCapitalize="none"
                autoComplete="username"
                onChangeText={setIdentifier}
                placeholder="you@example.com"
                placeholderTextColor="#718087"
                style={[styles.input, light && styles.inputLight]}
                value={identifier}
              />
            </View>
          ) : null}
          {!complete && confirming ? (
            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={[styles.label, light && styles.textLight]}>
                  New password
                </Text>
                <TextInput
                  accessibilityLabel="New password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  onChangeText={setPassword}
                  secureTextEntry
                  style={[styles.input, light && styles.inputLight]}
                  value={password}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.label, light && styles.textLight]}>
                  Confirm new password
                </Text>
                <TextInput
                  accessibilityLabel="Confirm new password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  onChangeText={setConfirmation}
                  secureTextEntry
                  style={[styles.input, light && styles.inputLight]}
                  value={confirmation}
                />
              </View>
              <View style={styles.rulesRow}>
                <PasswordRuleGlyph color={light ? '#5e7077' : '#a7b6bd'} />
                <Text style={[styles.rules, light && styles.mutedLight]}>
                  8+ characters with uppercase, lowercase, a number, and a symbol.
                </Text>
              </View>
            </View>
          ) : null}
          {error ? (
            <Text
              accessibilityRole="alert"
              style={[styles.error, light && styles.errorLight]}
            >
              {error}
            </Text>
          ) : null}
          {!complete ? (
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => void submit()}
              style={styles.primaryButton}
            >
              <Svg height="100%" style={StyleSheet.absoluteFill} width="100%">
                <Defs>
                  <LinearGradient id="password-reset-action" x1="0" x2="1" y1="0" y2="1">
                    <Stop offset="0" stopColor="#6741d9" />
                    <Stop offset="1" stopColor="#315ec9" />
                  </LinearGradient>
                </Defs>
                <Rect fill="url(#password-reset-action)" height="100%" width="100%" />
              </Svg>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>
                  {confirming ? "Update password" : "Email reset link"}
                </Text>
              )}
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={onBackToLogin}
            style={styles.secondaryButton}
          >
            <Text style={[styles.secondaryText, light && styles.secondaryTextLight]}>
              Return to login
            </Text>
          </Pressable>
          {!complete && !confirming ? (
            <Text style={[styles.privacy, light && styles.mutedLight]}>
              For your privacy, we show the same confirmation whether or not an
              account matches.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const NativePasswordResetScreen = (props: Props) => (
  <NativePasswordResetForm key={props.token ?? "request"} {...props} />
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f0f0f" },
  rootLight: { backgroundColor: "#f8fff9" },
  content: { flexGrow: 1 },
  card: {
    width: "100%",
    minHeight: '100%',
    alignSelf: "center",
    alignItems: "stretch",
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 92,
    backgroundColor: "#222",
  },
  cardLight: { backgroundColor: "#e5f5ec" },
  brand: { color: '#58abff', fontSize: 13, fontWeight: '900', letterSpacing: 1.1 },
  brandLight: { color: '#005bb5' },
  icon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginTop: 24,
  },
  title: {
    marginTop: 24,
    color: "#fff",
    fontSize: 29,
    fontWeight: "900",
  },
  intro: {
    marginTop: 19,
    marginBottom: 28,
    color: "#b3bec5",
    fontSize: 16,
    lineHeight: 26,
  },
  fields: { gap: 18 },
  field: { gap: 8 },
  label: { color: "#f7fafb", fontSize: 16, fontWeight: "900" },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#59666d",
    borderRadius: 11,
    paddingHorizontal: 14,
    color: "#f7fafb",
    backgroundColor: "#14191c",
    fontSize: 16,
  },
  inputLight: {
    borderColor: "#aebdc4",
    color: "#152126",
    backgroundColor: "#fff",
  },
  rulesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rules: { flex: 1, color: "#a7b6bd", fontSize: 14.4, lineHeight: 22 },
  error: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ef6077",
    borderRadius: 10,
    padding: 11,
    color: "#ffd5dc",
    backgroundColor: "#451923",
    fontWeight: "700",
  },
  errorLight: { color: "#8f2638", backgroundColor: "#fff0f3" },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    overflow: "hidden",
    borderRadius: 11,
    backgroundColor: "#005bb5",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "900" },
  secondaryButton: {
    minHeight: 46,
    alignItems: "flex-start",
    justifyContent: "center",
    alignSelf: 'flex-start',
    marginTop: 9,
  },
  secondaryText: { color: "#58abff", fontWeight: "900", textDecorationLine: 'underline' },
  secondaryTextLight: { color: '#005bb5' },
  privacy: {
    marginTop: 12,
    color: "#9caab0",
    fontSize: 10.5,
    lineHeight: 15,
    textAlign: "center",
  },
  textLight: { color: "#142126" },
  mutedLight: { color: "#5e7077" },
});
