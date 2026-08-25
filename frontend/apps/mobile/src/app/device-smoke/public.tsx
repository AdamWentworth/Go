import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NATIVE_INFORMATION_PAGES } from '../../features/information/nativeInformationContent';
import type { NativeTradeBoardModel } from '../../features/tradeBoard/nativeTradeBoardModel';
import { NativeInformationScreen } from '../../screens/NativeInformationScreen';
import { NativePasswordResetScreen } from '../../screens/NativePasswordResetScreen';
import { NativeRegisterScreen } from '../../screens/NativeRegisterScreen';
import { NativeTradeBoardScreen } from '../../screens/NativeTradeBoardScreen';

const ASSET_BASE_URL = runtimeConfig.api.frontendAppUrl;
const noOp = () => undefined;
const boardModel: NativeTradeBoardModel = {
  boardUrl: 'https://pokegonexus.com/trade-board/VisualTrainer',
  generatedAt: '2026-08-25T00:00:00.000Z',
  includeTrade: true,
  includeWanted: true,
  pokemonGoName: 'VisualTrainerGO',
  tradeCount: 2,
  tradeEntries: [{
    id: 'trade-charizard',
    imageUri: `${ASSET_BASE_URL}/images/shiny_gigantamax/shiny_gigantamax_6.png`,
    locationBackgroundUri: null,
    luckyRequested: false,
    maxKind: 'gigantamax',
    mostWanted: false,
    name: 'Shiny Gigantamax Charizard',
    pokedexNumber: 6,
    quantity: 2,
  }],
  username: 'VisualTrainer',
  wantedCount: 1,
  wantedEntries: [{
    id: 'wanted-blastoise',
    imageUri: `${ASSET_BASE_URL}/images/gigantamax/gigantamax_9.png`,
    locationBackgroundUri: null,
    luckyRequested: true,
    maxKind: 'gigantamax',
    mostWanted: true,
    name: 'Gigantamax Blastoise',
    pokedexNumber: 9,
    quantity: 1,
  }],
};

const LiveNotice = ({ children }: { children: string }) => (
  <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01 }}>
    {children}
  </Text>
);

export default function DeviceSmokePublicRoute() {
  const params = useLocalSearchParams<{ page?: string | string[] }>();
  const [notice, setNotice] = useState('');
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  const page = Array.isArray(params.page) ? params.page[0] : params.page;

  if (page === 'register') {
    return (
      <View style={{ flex: 1 }}>
        <NativeRegisterScreen
          onBackToLogin={noOp}
          onOpenPrivacy={noOp}
          onOpenTerms={noOp}
          onOAuthRegister={async () => undefined}
          onOAuthStart={async () => ({ code: 'smoke-code', email: 'visual@example.invalid' })}
          onRegister={async () => undefined}
          onRegistered={() => setNotice('Account created.')}
        />
        {notice ? <LiveNotice>{notice}</LiveNotice> : null}
      </View>
    );
  }
  if (page === 'reset' || page === 'reset-confirm') {
    return (
      <NativePasswordResetScreen
        onBackToLogin={noOp}
        onConfirm={async () => undefined}
        onRequest={async () => undefined}
        token={page === 'reset-confirm' ? 'smoke-token' : undefined}
      />
    );
  }
  if (page === 'trade-board') {
    return (
      <NativeTradeBoardScreen
        assetBaseUrl={ASSET_BASE_URL}
        model={boardModel}
        onActionMenuPress={noOp}
        onBack={noOp}
        onOpenCollection={noOp}
        onRetry={noOp}
      />
    );
  }
  const informationPage = page && Object.prototype.hasOwnProperty.call(NATIVE_INFORMATION_PAGES, page)
    ? NATIVE_INFORMATION_PAGES[page as keyof typeof NATIVE_INFORMATION_PAGES]
    : NATIVE_INFORMATION_PAGES['getting-started'];
  return <NativeInformationScreen assetBaseUrl={ASSET_BASE_URL} onBack={noOp} onNavigate={(path) => setNotice(`Navigate ${path}`)} page={informationPage} />;
}
