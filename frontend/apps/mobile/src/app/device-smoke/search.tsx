import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import { Redirect } from 'expo-router';
import { Animated, StyleSheet, View } from 'react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeHorizontalPageSlider,
  type NativeHorizontalPageSliderHandle,
} from '../../components/NativeHorizontalPageSlider';
import { NativeRouteActionMenu } from '../../components/NativeRouteActionMenu';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  createNativePokemonSearchDraft,
  type NativePokemonSearchDraft,
} from '../../features/search/nativePokemonSearchDraft';
import type { NativePokemonSearchResult } from '../../features/search/pokemonSearchModel';
import {
  NativeSearchHubHeader,
  type NativeSearchHubView,
} from '../../features/search/NativeSearchHubHeader';
import { NativePokemonSearchScreen } from '../../screens/NativePokemonSearchScreen';
import { NativeTrainerSearchScreen } from '../../screens/NativeTrainerSearchScreen';
import { useNativeColorScheme } from '../../features/settings/useNativeColorScheme';

const ASSET_BASE_URL = 'https://pokegonexus.com';
const VIEWS: NativeSearchHubView[] = ['pokemon', 'trainers'];

const pokemon = (
  id: number,
  name: string,
  image: string,
  shinyImage: string,
  patch: Record<string, unknown> = {},
): BasePokemon => ({
  pokemon_id: id,
  pokedex_number: id,
  name,
  form: null,
  image_url: image,
  image_url_shiny: shinyImage,
  image_url_shadow: '',
  image_url_shiny_shadow: '',
  type_1_icon: '',
  type_2_icon: '',
  costumes: [],
  backgrounds: [],
  moves: [],
  fusion: [],
  megaEvolutions: [],
  evolves_from: [],
  max: [],
  ...patch,
} as unknown as BasePokemon);

const CATALOG = [
  pokemon(6, 'Charizard', '/images/default/pokemon_6.png', '/images/shiny/shiny_pokemon_6.png', {
    max: [{
      pokemon_id: 6,
      gigantamax: true,
      gigantamax_image_url: '/images/gigantamax/gigantamax_6.png',
      shiny_gigantamax_image_url: '/images/shiny_gigantamax/shiny_gigantamax_6.png',
    }],
  }),
  pokemon(25, 'Pikachu', '/images/default/pokemon_25.png', '/images/shiny/shiny_pokemon_25.png'),
  pokemon(150, 'Mewtwo', '/images/default/pokemon_150.png', '/images/shiny/shiny_pokemon_150.png'),
];

const row = (
  id: string,
  pokemonId: number,
  name: string,
  status: 'trade' | 'wanted',
  imageUri: string,
) => ({
  id,
  pokemonId,
  pokedexNumber: pokemonId,
  name,
  imageUri,
  locationBackgroundUri: null,
  maxKind: null,
  purified: false,
  lucky: false,
  typeIconUris: [],
  status,
  source: 'instance' as const,
  cp: null,
  favorite: false,
  mostWanted: false,
});

const RESULTS: NativePokemonSearchResult[] = [{
  id: 'smoke-listing-pikachu',
  username: 'OtherTrainer',
  distanceKm: 1.2,
  mode: 'trade',
  details: {
    gender: 'Female',
    weight: 6,
    height: 0.4,
    moves: ['Thunder Shock', 'Wild Charge'],
    attackIv: 15,
    defenseIv: 14,
    staminaIv: 13,
    locationCaught: 'Burnaby, British Columbia, Canada',
    dateCaught: '2026-08-26',
    friendshipLevel: null,
    prefLucky: false,
    wantedSizeLabels: [],
  },
  row: row(
    'smoke-listing-pikachu',
    25,
    'Shiny Pikachu',
    'trade',
    `${ASSET_BASE_URL}/images/shiny/shiny_pokemon_25.png`,
  ),
  relatedRows: [{
    ...row(
      'smoke-wanted-charizard',
      6,
      'Gigantamax Charizard',
      'wanted',
      `${ASSET_BASE_URL}/images/gigantamax/gigantamax_6.png`,
    ),
    maxKind: 'gigantamax',
    match: true,
  }],
  hasMutualMatch: true,
  mapCoordinate: [-122.98, 49.24],
  mapCoordinateIsApproximate: false,
}];

export default function DeviceSmokeSearchRoute() {
  const light = useNativeColorScheme() === 'light';
  const [activeView, setActiveView] = useState<NativeSearchHubView>('pokemon');
  const [pageScrollX] = useState(() => new Animated.Value(0));
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const [draft, setDraft] = useState<NativePokemonSearchDraft>(() => ({
    ...createNativePokemonSearchDraft({
      city: 'Burnaby, British Columbia, Canada',
      latitude: 49.24,
      longitude: -122.98,
    }),
    pokemonId: 25,
    pokemonName: 'Pikachu',
    ownership: 'trade' as const,
    shiny: true,
    onlyMatchingTrades: true,
  }));
  const [hasSearched, setHasSearched] = useState(true);
  const [trainerQuery, setTrainerQuery] = useState('');
  const changeView = useCallback((view: NativeSearchHubView) => {
    setActiveView(view);
    sliderRef.current?.setPage(VIEWS.indexOf(view));
  }, []);
  const trainers = useMemo(() => trainerQuery.trim().length < 2 ? [] : [{
    username: 'OtherTrainer',
    pokemonGoName: 'OtherPogoName',
    team: 'Mystic',
    trainer_level: 50,
  }], [trainerQuery]);

  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  return (
    <View style={[styles.screen, light && styles.screenLight]}>
      <NativeSearchHubHeader
        activeView={activeView}
        onViewChange={changeView}
        scrollX={pageScrollX}
      />
      <NativeHorizontalPageSlider
        activeIndex={VIEWS.indexOf(activeView)}
        onIndexChange={(index) => setActiveView(VIEWS[index] ?? 'pokemon')}
        ref={sliderRef}
        scrollX={pageScrollX}
      >
        <NativePokemonSearchScreen
          assetBaseUrl={ASSET_BASE_URL}
          catalog={CATALOG}
          draft={draft}
          hasSearched={hasSearched}
          notice={hasSearched ? 'Search complete · 1 listing found.' : null}
          onDraftChange={setDraft}
          onOpenListing={() => undefined}
          onOpenProfile={() => undefined}
          onSearch={() => setHasSearched(true)}
          results={hasSearched ? RESULTS : []}
          savedLocation={{
            label: 'Burnaby, British Columbia, Canada',
            latitude: 49.24,
            longitude: -122.98,
          }}
        />
        <NativeTrainerSearchScreen
          entries={trainers}
          onOpenCatalog={() => undefined}
          onOpenProfile={() => undefined}
          onQueryChange={setTrainerQuery}
          query={trainerQuery}
        />
      </NativeHorizontalPageSlider>
      <NativeRouteActionMenu currentPath="/search" signedIn />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#080d0f' },
  screenLight: { backgroundColor: '#f8fff9' },
});
