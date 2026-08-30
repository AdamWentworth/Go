import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { runtimeConfig } from '../../config/runtimeConfig';
import type { NativeCollectionRow } from '../../features/collection/collectionModel';
import { NativeHomeScreen } from '../../screens/NativeHomeScreen';
import { NativeGuestHomeScreen } from '../../screens/NativeGuestHomeScreen';
import { NativeActionMenu } from '../../components/NativeActionMenu';
import { NativeActionMenuAnchor } from '../../components/NativeActionMenuAnchor';

const RECENT_ROWS: NativeCollectionRow[] = [
  {
    id: 'charizard',
    pokemonId: 6,
    pokedexNumber: 6,
    name: 'Shiny Gigantamax Charizard',
    imageUri: `${runtimeConfig.api.frontendAppUrl}/images/shiny_gigantamax/shiny_gigantamax_6.png`,
    locationBackgroundUri: null,
    maxKind: 'gigantamax',
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'trade',
    source: 'instance',
    cp: 2500,
    favorite: false,
    mostWanted: false,
  },
  {
    id: 'pikachu',
    pokemonId: 25,
    pokedexNumber: 25,
    name: 'Shiny Detective Pikachu',
    imageUri: `${runtimeConfig.api.frontendAppUrl}/images/shiny/shiny_pokemon_25.png`,
    locationBackgroundUri: null,
    maxKind: null,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'wanted',
    source: 'instance',
    cp: null,
    favorite: false,
    mostWanted: true,
  },
];

export default function DeviceSmokeHomeRoute() {
  const params = useLocalSearchParams<{ guest?: string | string[] }>();
  const [showHint, setShowHint] = useState(true);
  const [lastPath, setLastPath] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  const guest = (Array.isArray(params.guest) ? params.guest[0] : params.guest) === '1';

  if (guest) {
    return (
      <View style={{ flex: 1 }}>
        <NativeGuestHomeScreen
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onDismissActionMenuHint={() => setShowHint(false)}
          onNavigate={setLastPath}
          onOpenActionMenu={() => {
            setShowHint(false);
            setActionMenuOpen(true);
          }}
          showActionMenuHint={showHint}
        />
        <NativeActionMenuAnchor
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onPress={() => setActionMenuOpen(true)}
        />
        {actionMenuOpen ? (
          <NativeActionMenu
            assetBaseUrl={runtimeConfig.api.frontendAppUrl}
            onClose={() => setActionMenuOpen(false)}
            onNavigate={(path) => {
              setActionMenuOpen(false);
              setLastPath(path);
            }}
            signedIn={false}
            visible
          />
        ) : null}
        {lastPath ? (
          <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01 }}>
            Navigate {lastPath}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NativeHomeScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        collection={{ caught: 2255, favorites: 77, forTrade: 208, wanted: 168, mostWanted: 1 }}
        friendsState="ready"
        incomingFriends={1}
        onDismissActionMenuHint={() => setShowHint(false)}
        onOpenActionMenu={() => {
          setShowHint(false);
          setActionMenuOpen(true);
        }}
        onNavigate={setLastPath}
        onRetry={() => undefined}
        pokemonGoName="NexusDemo"
        recentRows={RECENT_ROWS}
        showActionMenuHint={showHint}
        trades={{ needsResponse: 0, readyToConfirm: 1, waiting: 1, completed: 0, active: 1 }}
        username="NexusDemo"
      />
      <NativeActionMenuAnchor
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        onPress={() => setActionMenuOpen(true)}
      />
      {actionMenuOpen ? (
        <NativeActionMenu
          assetBaseUrl={runtimeConfig.api.frontendAppUrl}
          onClose={() => setActionMenuOpen(false)}
          onNavigate={(path) => {
            setActionMenuOpen(false);
            setLastPath(path);
            }}
            pendingFriendCount={1}
            signedIn
            visible
        />
      ) : null}
      {lastPath ? (
        <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', top: 2, left: 2, width: 1, height: 1, opacity: 0.01 }}>
          Navigate {lastPath}
        </Text>
      ) : null}
    </View>
  );
}
