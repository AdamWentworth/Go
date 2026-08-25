import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { runtimeConfig } from '../../config/runtimeConfig';
import type { NativeCollectionRow } from '../../features/collection/collectionModel';
import { NativeHomeScreen } from '../../screens/NativeHomeScreen';

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
  const [showHint, setShowHint] = useState(true);
  const [lastPath, setLastPath] = useState('');
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1 }}>
      <NativeHomeScreen
        assetBaseUrl={runtimeConfig.api.frontendAppUrl}
        collection={{ caught: 2255, favorites: 168, forTrade: 208, wanted: 93, mostWanted: 12 }}
        friendsState="ready"
        incomingFriends={1}
        onDismissActionMenuHint={() => setShowHint(false)}
        onNavigate={setLastPath}
        onRetry={() => undefined}
        pokemonGoName="VisualTrainerGO"
        recentRows={RECENT_ROWS}
        showActionMenuHint={showHint}
        trades={{ needsResponse: 2, readyToConfirm: 1, waiting: 3, completed: 18, active: 6 }}
        username="VisualTrainer"
      />
      {lastPath ? (
        <Text accessibilityLiveRegion="polite" style={{ position: 'absolute', top: 2, left: 2, width: 1, height: 1, opacity: 0.01 }}>
          Navigate {lastPath}
        </Text>
      ) : null}
    </View>
  );
}
