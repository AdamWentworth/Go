import { Redirect } from 'expo-router';
import { Animated, StyleSheet, View } from 'react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import { runtimeConfig } from '../../config/runtimeConfig';
import {
  NativeHorizontalPageSlider,
  type NativeHorizontalPageSliderHandle,
} from '../../components/NativeHorizontalPageSlider';
import {
  NativeTradeHubHeader,
  type NativeTradeHubView,
} from '../../features/trades/NativeTradeHubHeader';
import { buildNativeTradePreferenceEntries } from '../../features/trades/nativeTradePreferencesModel';
import { NativeTradeActivityScreen } from '../../screens/NativeTradeActivityScreen';
import { NativeTradePreferencesScreen } from '../../screens/NativeTradePreferencesScreen';

const ASSET_BASE_URL = 'https://pokegonexus.com';

const pokemon = (
  id: number,
  name: string,
  imagePath: string,
  shinyPath: string,
  patch: Record<string, unknown> = {},
): BasePokemon => ({
  pokemon_id: id,
  pokedex_number: id,
  name,
  attack: 100,
  defense: 100,
  stamina: 100,
  image_url: imagePath,
  image_url_shiny: shinyPath,
  shiny_available: 1,
  costumes: [],
  megaEvolutions: [],
  fusion: [],
  max: [],
  ...patch,
} as unknown as BasePokemon);

const CATALOG = [
  pokemon(1, 'Bulbasaur', '/images/default/default_pokemon_1.png', '/images/shiny/shiny_pokemon_1.png'),
  pokemon(3, 'Venusaur', '/images/default/default_pokemon_3.png', '/images/shiny/shiny_pokemon_3.png'),
  pokemon(4, 'Charmander', '/images/default/default_pokemon_4.png', '/images/shiny/shiny_pokemon_4.png', {
    shiny_rarity: 'community_day',
  }),
  pokemon(6, 'Charizard', '/images/default/default_pokemon_6.png', '/images/shiny/shiny_pokemon_6.png', {
    max: [{
      pokemon_id: 6,
      gigantamax: true,
      gigantamax_image_url: '/images/gigantamax/gigantamax_6.png',
      shiny_gigantamax_image_url: '/images/shiny_gigantamax/shiny_gigantamax_6.png',
    }],
  }),
  pokemon(7, 'Squirtle', '/images/default/default_pokemon_7.png', '/images/shiny/shiny_pokemon_7.png'),
  pokemon(25, 'Pikachu', '/images/default/default_pokemon_25.png', '/images/shiny/shiny_pokemon_25.png'),
  pokemon(150, 'Mewtwo', '/images/default/default_pokemon_150.png', '/images/shiny/shiny_pokemon_150.png', {
    rarity: 'Legendary',
  }),
  pokemon(245, 'Suicune', '/images/default/default_pokemon_245.png', '/images/shiny/shiny_pokemon_245.png', {
    rarity: 'Legendary',
  }),
  pokemon(376, 'Metagross', '/images/default/default_pokemon_376.png', '/images/shiny/shiny_pokemon_376.png'),
] as BasePokemon[];

const instance = ({
  id,
  pokemonId,
  status,
  shiny = false,
  gigantamax = false,
  locationCard = null,
  patch = {},
}: {
  id: string;
  pokemonId: number;
  status: 'trade' | 'wanted';
  shiny?: boolean;
  gigantamax?: boolean;
  locationCard?: string | null;
  patch?: Partial<PokemonInstance>;
}): PokemonInstance => ({
  instance_id: id,
  variant_id: `${String(pokemonId).padStart(4, '0')}-${shiny ? 'shiny_' : ''}${gigantamax ? 'gigantamax' : 'default'}`,
  pokemon_id: pokemonId,
  nickname: null,
  cp: null,
  level: null,
  attack_iv: null,
  defense_iv: null,
  stamina_iv: null,
  shiny,
  costume_id: null,
  lucky: false,
  shadow: false,
  purified: false,
  fast_move_id: null,
  charged_move1_id: null,
  charged_move2_id: null,
  weight: null,
  height: null,
  gender: null,
  mega: false,
  mega_form: null,
  is_mega: false,
  dynamax: false,
  gigantamax,
  crown: false,
  max_attack: null,
  max_guard: null,
  max_spirit: null,
  is_fused: false,
  fusion: null,
  fusion_form: null,
  fused_with: null,
  is_traded: false,
  traded_date: null,
  original_trainer_id: null,
  original_trainer_name: null,
  is_caught: status === 'trade',
  is_for_trade: status === 'trade',
  is_wanted: status === 'wanted',
  most_wanted: false,
  caught_tags: null,
  trade_tags: null,
  wanted_tags: null,
  not_trade_list: null,
  not_wanted_list: null,
  trade_filters: null,
  wanted_filters: null,
  mirror: false,
  pref_lucky: false,
  friendship_level: null,
  registered: true,
  favorite: false,
  disabled: false,
  pokeball: null,
  location_card: locationCard,
  location_caught: null,
  date_caught: null,
  date_added: '2026-08-24T00:00:00Z',
  last_update: 1,
  ...patch,
});

