import type { OAuthProvider } from '@pokemongonexus/shared-contracts/auth';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { useNativeSession } from '../../auth/NativeSessionContext';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';
import { runtimeConfig } from '../../config/runtimeConfig';
import { resolveNativeActionMenuDestination } from '../../navigation/nativeActionMenuNavigation';
import { NativeAccountSecurityScreen } from '../../screens/NativeAccountSecurityScreen';
import {
  requestNativeEmailChange,
  unlinkNativeAccountProvider,
  updateNativeSecondaryUsername,
} from '../../services/nativeAccountSecurityApi';
import { useNativeApiClients } from '../../services/useNativeApiClients';
import {
  buildNativeEmailChangeRequest,
  buildNativePasswordUpdateRequest,
  buildNativeSensitiveActionProof,
  buildNativeUsernameUpdateRequest,
  createNativeAccountSecurityDraft,
  nativeOAuthProviderLabel,
  type NativeAccountSecurityDraft,
} from './nativeAccountSecurityModel';
import { useNativeAccountSecurityQuery } from './nativeAccountSecurityQueries';
import {
  changeNativePasswordAndClearSession,
  deleteNativeAccountGraph,
  revokeNativeSessionsAndClearSession,
  saveNativeUsernameGraph,
} from './nativeAccountSecurityCommands';

type Feedback = { tone: 'success' | 'error'; text: string };

const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message
    ? error.message
    : 'The account-security request could not be completed.';

