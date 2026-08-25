import { Redirect } from 'expo-router';
import { useState } from 'react';
import { runtimeConfig } from '../../config/runtimeConfig';
import type { NativeCollectionRow } from '../../features/collection/collectionModel';
import type { NativeTrainerProfileModel } from '../../features/social/nativeTrainerProfileModel';
import type { NativeTrainerProfileDraft } from '../../features/social/nativeTrainerProfileEditorModel';
import { NativeTrainerProfileScreen } from '../../screens/NativeTrainerProfileScreen';

const ASSET_BASE_URL = 'https://pokegonexus.com';

const highlight = (
  id: string,
  pokemonId: number,
  name: string,
  image: string,
  maxKind: NativeCollectionRow['maxKind'] = null,
): NativeCollectionRow => ({
  id,
  pokemonId,
  pokedexNumber: pokemonId,
  name,
  imageUri: `${ASSET_BASE_URL}${image}`,
  locationBackgroundUri: null,
  maxKind,
  purified: false,
  lucky: false,
  typeIconUris: [],
  status: 'caught',
  source: 'instance',
  cp: 3000,
  favorite: true,
  mostWanted: false,
});

const MODEL: NativeTrainerProfileModel = {
  userId: 'user-1',
  username: 'AdamZilla',
  pokemonGoName: 'AdamGo',
  avatarLabel: 'A',
  team: 'mystic',
  teamLabel: 'Team Mystic',
  trainerLevel: 50,
  totalXpLabel: '123,456,789 XP',
  memberSinceLabel: 'Jan 2, 2026',
  startedLabel: 'Jul 6, 2016',
  locationLabel: 'Burnaby, British Columbia, Canada',
  trainerCodeLabel: '1234 5678 9012',
  titles: [
    { id: 'shiny-hunter', label: 'Shiny Hunter', description: 'Hunting shiny Pokémon' },
    { id: 'lucky-trader', label: 'Lucky Trader', description: 'Trading and Lucky Pokémon' },
  ],
  highlights: [],
  stats: [
    { key: 'registered', label: 'Registered', value: 846 },
    { key: 'caught', label: 'Caught', value: 2255 },
    { key: 'trade', label: 'For trade', value: 208 },
    { key: 'wanted', label: 'Wanted', value: 77 },
    { key: 'favorites', label: 'Favorites', value: 168 },
  ],
  relationship: 'self',
  friendshipId: null,
  canViewCollection: true,
};

const HIGHLIGHTS = [
  highlight('charizard', 6, 'Shiny Gigantamax Charizard', '/images/shiny_gigantamax/shiny_gigantamax_6.png', 'gigantamax'),
  highlight('venusaur', 3, 'Shiny Venusaur', '/images/shiny/shiny_pokemon_3.png'),
  highlight('mewtwo', 150, 'Armored Mewtwo', '/images/default/pokemon_150.png'),
];

const EDITOR_DRAFT: NativeTrainerProfileDraft = {
  trainerTitles: ['shiny-hunter', 'lucky-trader'],
  pokemonGoName: 'AdamGo',
  trainerCode: '123456789012',
  team: 'Mystic',
  trainerLevel: '50',
  totalXp: '123456789',
  startedOn: '2016-07-06',
  location: 'Burnaby, British Columbia, Canada',
  highlightInstanceIds: HIGHLIGHTS.map(({ id }) => id),
};

export default function DeviceSmokeProfileRoute() {
  const [draft, setDraft] = useState<NativeTrainerProfileDraft | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'success'; text: string } | null>(null);
  if (!runtimeConfig.mobile.deviceSmokeMode) return <Redirect href="/" />;
  return (
    <NativeTrainerProfileScreen
      assetBaseUrl={ASSET_BASE_URL}
      editorDraft={draft}
      feedback={feedback}
      highlights={HIGHLIGHTS}
      highlightCandidates={[
        ...HIGHLIGHTS,
        highlight('suicune', 245, 'Shiny Suicune', '/images/shiny/shiny_pokemon_245.png'),
        highlight('metagross', 376, 'Shiny Metagross', '/images/shiny/shiny_pokemon_376.png'),
      ]}
      isOwner
      model={MODEL}
      onBeginEdit={() => setDraft({ ...EDITOR_DRAFT })}
      onCancelEdit={() => setDraft(null)}
      onChangeEditorDraft={setDraft}
      onDismissFeedback={() => setFeedback(null)}
      onOpenCollection={() => undefined}
      onOpenFriends={() => undefined}
      onSaveProfile={() => {
        setDraft(null);
        setFeedback({ tone: 'success', text: 'Profile updated.' });
      }}
    />
  );
}
