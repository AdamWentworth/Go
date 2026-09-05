import { Redirect, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeRouteActionMenu } from '../../components/NativeRouteActionMenu';
import { runtimeConfig } from '../../config/runtimeConfig';
import { NATIVE_INFORMATION_PAGES } from '../../features/information/nativeInformationContent';
import {
  pvpMethodologyContent,
  raidMethodologyContent,
} from '../../features/tools/nativeMethodologyContent';
import type { NativeTradeBoardModel } from '../../features/tradeBoard/nativeTradeBoardModel';
import { NativeInformationScreen } from '../../screens/NativeInformationScreen';
import { NativeMethodologyScreen } from '../../screens/NativeMethodologyScreen';
import { NativePasswordResetScreen } from '../../screens/NativePasswordResetScreen';
import { NativeRegisterScreen } from '../../screens/NativeRegisterScreen';
import { NativeTradeBoardScreen } from '../../screens/NativeTradeBoardScreen';
import { NativeLoginScreen } from '../../screens/NativeLoginScreen';
import { NativePasswordResetOverlay } from '../../components/NativePasswordResetOverlay';

const ASSET_BASE_URL = runtimeConfig.api.frontendAppUrl;
const noOp = () => undefined;
const boardModel: NativeTradeBoardModel = {
  boardUrl: 'https://pokegonexus.com/trade-board/VisualTrainer',
  generatedAt: '2026-08-25T00:00:00.000Z',
  includeTrade: true,
  includeWanted: true,
  pokemonGoName: 'VisualTrainerGO',
  tradeCount: 1,
  tradeEntries: [{
    id: 'trade-charizard',
    imageUri: `${ASSET_BASE_URL}/images/shiny_gigantamax/shiny_gigantamax_6.png`,
    locationBackgroundUri: null,
    luckyRequested: false,
    maxKind: 'gigantamax',
    mostWanted: false,
    name: 'Shiny Gigantamax Charizard',
    pokedexNumber: 6,
    quantity: 1,
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
  <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,.72)' }]}>
    <Text accessibilityLiveRegion="polite" style={{ width: '100%', maxWidth: 420, borderRadius: 14, padding: 22, color: '#ccfbf1', backgroundColor: '#123b37', fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
      {children}
    </Text>
  </View>
);

const WithGlobalMenu = ({ children, currentPath, signedIn }: {
  children: ReactNode;
  currentPath?: string;
  signedIn?: boolean;
}) => (
  <View style={{ flex: 1 }}>
    {children}
    <NativeRouteActionMenu currentPath={currentPath} signedIn={signedIn} />
  </View>
);

export default function DeviceSmokePublicRoute() {
  const params = useLocalSearchParams<{
    page?: string | string[];
    performance?: string | string[];
  }>();
  const [notice, setNotice] = useState('');
  const [recoveryOpen, setRecoveryOpen] = useState(true);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  const page = Array.isArray(params.page) ? params.page[0] : params.page;
  const performance = Array.isArray(params.performance)
    ? params.performance[0] === '1'
    : params.performance === '1';

  if (page === 'register') {
    return (
      <WithGlobalMenu>
        <NativeRegisterScreen
          initialDraft={performance ? {
            confirmPassword: 'Strong_password_42!',
            email: 'performance@example.invalid',
            password: 'Strong_password_42!',
            username: 'PerfAuth',
          } : undefined}
          onBackToLogin={noOp}
          onOpenPrivacy={noOp}
          onOpenTerms={noOp}
          onOAuthRegister={async () => undefined}
          onOAuthStart={async () => ({ code: 'smoke-code', email: 'visual@example.invalid' })}
          onRegister={async () => undefined}
          onRegistered={() => setNotice('Account created.')}
        />
        {notice ? <LiveNotice>{notice}</LiveNotice> : null}
      </WithGlobalMenu>
    );
  }
  if (page === 'reset') {
    return (
      <WithGlobalMenu>
        <NativeLoginScreen
          notice={notice}
          onOpenPasswordReset={() => setRecoveryOpen(true)}
          onSignIn={async () => undefined}
          onSignedIn={noOp}
          onSocialSignIn={async () => undefined}
        />
        {recoveryOpen ? (
          <NativePasswordResetOverlay
            onClose={() => setRecoveryOpen(false)}
            onRequest={async () => undefined}
            onRequested={() => {
              setRecoveryOpen(false);
              setNotice('If that account exists, reset instructions are on the way.');
            }}
            visible
          />
        ) : null}
      </WithGlobalMenu>
    );
  }
  if (page === 'reset-confirm') {
    return (
      <WithGlobalMenu>
        <NativePasswordResetScreen
          initialPassword={performance ? 'Strong_password_42!' : undefined}
          onBackToLogin={noOp}
          onConfirm={async () => undefined}
          token="smoke-token"
        />
      </WithGlobalMenu>
    );
  }
  if (page === 'trade-board' || page === 'public-trade-board') {
    const publicBoard = page === 'public-trade-board';
    const board = (
      <NativeTradeBoardScreen
        assetBaseUrl={ASSET_BASE_URL}
        editable={!publicBoard}
        model={boardModel}
        onBack={noOp}
        onOpenCreateBoard={publicBoard ? noOp : undefined}
        onOpenHelp={publicBoard ? noOp : undefined}
        onOpenLiveBoard={publicBoard ? undefined : noOp}
        onOpenCollection={noOp}
        onOpenTradeListings={publicBoard ? noOp : undefined}
        onOpenWantedListings={publicBoard ? noOp : undefined}
        onRetry={noOp}
        ownerUsername={publicBoard ? boardModel.username : undefined}
      />
    );
    return publicBoard ? board : (
      <WithGlobalMenu currentPath="/trade-board" signedIn>
        {board}
      </WithGlobalMenu>
    );
  }
  if (page === 'raid-methodology' || page === 'pvp-methodology') {
    return (
      <WithGlobalMenu currentPath={page === 'raid-methodology' ? '/raid/methodology' : '/pvp/methodology'}>
        <NativeMethodologyScreen
          assetBaseUrl={ASSET_BASE_URL}
          content={page === 'raid-methodology' ? raidMethodologyContent : pvpMethodologyContent}
          onBack={noOp}
        />
      </WithGlobalMenu>
    );
  }
  const informationPage = page && Object.prototype.hasOwnProperty.call(NATIVE_INFORMATION_PAGES, page)
    ? NATIVE_INFORMATION_PAGES[page as keyof typeof NATIVE_INFORMATION_PAGES]
    : NATIVE_INFORMATION_PAGES['getting-started'];
  const legal = page === 'privacy' || page === 'terms' || page === 'data-deletion';
  const informationScreen = (
    <NativeInformationScreen assetBaseUrl={ASSET_BASE_URL} onBack={noOp} onNavigate={(path) => setNotice(`Navigate ${path}`)} page={informationPage} />
  );
  return legal ? informationScreen : (
    <WithGlobalMenu currentPath={`/${page ?? 'getting-started'}`}>
      {informationScreen}
    </WithGlobalMenu>
  );
}