export const NativeAccountSecurityRoute = () => {
  const router = useRouter();
  const light = useColorScheme() === 'light';
  const session = useNativeSession();
  const clients = useNativeApiClients();
  const user = session.user;
  const securityQuery = useNativeAccountSecurityQuery(user?.user_id ?? null);
  const [draftOverride, setDraftOverride] = useState<NativeAccountSecurityDraft | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingSecondaryUsername, setPendingSecondaryUsername] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  if (session.status !== 'signed-in' || !user) {
    return <Redirect href="/native/login?returnTo=%2Fnative%2Faccount" />;
  }

  const security = securityQuery.data ?? null;
  const draft = draftOverride ?? createNativeAccountSecurityDraft({
    email: security?.email ?? user.email,
    username: user.username,
  });

  const run = async (action: string, command: () => Promise<void>) => {
    if (pendingAction) return;
    setFeedback(null);
    setPendingAction(action);
    try {
      await command();
    } catch (error) {
      setFeedback({ tone: 'error', text: errorMessage(error) });
    } finally {
      setPendingAction(null);
    }
  };

  const saveUsername = () => run('username', async () => {
    const normalized = draft.username.trim();
    if (pendingSecondaryUsername === normalized) {
      await updateNativeSecondaryUsername(clients.users, user.user_id, normalized);
      setPendingSecondaryUsername(null);
      setFeedback({ tone: 'success', text: 'Username synchronized.' });
      return;
    }
    const request = buildNativeUsernameUpdateRequest({
      currentEmail: user.email,
      currentUsername: user.username,
      username: draft.username,
    });
    if (!request) {
      setFeedback({ tone: 'success', text: 'Username is already up to date.' });
      return;
    }
    let committedUsername: string | null = null;
    try {
      await saveNativeUsernameGraph({
        auth: clients.auth,
        onAuthUpdated: (updated) => {
          committedUsername = updated.username;
          session.replaceSessionUser(updated);
          setDraftOverride((current) => ({
            ...(current ?? draft),
            username: updated.username,
          }));
          setPendingSecondaryUsername(updated.username);
        },
        request,
        userId: user.user_id,
        users: clients.users,
      });
      setPendingSecondaryUsername(null);
      setFeedback({ tone: 'success', text: 'Username saved.' });
    } catch (error) {
      if (!committedUsername) throw error;
      throw new Error(`Your sign-in username changed, but profile synchronization needs another try. ${errorMessage(error)}`);
    }
  });

  const requestEmail = () => run('email', async () => {
    if (!security) throw new Error('Account security is still loading.');
    const request = buildNativeEmailChangeRequest({
      currentEmail: security.email,
      currentPassword: draft.currentPassword,
      email: draft.email,
      hasPassword: security.hasPassword,
    });
    if (!request) {
      setFeedback({ tone: 'success', text: 'Email address is already up to date.' });
      return;
    }
    await requestNativeEmailChange(clients.auth, request);
    setDraftOverride({ ...draft, currentPassword: '' });
    setFeedback({ tone: 'success', text: `Verification sent to ${request.email}.` });
  });

  const changePassword = () => run('password', async () => {
    if (!security) throw new Error('Account security is still loading.');
    const request = buildNativePasswordUpdateRequest({
      confirmNewPassword: draft.confirmNewPassword,
      currentEmail: security.email,
      currentPassword: draft.currentPassword,
      currentUsername: user.username,
      hasPassword: security.hasPassword,
      newPassword: draft.newPassword,
    });
    if (!request) throw new Error('Enter and confirm a new password.');
    await changeNativePasswordAndClearSession({
      auth: clients.auth,
      clearSession: session.clearSession,
      request,
      userId: user.user_id,
    });
    router.replace({
      pathname: '/native/login',
      params: { notice: 'Password updated. Sign in again on this device.' },
    });
  });

  const proof = () => {
    if (!security) throw new Error('Account security is still loading.');
    return buildNativeSensitiveActionProof({
      currentPassword: draft.currentPassword,
      hasPassword: security.hasPassword,
    });
  };

  const unlinkProvider = (provider: OAuthProvider) => run(`provider-${provider}`, async () => {
    await unlinkNativeAccountProvider(clients.auth, provider, proof());
    const result = await securityQuery.refetch();
    if (!result.data) throw new Error('The updated sign-in methods could not be loaded.');
    setDraftOverride({ ...draft, currentPassword: '' });
    setFeedback({ tone: 'success', text: `${nativeOAuthProviderLabel(provider)} disconnected.` });
  });

  const revokeSessions = () => run('sessions', async () => {
    await revokeNativeSessionsAndClearSession({
      auth: clients.auth,
      clearSession: session.clearSession,
      proof: proof(),
    });
    router.replace({
      pathname: '/native/login',
      params: { notice: 'Every device was signed out. Sign in again to continue.' },
    });
  });

  const deleteAccount = () => run('delete', async () => {
    const actionProof = proof();
    await deleteNativeAccountGraph({
      auth: clients.auth,
      clearSession: session.clearSession,
      proof: actionProof,
      userId: user.user_id,
      users: clients.users,
    });
    router.replace({
      pathname: '/native/login',
      params: { notice: 'Your Pokémon Go Nexus account was deleted.' },
    });
  });

  const signOut = () => run('sign-out', async () => {
    await session.signOut();
    router.replace({
      pathname: '/native/login',
      params: { notice: 'Signed out from this device.' },
    });
  });

  const retry = async () => {
    setFeedback(null);
    await securityQuery.refetch();
  };

  const navigateFromActionMenu = (path: string) => {
    setActionMenuOpen(false);
    const destination = resolveNativeActionMenuDestination(path, '/settings/account');
    if (destination.kind === 'current') return;
    if (destination.kind === 'native') {
      router.push(destination.pathname);
      return;
    }
    router.push({ pathname: '/web', params: { path: destination.path } });
  };

  return (
    <View style={[styles.root, light && styles.rootLight]}>
      <NativeAccountSecurityScreen
        draft={draft}
        error={securityQuery.error ? errorMessage(securityQuery.error) : null}
        feedback={feedback}
        isLoading={securityQuery.isPending}
        onBack={() => router.canGoBack() ? router.back() : router.replace('/native/settings')}
        onChange={(next) => { setDraftOverride(next); setFeedback(null); }}
        onChangePassword={() => void changePassword()}
        onConnectProvider={() => router.push({ pathname: '/web', params: { path: '/settings/account' } })}
        onDeleteAccount={() => void deleteAccount()}
        onDismissFeedback={() => setFeedback(null)}
        onOpenSettings={() => router.replace('/native/settings')}
        onRequestEmailChange={() => void requestEmail()}
        onRetry={() => void retry()}
        onRevokeAllSessions={() => void revokeSessions()}
        onSaveUsername={() => void saveUsername()}
        onSignOut={() => void signOut()}
        onUnlinkProvider={(provider) => void unlinkProvider(provider)}
        pendingAction={pendingAction}
        security={security}
      />
      <NativeActionMenuAnchor
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        onPress={() => setActionMenuOpen(true)}
      />
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={navigateFromActionMenu}
          visible
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, backgroundColor: '#081012' },
  rootLight: { backgroundColor: '#eef4f5' },
});
