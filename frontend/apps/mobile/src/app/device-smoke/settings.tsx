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
  const [feedback, setFeedback] = useState<{ tone: 'success'; text: string } | null>(null);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  return (
    <NativeTrainerSettingsScreen
      draft={draft}
      feedback={feedback}
      onBack={() => undefined}
      onChange={setDraft}
      onDismissFeedback={() => setFeedback(null)}
      onOpenAccount={() => undefined}
      onRetry={() => undefined}
      onSaveCoordination={() => setFeedback({ tone: 'success', text: 'Trade coordination settings saved.' })}
      onSavePrivacy={() => setFeedback({ tone: 'success', text: 'Privacy settings saved.' })}
    />
  );
}
