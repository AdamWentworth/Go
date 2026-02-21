import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from '../../../src/screens/RegisterScreen';
import { registerUser } from '../../../src/services/authService';

const mockSignIn = jest.fn();

jest.mock('../../../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

jest.mock('../../../src/services/authService', () => ({
  registerUser: jest.fn(),
}));

const mockedRegisterUser = registerUser as jest.MockedFunction<typeof registerUser>;

const baseNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
};

const route = {
  key: 'Register-key',
  name: 'Register',
  params: undefined,
} as const;

describe('RegisterScreen', () => {
  const pressRegisterButton = () => {
    const registerLabels = screen.getAllByText('Register');
    fireEvent.press(registerLabels[registerLabels.length - 1]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers and signs in with normalized trainer code', async () => {
    mockedRegisterUser.mockResolvedValue({ message: 'ok' });
    mockSignIn.mockResolvedValue(undefined);

    render(<RegisterScreen navigation={baseNavigation as never} route={route as never} />);
    expect(screen.getByText('Validation checklist')).toBeTruthy();
    expect(screen.getByText('TODO Trainer code digits: 0/12')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'ash');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'ash@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'pikachu123');
    fireEvent.changeText(screen.getByPlaceholderText('Pokemon GO name'), 'Ash K');
    fireEvent.changeText(screen.getByPlaceholderText('Trainer code (12 digits)'), '1234 5678-9012');

    pressRegisterButton();

    await waitFor(() => {
      expect(mockedRegisterUser).toHaveBeenCalledWith({
        username: 'ash',
        email: 'ash@example.com',
        password: 'pikachu123',
        pokemonGoName: 'Ash K',
        trainerCode: '123456789012',
      });
    });

    expect(mockSignIn).toHaveBeenCalledWith({ username: 'ash', password: 'pikachu123' });
  });

  it('blocks invalid submission when form validation fails', async () => {
    render(<RegisterScreen navigation={baseNavigation as never} route={route as never} />);

    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'ash');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'not-an-email');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'pikachu123');
    fireEvent.changeText(screen.getByPlaceholderText('Pokemon GO name'), 'Ash K');
    fireEvent.changeText(screen.getByPlaceholderText('Trainer code (12 digits)'), '123456789012');

    pressRegisterButton();
    expect(mockedRegisterUser).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('maps register server conflicts to friendly messages', async () => {
    mockedRegisterUser.mockRejectedValue(
      { status: 409, data: { message: 'username already exists' } },
    );

    render(<RegisterScreen navigation={baseNavigation as never} route={route as never} />);
    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'ash');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'ash@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'pikachu123');
    fireEvent.changeText(screen.getByPlaceholderText('Pokemon GO name'), 'Ash K');
    fireEvent.changeText(screen.getByPlaceholderText('Trainer code (12 digits)'), '1234 5678 9012');

    pressRegisterButton();

    await waitFor(() => {
      expect(screen.getByText('Username is already taken.')).toBeTruthy();
    });
  });
});
