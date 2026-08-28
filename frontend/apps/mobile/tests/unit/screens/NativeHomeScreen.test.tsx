import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeHomeScreen } from '../../../src/screens/NativeHomeScreen';

const renderHome = (props = baseProps) => render(
  <SafeAreaProvider initialMetrics={{
    frame: { x: 0, y: 0, width: 390, height: 844 },
    insets: { top: 24, right: 0, bottom: 20, left: 0 },
  }}>
    <NativeHomeScreen {...props} />
  </SafeAreaProvider>,
);

const baseProps = {
  assetBaseUrl: 'https://pokegonexus.com',
  collection: {
    caught: 20,
    favorites: 3,
    forTrade: 4,
    wanted: 7,
    mostWanted: 2,
  },
  error: null as string | null,
  friendsState: 'ready' as const,
  incomingFriends: 0,
  isLoading: false,
  onDismissActionMenuHint: jest.fn(),
  onDismissOnboarding: jest.fn(),
  onNavigate: jest.fn(),
  onRetry: jest.fn(),
  onboardingProgress: null as import('../../../src/features/home/nativeHomeDashboardModel').NativeHomeOnboardingProgress | null,
  pokemonGoName: 'MistyGO',
  recentRows: [],
  showActionMenuHint: true,
  trades: {
    needsResponse: 0,
    readyToConfirm: 0,
    waiting: 0,
    completed: 8,
    active: 0,
  },
  username: 'misty',
};

describe('NativeHomeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('matches the canonical dashboard hierarchy and routes each primary action', () => {
    renderHome();

    expect(screen.getByText('Welcome back,\nMistyGO')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('You’re all caught up')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Find Pokémon' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open collection' }));
    fireEvent.press(screen.getByRole('button', { name: 'Trade activity' }));

    expect(baseProps.onNavigate).toHaveBeenNthCalledWith(1, '/search');
    expect(baseProps.onNavigate).toHaveBeenNthCalledWith(2, '/pokemon');
    expect(baseProps.onNavigate).toHaveBeenNthCalledWith(3, '/trades?section=activity');
  });

  it('keeps the quick-navigation education dismissible', () => {
    renderHome();

    expect(screen.getByText('Tap the Poké Ball below for quick navigation.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Dismiss quick navigation hint' }));
    expect(baseProps.onDismissActionMenuHint).toHaveBeenCalledTimes(1);
  });

  it('puts a combined dashboard failure next to a retry action', () => {
    const onRetry = jest.fn();
    renderHome({ ...baseProps, error: 'Service unavailable', onRetry });

    expect(screen.getByText('Service unavailable')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('replaces the dashboard with the canonical milestone onboarding until dismissed', () => {
    const onDismissOnboarding = jest.fn();
    const onNavigate = jest.fn();
    renderHome({
      ...baseProps,
      onDismissOnboarding,
      onNavigate,
      onboardingProgress: {
        completed: 1,
        total: 4,
        tasks: [
          { id: 'collection', title: 'Add your first Pokémon', description: 'Begin.', action: 'Open Pokémon', to: '/pokemon', complete: true },
          { id: 'wanted', title: 'Create a Wanted listing', description: 'Choose details.', action: 'Open wishlist', to: '/pokemon?filter=wanted', complete: false },
          { id: 'trade', title: 'List a Pokémon For Trade', description: 'Choose an offer.', action: 'Open collection', to: '/pokemon?filter=trade', complete: false },
          { id: 'connect', title: 'Make your first connection', description: 'Find trainers.', action: 'Find trainers', to: '/search', complete: false },
        ],
      },
    });

    expect(screen.getByText('Let’s make your account useful.')).toBeTruthy();
    expect(screen.queryByText('You’re all caught up')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Open wishlist' }));
    fireEvent.press(screen.getByRole('button', { name: 'Open trainer dashboard' }));
    expect(onNavigate).toHaveBeenCalledWith('/pokemon?filter=wanted');
    expect(onDismissOnboarding).toHaveBeenCalledTimes(1);
  });
});
