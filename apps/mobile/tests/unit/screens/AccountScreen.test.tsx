import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccountScreen } from '../../../src/screens/AccountScreen';
import { updateAuthAccount, updateSecondaryAccount } from '../../../src/services/accountService';

const mockUpdateUser = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      user_id: 'u1',
      username: 'ash',
      email: 'ash@example.com',
      trainerCode: '123456789012',
      pokemonGoName: 'Ash K',
      location: 'Pallet Town',
      allowLocation: true,
      coordinates: { latitude: 1, longitude: 2 },
      token: 't',
    },
    updateUser: mockUpdateUser,
    signOut: mockSignOut,
  }),
}));

jest.mock('../../../src/services/accountService', () => ({
  updateAuthAccount: jest.fn(),
  updateSecondaryAccount: jest.fn(),
  deleteAccount: jest.fn(),
}));

const mockedUpdateAuthAccount = updateAuthAccount as jest.MockedFunction<typeof updateAuthAccount>;
const mockedUpdateSecondaryAccount =
  updateSecondaryAccount as jest.MockedFunction<typeof updateSecondaryAccount>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'Account-key',
  name: 'Account',
  params: undefined,
} as const;

describe('AccountScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks invalid allow-location input', async () => {
    render(<AccountScreen navigation={baseNavigation as never} route={route as never} />);
    expect(screen.getByText('Validation checklist')).toBeTruthy();
    expect(screen.getByText('PASS Pokemon GO name is required')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Allow location (true/false)'), 'maybe');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Allow location must be either true or false.')).toBeTruthy();
    });
    expect(mockedUpdateAuthAccount).not.toHaveBeenCalled();
    expect(mockedUpdateSecondaryAccount).not.toHaveBeenCalled();
  });

  it('saves account details with normalized values', async () => {
    mockedUpdateAuthAccount.mockResolvedValue({ message: 'ok' });
    mockedUpdateSecondaryAccount.mockResolvedValue({ message: 'ok' });
    mockUpdateUser.mockResolvedValue(undefined);

    render(<AccountScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.changeText(screen.getByPlaceholderText('Pokemon GO name'), 'Ash Prime');
    fireEvent.changeText(screen.getByPlaceholderText('Location'), ' Indigo Plateau ');
    fireEvent.changeText(screen.getByPlaceholderText('Allow location (true/false)'), 'false');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockedUpdateAuthAccount).toHaveBeenCalledWith('u1', {
        pokemonGoName: 'Ash Prime',
        location: 'Indigo Plateau',
        allowLocation: false,
      });
    });

    expect(mockedUpdateSecondaryAccount).toHaveBeenCalledWith('u1', {
      username: 'ash',
      pokemonGoName: 'Ash Prime',
      latitude: 1,
      longitude: 2,
    });
    expect(mockUpdateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        pokemonGoName: 'Ash Prime',
        location: 'Indigo Plateau',
        allowLocation: false,
      }),
    );
    expect(screen.getByText('Account updated successfully.')).toBeTruthy();
  });

  it('maps account update auth errors to friendly copy', async () => {
    mockedUpdateAuthAccount.mockRejectedValue({ status: 401, data: { message: 'token expired' } });

    render(<AccountScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Your session expired. Please sign in again.')).toBeTruthy();
    });
  });
});
