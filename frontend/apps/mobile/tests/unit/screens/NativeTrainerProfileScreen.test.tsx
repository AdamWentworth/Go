import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeTrainerProfileScreen } from '../../../src/screens/NativeTrainerProfileScreen';
import type { NativeTrainerProfileModel } from '../../../src/features/social/nativeTrainerProfileModel';
import type { NativeCollectionRow } from '../../../src/features/collection/collectionModel';

const model: NativeTrainerProfileModel = {
  username: 'AdamZilla',
  pokemonGoName: 'AdamGo',
  avatarLabel: 'A',
  team: 'mystic',
  teamLabel: 'Team Mystic',
  trainerLevel: 50,
  totalXpLabel: '123,456 XP',
  memberSinceLabel: 'Jan 2, 2026',
  startedLabel: 'Jul 6, 2016',
  locationLabel: 'Burnaby, British Columbia, Canada',
  trainerCodeLabel: '1234 5678 9012',
  titles: [{ id: 'shiny-hunter', label: 'Shiny Hunter', description: 'Hunting shiny Pokémon' }],
  highlights: [],
  stats: [
    { key: 'registered', label: 'Registered', value: 800 },
    { key: 'caught', label: 'Caught', value: 100 },
    { key: 'trade', label: 'For trade', value: 20 },
    { key: 'wanted', label: 'Wanted', value: 30 },
    { key: 'favorites', label: 'Favorites', value: 10 },
  ],
  relationship: 'self',
  friendshipId: null,
  canViewCollection: true,
};

const highlight: NativeCollectionRow = {
  id: 'highlight-1',
  pokemonId: 6,
  pokedexNumber: 6,
  name: 'Shiny Gigantamax Charizard',
  imageUri: 'https://pokegonexus.com/images/shiny_gigantamax/shiny_gigantamax_6.png',
  locationBackgroundUri: null,
  maxKind: 'gigantamax',
  purified: false,
  lucky: false,
  typeIconUris: [],
  status: 'caught',
  cp: 3000,
  favorite: true,
  mostWanted: false,
};

const renderScreen = (props: Partial<React.ComponentProps<typeof NativeTrainerProfileScreen>> = {}) => render(
  <SafeAreaProvider initialMetrics={{
    frame: { x: 0, y: 0, width: 412, height: 915 },
    insets: { top: 24, right: 0, bottom: 20, left: 0 },
  }}>
    <NativeTrainerProfileScreen
      assetBaseUrl="https://pokegonexus.com"
      highlights={[highlight]}
      isOwner
      model={model}
      onOpenCollection={jest.fn()}
      {...props}
    />
  </SafeAreaProvider>,
);

describe('NativeTrainerProfileScreen', () => {
  it('renders the canonical trainer card hierarchy and showcase', () => {
    const view = renderScreen();
    expect(view.getByText('YOUR TRAINER CARD')).toBeTruthy();
    expect(view.getByText('AdamGo')).toBeTruthy();
    expect(view.getByText('@AdamZilla')).toBeTruthy();
    expect(view.getByText('Shiny Gigantamax Charizard')).toBeTruthy();
    expect(view.getByText('Shiny Hunter')).toBeTruthy();
    expect(view.getByText('1234 5678 9012')).toBeTruthy();
  });

  it('opens the exact collection filter from a collection stat', () => {
    const onOpenCollection = jest.fn();
    const view = renderScreen({ onOpenCollection });
    fireEvent.press(view.getByText('For trade'));
    expect(onOpenCollection).toHaveBeenCalledWith('trade');
    fireEvent.press(view.getByRole('button', { name: 'View Pokémon' }));
    expect(onOpenCollection).toHaveBeenCalledWith();
  });

  it('surfaces loading and retryable error states above the workflow', () => {
    const retry = jest.fn();
    const loading = renderScreen({ isLoading: true });
    expect(loading.getByText('Loading trainer profile')).toBeTruthy();
    loading.unmount();

    const failed = renderScreen({ error: 'Profile is private.', model: null, onRetry: retry });
    expect(failed.getByText('Profile is private.')).toBeTruthy();
    fireEvent.press(failed.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
