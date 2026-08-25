import { Redirect } from 'expo-router';
import { useState } from 'react';
import { runtimeConfig } from '../../config/runtimeConfig';
import type { NativeTrainerPreferencesDraft } from '../../features/social/nativeTrainerPreferencesModel';
import { NativeTrainerSettingsScreen } from '../../screens/NativeTrainerSettingsScreen';

const INITIAL_DRAFT: NativeTrainerPreferencesDraft = {
  collectionVisibility: 'friends',
  coordinationHandle: 'MistyTrades',
  coordinationMethod: 'discord',
  friendRequestPermission: 'everyone',
  profileVisibility: 'public',
  shareTradeContact: true,
  showLocation: false,
  showPokemonGoName: true,
  trainerCodeVisibility: 'friends',
};

export default function DeviceSmokeSettingsRoute() {
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [colorTheme, setColorTheme] = useState<'dark' | 'light'>('dark');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success'; text: string } | null>(null);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  return (
    <NativeTrainerSettingsScreen
      colorTheme={colorTheme}
      draft={draft}
      feedback={feedback}
      onBack={() => undefined}
      onChange={setDraft}
      onChangeColorTheme={setColorTheme}
      onChangeReduceMotion={setReduceMotion}
      onDismissFeedback={() => setFeedback(null)}
      onOpenAccount={() => undefined}
      onRetry={() => undefined}
      onRetrySync={() => setFeedback({ tone: 'success', text: 'Collection synchronization checked.' })}
      onSaveCoordination={() => setFeedback({ tone: 'success', text: 'Trade coordination settings saved.' })}
      onSavePrivacy={() => setFeedback({ tone: 'success', text: 'Privacy settings saved.' })}
      reduceMotion={reduceMotion}
      syncSummary={{ canRetry: true, detail: 'No collection changes are waiting on this device.', title: 'Up to date' }}
    />
  );
}
