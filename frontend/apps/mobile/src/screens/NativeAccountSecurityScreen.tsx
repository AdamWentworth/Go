import type {
  AccountSecuritySummary,
  OAuthProvider,
} from '@pokemongonexus/shared-contracts/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeConfirmationDialog } from '../components/NativeConfirmationDialog';
import { NativeSocialProviderIcon } from '../components/NativeSocialProviderIcon';
import { NativeSettingsWorkspaceNav } from '../components/NativeSettingsWorkspaceNav';
import {
  nativeOAuthProviderLabel,
  type NativeAccountSecurityDraft,
} from '../features/settings/nativeAccountSecurityModel';

type Confirmation =
  | { kind: 'delete'; title: string; body: string; confirmLabel: string }
  | { kind: 'revoke'; title: string; body: string; confirmLabel: string }
  | { kind: 'unlink'; provider: OAuthProvider; title: string; body: string; confirmLabel: string };

type Props = {
  draft: NativeAccountSecurityDraft;
  error?: string | null;
  feedback?: { tone: 'success' | 'error'; text: string } | null;
  isLoading?: boolean;
  onBack: () => void;
  onChange: (draft: NativeAccountSecurityDraft) => void;
  onChangePassword: () => void;
  onConnectProvider: (provider: OAuthProvider) => void;
  onDeleteAccount: () => void;
  onDismissFeedback?: () => void;
  onOpenSettings: () => void;
  onRequestEmailChange: () => void;
  onRetry: () => void;
  onRevokeAllSessions: () => void;
  onSaveUsername: () => void;
  onSignOut: () => void;
  onUnlinkProvider: (provider: OAuthProvider) => void;
  pendingAction?: string | null;
  security: AccountSecuritySummary | null;
};

type FieldProps = {
  autoCapitalize?: 'none' | 'sentences' | 'words';
  help?: string;
  label: string;
  light: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  value: string;
};

const AccountField = ({
  autoCapitalize = 'none',
  help,
  label,
  light,
  onChangeText,
  placeholder,
  secureTextEntry,
  value,
}: FieldProps) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, light && styles.labelLight]}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={light ? '#69777a' : '#829397'}
      secureTextEntry={secureTextEntry}
      style={[styles.input, light && styles.inputLight, light && styles.textLight]}
      value={value}
    />
    {help ? <Text style={[styles.help, light && styles.mutedLight]}>{help}</Text> : null}
  </View>
);

const providerGlyphStyle = (provider: OAuthProvider) => {
  if (provider === 'google') return styles.providerGoogle;
  if (provider === 'discord') return styles.providerDiscord;
  return styles.providerFacebook;
};