const INSTANCES: Record<string, PokemonInstance> = {
  'trade-bulbasaur': instance({
    id: 'trade-bulbasaur',
    pokemonId: 1,
    status: 'trade',
    shiny: true,
    patch: { not_wanted_list: { 'wanted-mewtwo': true } },
  }),
  'trade-charizard': instance({
    id: 'trade-charizard',
    pokemonId: 6,
    status: 'trade',
    shiny: true,
    gigantamax: true,
  }),
  'trade-squirtle': instance({ id: 'trade-squirtle', pokemonId: 7, status: 'trade', shiny: true }),
  'trade-pikachu': instance({ id: 'trade-pikachu', pokemonId: 25, status: 'trade', shiny: true }),
  'trade-metagross': instance({ id: 'trade-metagross', pokemonId: 376, status: 'trade', shiny: true }),
  'wanted-venusaur': instance({
    id: 'wanted-venusaur',
    pokemonId: 3,
    status: 'wanted',
    shiny: true,
    patch: { most_wanted: true },
  }),
  'wanted-charmander': instance({ id: 'wanted-charmander', pokemonId: 4, status: 'wanted', shiny: true }),
  'wanted-mewtwo': instance({ id: 'wanted-mewtwo', pokemonId: 150, status: 'wanted', shiny: true }),
  'wanted-suicune': instance({ id: 'wanted-suicune', pokemonId: 245, status: 'wanted', shiny: true }),
  'wanted-metagross': instance({ id: 'wanted-metagross', pokemonId: 376, status: 'wanted', shiny: true }),
};

export default function DeviceSmokeTradePreferencesRoute() {
  const [activeView, setActiveView] = useState<NativeTradeHubView>('preferences');
  const [pageScrollX] = useState(() => new Animated.Value(0));
  const sliderRef = useRef<NativeHorizontalPageSliderHandle>(null);
  const changeView = useCallback((view: NativeTradeHubView) => {
    setActiveView(view);
    sliderRef.current?.setPage(view === 'preferences' ? 0 : 1);
  }, []);
  const entries = useMemo(() => ({
    trade: buildNativeTradePreferenceEntries({
      assetOrigin: ASSET_BASE_URL,
      catalog: CATALOG,
      instances: INSTANCES,
      mode: 'trade',
    }),
    wanted: buildNativeTradePreferenceEntries({
      assetOrigin: ASSET_BASE_URL,
      catalog: CATALOG,
      instances: INSTANCES,
      mode: 'wanted',
    }),
  }), []);

  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;

  return (
    <View style={styles.screen}>
      <NativeTradeHubHeader
        activeView={activeView}
        onViewChange={changeView}
        scrollX={pageScrollX}
      />
      <NativeHorizontalPageSlider
        activeIndex={activeView === 'preferences' ? 0 : 1}
        onIndexChange={(index) => setActiveView(index === 1 ? 'activity' : 'preferences')}
        ref={sliderRef}
        scrollX={pageScrollX}
      >
        <NativeTradePreferencesScreen
          assetBaseUrl={ASSET_BASE_URL}
          entries={entries}
          onOpenActivity={() => changeView('activity')}
          onSave={async () => new Promise((resolve) => setTimeout(resolve, 250))}
          showModeTabs={false}
        />
        <NativeTradeActivityScreen
          assetBaseUrl={ASSET_BASE_URL}
          error={null}
          isLoading={false}
          onAction={async () => undefined}
          onOpenPreferences={() => changeView('preferences')}
          onRetry={() => undefined}
          onRevealPartner={async () => { throw new Error('No fixture partner.'); }}
          rows={[]}
          showModeTabs={false}
        />
      </NativeHorizontalPageSlider>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, backgroundColor: '#071012' },
});
