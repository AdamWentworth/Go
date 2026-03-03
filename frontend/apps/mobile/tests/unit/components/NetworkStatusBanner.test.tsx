import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NetworkStatusBanner } from '../../../src/components/NetworkStatusBanner';

const refreshConnectivityMock = jest.fn();

jest.mock('../../../src/features/network/NetworkProvider', () => ({
  useNetwork: jest.fn(),
}));

const { useNetwork } = jest.requireMock('../../../src/features/network/NetworkProvider') as {
  useNetwork: jest.Mock;
};

describe('NetworkStatusBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing while online', () => {
    useNetwork.mockReturnValue({
      online: true,
      checking: false,
      lastError: null,
      lastCheckAt: Date.now(),
      lastChangedAt: Date.now(),
      refreshConnectivity: refreshConnectivityMock,
    });

    const { toJSON } = render(<NetworkStatusBanner />);
    expect(toJSON()).toBeNull();
  });

  it('renders banner and triggers retry while offline', () => {
    useNetwork.mockReturnValue({
      online: false,
      checking: false,
      lastError: 'Network unreachable',
      lastCheckAt: Date.now(),
      lastChangedAt: Date.now(),
      refreshConnectivity: refreshConnectivityMock,
    });

    render(<NetworkStatusBanner />);

    expect(screen.getByText('Connection issue detected')).toBeTruthy();
    expect(screen.getByText('Network unreachable')).toBeTruthy();
    fireEvent.press(screen.getByText('Retry Connection'));
    expect(refreshConnectivityMock).toHaveBeenCalledTimes(1);
  });
});