export const NativeAccountSecurityScreen = ({
  draft,
  error = null,
  feedback = null,
  isLoading = false,
  onBack,
  onChange,
  onChangePassword,
  onConnectProvider,
  onDeleteAccount,
  onDismissFeedback,
  onOpenSettings,
  onRequestEmailChange,
  onRetry,
  onRevokeAllSessions,
  onSaveUsername,
  onSignOut,
  onUnlinkProvider,
  pendingAction = null,
  security,
}: Props) => {
  const light = useColorScheme() === 'light';
  const insets = useSafeAreaInsets();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const working = Boolean(pendingAction);
  const update = <K extends keyof NativeAccountSecurityDraft>(
    key: K,
    value: NativeAccountSecurityDraft[K],
  ) => onChange({ ...draft, [key]: value });

  const confirmAction = () => {
    if (!confirmation) return;
    const action = confirmation;
    setConfirmation(null);
    if (action.kind === 'delete') onDeleteAccount();
    if (action.kind === 'revoke') onRevokeAllSessions();
    if (action.kind === 'unlink') onUnlinkProvider(action.provider);
  };

  return (
    <View style={[styles.root, light && styles.rootLight]} testID="native-account-security-screen">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 96 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={onBack} style={[styles.back, light && styles.backLight]}>
            <Text style={[styles.backText, light && styles.textLight]}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>SIGN-IN &amp; SECURITY</Text>
            <Text accessibilityRole="header" style={[styles.title, light && styles.textLight]}>Account</Text>
          </View>
        </View>

        <NativeSettingsWorkspaceNav active="account" onOpenAccount={() => {}} onOpenSettings={onOpenSettings} />

        {isLoading ? (
          <View style={styles.status}><ActivityIndicator color="#35a8ff" /><Text style={[styles.statusText, light && styles.mutedLight]}>Loading account security…</Text></View>
        ) : null}
        {error ? (
          <View accessibilityRole="alert" style={[styles.feedback, styles.feedbackError]}>
            <Text style={styles.feedbackText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>
          </View>
        ) : null}

        <View style={[styles.section, light && styles.sectionLight]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionEyebrow}>LOGIN IDENTITY</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Account details</Text></View>
            <Text style={styles.sectionIcon}>⌁</Text>
          </View>
          <AccountField label="Username" light={light} onChangeText={(value) => update('username', value)} value={draft.username} />
          <Pressable accessibilityRole="button" disabled={working} onPress={onSaveUsername} style={[styles.primary, working && styles.disabled]}>
            <Text style={styles.primaryText}>{pendingAction === 'username' ? 'Saving…' : 'Save username'}</Text>
          </Pressable>
          {security?.hasPassword ? (
            <AccountField
              help="Used only to confirm sensitive changes on this screen."
              label="Current password"
              light={light}
              onChangeText={(value) => update('currentPassword', value)}
              placeholder="Required for security changes"
              secureTextEntry
              value={draft.currentPassword}
            />
          ) : (
            <View style={[styles.info, light && styles.infoLight]}><Text style={[styles.infoText, light && styles.textLight]}>Your recent provider sign-in confirms sensitive actions because this account has no password.</Text></View>
          )}
        </View>

        <View style={[styles.section, light && styles.sectionLight]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionEyebrow}>VERIFIED DESTINATION</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Email</Text></View>
            <Text style={styles.sectionIcon}>@</Text>
          </View>
          <Text style={[styles.sectionCopy, light && styles.mutedLight]}>A new address is not active until you follow the verification link sent there.</Text>
          <AccountField label="Email address" light={light} onChangeText={(value) => update('email', value)} value={draft.email} />
          <Pressable accessibilityRole="button" disabled={working} onPress={onRequestEmailChange} style={[styles.primary, working && styles.disabled]}>
            <Text style={styles.primaryText}>{pendingAction === 'email' ? 'Sending…' : 'Send verification email'}</Text>
          </Pressable>
        </View>

        <View style={[styles.section, light && styles.sectionLight]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionEyebrow}>SECURITY CREDENTIAL</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>{security?.hasPassword ? 'Change password' : 'Add a password'}</Text></View>
            <Text style={styles.sectionIcon}>◇</Text>
          </View>
          <Text style={[styles.sectionCopy, light && styles.mutedLight]}>Changing your password signs out every device, including this one.</Text>
          <AccountField label="New password" light={light} onChangeText={(value) => update('newPassword', value)} placeholder="8+ characters with mixed character types" secureTextEntry value={draft.newPassword} />
          <AccountField label="Confirm new password" light={light} onChangeText={(value) => update('confirmNewPassword', value)} secureTextEntry value={draft.confirmNewPassword} />
          <Pressable accessibilityRole="button" disabled={working} onPress={onChangePassword} style={[styles.primary, working && styles.disabled]}>
            <Text style={styles.primaryText}>{pendingAction === 'password' ? 'Updating…' : security?.hasPassword ? 'Update password' : 'Add password'}</Text>
          </Pressable>
        </View>

        <View style={[styles.section, light && styles.sectionLight]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionEyebrow}>SIGN-IN METHODS</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Connected accounts</Text></View>
            <Text style={styles.sectionIcon}>◎</Text>
          </View>
          <Text style={[styles.sectionCopy, light && styles.mutedLight]}>Verified providers open this same Pokémon Go Nexus account.</Text>
          {(['google', 'discord', 'facebook'] as OAuthProvider[]).map((provider) => {
            const identity = security?.providers.find((candidate) => candidate.provider === provider);
            const label = nativeOAuthProviderLabel(provider);
            return (
              <View key={provider} style={[styles.provider, light && styles.providerLight]}>
                <View style={[styles.providerGlyph, providerGlyphStyle(provider)]}>
                  <NativeSocialProviderIcon provider={provider} size={21} />
                </View>
                <View style={styles.providerCopy}>
                  <Text style={[styles.providerTitle, light && styles.textLight]}>{label}</Text>
                  <Text numberOfLines={2} style={[styles.help, light && styles.mutedLight]}>{identity ? identity.email || 'Verified provider identity' : 'Not connected'}</Text>
                </View>
                <Pressable
                  accessibilityLabel={`${identity ? 'Disconnect' : 'Connect'} ${label}`}
                  accessibilityRole="button"
                  disabled={working}
                  onPress={() => identity
                    ? setConfirmation({
                        kind: 'unlink',
                        provider,
                        title: `Disconnect ${label}?`,
                        body: `You will no longer be able to sign in with ${label}.`,
                        confirmLabel: 'Disconnect',
                      })
                    : onConnectProvider(provider)}
                  style={[styles.compactAction, light && styles.compactActionLight, working && styles.disabled]}
                >
                  <Text style={[styles.compactActionText, light && styles.textLight]}>{pendingAction === `provider-${provider}` ? 'Working…' : identity ? 'Disconnect' : 'Connect'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View style={[styles.section, light && styles.sectionLight]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionEyebrow}>SESSION</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Sign out</Text></View>
            <Text style={styles.sectionIcon}>↪</Text>
          </View>
          <View style={[styles.sessionSummary, light && styles.providerLight]}>
            <Text style={styles.sessionCount}>{security?.activeSessions ?? '—'}</Text>
            <View style={styles.providerCopy}><Text style={[styles.providerTitle, light && styles.textLight]}>active sessions</Text><Text style={[styles.help, light && styles.mutedLight]}>Includes this device while its session is active.</Text></View>
          </View>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" disabled={working} onPress={onSignOut} style={[styles.secondary, light && styles.secondaryLight, working && styles.disabled]}><Text style={[styles.secondaryText, light && styles.textLight]}>Sign out here</Text></Pressable>
            <Pressable accessibilityLabel="Sign out all devices" accessibilityRole="button" disabled={working} onPress={() => setConfirmation({ kind: 'revoke', title: 'Sign out every device?', body: 'Every active session for this account will be revoked, including this device.', confirmLabel: 'Sign out all' })} style={[styles.secondary, light && styles.secondaryLight, working && styles.disabled]}><Text style={[styles.secondaryText, light && styles.textLight]}>Sign out all</Text></Pressable>
          </View>
        </View>

        <View style={[styles.section, styles.dangerSection, light && styles.dangerSectionLight]}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.dangerEyebrow}>PERMANENT ACTION</Text><Text style={[styles.sectionTitle, light && styles.textLight]}>Delete account</Text></View>
            <Text style={styles.dangerIcon}>×</Text>
          </View>
          <Text style={[styles.sectionCopy, light && styles.mutedLight]}>Permanently remove your sign-in account, catalog, profile, trades, friendships, preferences, and active sessions.</Text>
          <Pressable accessibilityLabel="Permanently delete account" accessibilityRole="button" disabled={working} onPress={() => setConfirmation({ kind: 'delete', title: 'Permanently delete your account?', body: 'Your account and all Pokémon Go Nexus data will be removed. This cannot be undone.', confirmLabel: 'Delete account' })} style={[styles.dangerButton, working && styles.disabled]} testID="native-account-delete-button"><Text style={styles.dangerButtonText}>{pendingAction === 'delete' ? 'Deleting…' : 'Delete account'}</Text></Pressable>
        </View>
      </ScrollView>

      {feedback && !confirmation ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.feedback,
            styles.feedbackOverlay,
            { bottom: insets.bottom + 12 },
            feedback.tone === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <Text style={styles.feedbackText}>{feedback.text}</Text>
          {onDismissFeedback ? (
            <Pressable accessibilityLabel="Dismiss message" accessibilityRole="button" onPress={onDismissFeedback} style={styles.feedbackDismissButton}>
              <Text style={styles.feedbackDismiss}>×</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <NativeConfirmationDialog
        body={confirmation?.body ?? ''}
        confirmLabel={confirmation?.confirmLabel ?? 'Confirm'}
        isPending={working}
        onCancel={() => setConfirmation(null)}
        onConfirm={confirmAction}
        title={confirmation?.title ?? 'Confirm action'}
        tone={confirmation?.kind === 'delete' ? 'danger' : 'default'}
        visible={Boolean(confirmation)}
      >
        {confirmation && security?.hasPassword ? (
          <AccountField
            help="Required to confirm this security change."
            label="Current password"
            light={light}
            onChangeText={(value) => update('currentPassword', value)}
            placeholder="Enter your account password"
            secureTextEntry
            value={draft.currentPassword}
          />
        ) : confirmation ? (
          <View style={[styles.info, light && styles.infoLight]}>
            <Text style={[styles.infoText, light && styles.textLight]}>
              Your recent provider sign-in confirms this change. You do not need a separate password.
            </Text>
          </View>
        ) : null}
      </NativeConfirmationDialog>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#081012' },
  rootLight: { backgroundColor: '#eef4f5' },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: 12, paddingHorizontal: 12 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 11 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#456265', borderRadius: 10, backgroundColor: '#171f20' },
  backLight: { borderColor: '#aababc', backgroundColor: '#ffffff' },
  backText: { color: '#ffffff', fontSize: 35, lineHeight: 35 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#35a8ff', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#f7fbfa', fontSize: 25, fontWeight: '900' },
  section: { gap: 12, padding: 14, borderWidth: 1, borderColor: '#315052', borderRadius: 10, backgroundColor: '#171c1d' },
  sectionLight: { borderColor: '#b1c0c2', backgroundColor: '#ffffff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionEyebrow: { color: '#92c7cc', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: '#f7fbfa', fontSize: 21, fontWeight: '900' },
  sectionIcon: { color: '#42d7c6', fontSize: 28 },
  sectionCopy: { color: '#9db5b4', fontSize: 13, lineHeight: 18 },
  field: { gap: 5 },
  fieldLabel: { color: '#92c7cc', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: '#456265', borderRadius: 8, backgroundColor: '#202728', color: '#f7fbfa', fontSize: 14, fontWeight: '700' },
  inputLight: { borderColor: '#aababc', backgroundColor: '#f6f9f9' },
  help: { color: '#9db5b4', fontSize: 11, lineHeight: 15 },
  primary: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#42d7c6' },
  primaryText: { color: '#061617', fontSize: 14, fontWeight: '900' },
  info: { padding: 11, borderLeftWidth: 3, borderLeftColor: '#42d7c6', borderRadius: 6, backgroundColor: '#102526' },
  infoLight: { backgroundColor: '#eaf8f6' },
  infoText: { color: '#f7fbfa', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  provider: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderColor: '#315052', borderRadius: 9, backgroundColor: '#202728' },
  providerLight: { borderColor: '#bbc7c9', backgroundColor: '#f6f9f9' },
  providerGlyph: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  providerGoogle: { backgroundColor: '#ffffff' },
  providerDiscord: { backgroundColor: '#5865f2' },
  providerFacebook: { backgroundColor: '#1877f2' },
  providerCopy: { flex: 1, minWidth: 0 },
  providerTitle: { color: '#f7fbfa', fontSize: 14, fontWeight: '900' },
  compactAction: { minHeight: 44, minWidth: 88, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: '#587174', borderRadius: 8, backgroundColor: '#171f20' },
  compactActionLight: { borderColor: '#9dadaf', backgroundColor: '#ffffff' },
  compactActionText: { color: '#f7fbfa', fontSize: 12, fontWeight: '900' },
  sessionSummary: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1, borderColor: '#315052', borderRadius: 9, backgroundColor: '#202728' },
  sessionCount: { minWidth: 42, color: '#42d7c6', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 9 },
  secondary: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#536467', borderRadius: 8, backgroundColor: '#202728' },
  secondaryLight: { borderColor: '#a5b3b5', backgroundColor: '#f6f9f9' },
  secondaryText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  dangerSection: { borderColor: '#81414b', backgroundColor: '#23171a' },
  dangerSectionLight: { borderColor: '#d7939d', backgroundColor: '#fff7f8' },
  dangerEyebrow: { color: '#ef6a7e', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  dangerIcon: { color: '#ef6a7e', fontSize: 32 },
  dangerButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#cf4057' },
  dangerButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  feedback: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 12, borderWidth: 1, borderRadius: 10 },
  feedbackOverlay: { position: 'absolute', right: 12, left: 12, maxWidth: 736, alignSelf: 'center', zIndex: 4 },
  feedbackSuccess: { borderColor: '#2fbd79', backgroundColor: '#13372b' },
  feedbackError: { borderColor: '#ef5b72', backgroundColor: '#3a1820' },
  feedbackText: { flex: 1, color: '#ffffff', fontSize: 13, fontWeight: '800' },
  feedbackDismissButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  feedbackDismiss: { color: '#ffffff', fontSize: 24 },
  retry: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 12 },
  retryText: { color: '#ffffff', fontWeight: '900' },
  status: { minHeight: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusText: { color: '#9db5b4', fontWeight: '800' },
  textLight: { color: '#172124' },
  labelLight: { color: '#49666b' },
  mutedLight: { color: '#5e6c6f' },
  disabled: { opacity: 0.5 },
});
