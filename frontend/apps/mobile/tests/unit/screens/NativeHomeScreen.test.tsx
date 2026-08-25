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
  onNavigate: jest.fn(),
  onRetry: jest.fn(),
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
});
