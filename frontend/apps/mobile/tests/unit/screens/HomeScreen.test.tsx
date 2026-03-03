import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../../../src/screens/HomeScreen';

const mockSignOut = jest.fn();
const mockRefreshNow = jest.fn();

jest.mock('../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: { username: 'ash' },
    signOut: mockSignOut,
  }),
}));

jest.mock('../../../src/features/events/EventsProvider', () => ({
  useEvents: () => ({
    transport: 'polling',
    connected: false,
    syncing: false,
    error: 'network unavailable',
    lastSyncAt: 1700000000000,
    refreshNow: mockRefreshNow,
  }),
}));

describe('HomeScreen', () => {
  const navigation = {
    navigate: jest.fn(),
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders realtime sync status and retry action when degraded', () => {
    render(<HomeScreen navigation={navigation} route={undefined as never} />);

    expect(screen.getByText('Realtime transport: polling')).toBeTruthy();
    expect(screen.getByText('Realtime status: degraded')).toBeTruthy();
    expect(screen.getByText('network unavailable')).toBeTruthy();

    fireEvent.press(screen.getByText('Retry Realtime Sync'));
    expect(mockRefreshNow).toHaveBeenCalledTimes(1);
  });
});
