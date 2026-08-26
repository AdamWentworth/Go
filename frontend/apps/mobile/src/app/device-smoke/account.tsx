import type { AccountSecuritySummary, OAuthProvider } from '@pokemongonexus/shared-contracts/auth';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  createNativeAccountSecurityDraft,
  nativeOAuthProviderLabel,
  type NativeAccountSecurityDraft,
} from '../../features/settings/nativeAccountSecurityModel';
import { NativeAccountSecurityScreen } from '../../screens/NativeAccountSecurityScreen';

const INITIAL_SECURITY: AccountSecuritySummary = {
  activeSessions: 3,
  email: 'trainer@example.com',
  hasPassword: true,
  providers: [{
    email: 'trainer@gmail.com',
    emailVerified: true,
    linkedAt: '2026-08-24T12:00:00.000Z',
    provider: 'google',
  }],
};

const OAUTH_ONLY_SECURITY: AccountSecuritySummary = {
  activeSessions: 2,
  email: 'trainer@example.com',
  hasPassword: false,
  providers: (['google', 'discord', 'facebook'] as OAuthProvider[]).map((provider) => ({
    email: `${provider}@example.com`,
    emailVerified: true,
    linkedAt: '2026-08-24T12:00:00.000Z',
    provider,
  })),
};

export default function DeviceSmokeAccountRoute() {
  const params = useLocalSearchParams<{ oauthOnly?: string | string[] }>();
  const oauthOnly = (Array.isArray(params.oauthOnly) ? params.oauthOnly[0] : params.oauthOnly) === '1';
  const [draft, setDraft] = useState<NativeAccountSecurityDraft>(() => createNativeAccountSecurityDraft({
    email: INITIAL_SECURITY.email,
    username: 'TrainerOne',
  }));
  const [security, setSecurity] = useState(() => oauthOnly ? OAUTH_ONLY_SECURITY : INITIAL_SECURITY);
  const [feedback, setFeedback] = useState<{ tone: 'success'; text: string } | null>(null);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  const connectProvider = (provider: OAuthProvider) => {
    setSecurity((current) => ({
      ...current,
      providers: [...current.providers, {
        email: `${provider}@example.com`,
        emailVerified: true,
        linkedAt: new Date().toISOString(),
        provider,
      }],
    }));
    setFeedback({ tone: 'success', text: `${nativeOAuthProviderLabel(provider)} connected.` });
  };

  return (
    <NativeAccountSecurityScreen
      draft={draft}
      feedback={feedback}
      onBack={() => undefined}
      onChange={setDraft}
      onChangePassword={() => setFeedback({ tone: 'success', text: 'Password change validated.' })}
      onConnectProvider={connectProvider}
      onDeleteAccount={() => setFeedback({ tone: 'success', text: 'Account deletion confirmed.' })}
      onDismissFeedback={() => setFeedback(null)}
      onOpenSettings={() => undefined}
      onRequestEmailChange={() => setFeedback({ tone: 'success', text: 'Verification email sent.' })}
      onRetry={() => undefined}
      onRevokeAllSessions={() => {
        setSecurity((current) => ({ ...current, activeSessions: 0 }));
        setFeedback({ tone: 'success', text: 'All sessions revoked.' });
      }}
      onSaveUsername={() => setFeedback({ tone: 'success', text: 'Username saved.' })}
      onSignOut={() => setFeedback({ tone: 'success', text: 'This device signed out.' })}
      onUnlinkProvider={(provider) => {
        setSecurity((current) => ({
          ...current,
          providers: current.providers.filter((identity) => identity.provider !== provider),
        }));
        setFeedback({ tone: 'success', text: `${nativeOAuthProviderLabel(provider)} disconnected.` });
      }}
      security={security}
    />
  );
}
