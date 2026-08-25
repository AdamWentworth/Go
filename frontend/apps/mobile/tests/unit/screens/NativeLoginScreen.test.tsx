import { ApiClientError } from '@pokemongonexus/shared-api-client';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NativeLoginScreen } from '../../../src/screens/NativeLoginScreen';

describe('NativeLoginScreen', () => {
  it('keeps a security-action result visible when reauthentication is required', () => {
    render(
      <NativeLoginScreen
        notice="Password updated. Sign in again on this device."
        onSignIn={jest.fn()}
        onSignedIn={jest.fn()}
        onUseCurrentApp={jest.fn()}
      />,
    );
    expect(screen.getByText('Password updated. Sign in again on this device.')).toBeTruthy();
  });

  it('submits credentials and advances only after the session succeeds', async () => {
    const onSignIn = jest.fn().mockResolvedValue(undefined);
    const onSignedIn = jest.fn();
    render(
      <NativeLoginScreen
        onSignIn={onSignIn}
        onSignedIn={onSignedIn}
        onUseCurrentApp={jest.fn()}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Trainer name or email'), 'misty');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => expect(onSignIn).toHaveBeenCalledWith('misty', 'password'));
    expect(onSignedIn).toHaveBeenCalledTimes(1);
  });

  it('keeps the form visible and explains invalid credentials', async () => {
    const onSignIn = jest.fn().mockRejectedValue(
      new ApiClientError(401, 'Invalid credentials', { message: 'Invalid credentials' }),
    );
    render(
      <NativeLoginScreen
        onSignIn={onSignIn}
        onSignedIn={jest.fn()}
        onUseCurrentApp={jest.fn()}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Trainer name or email'), 'misty');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password');
    fireEvent.press(screen.getByText('Sign in'));

    expect(await screen.findByText(
      'That username, email, or password was not recognized.',
    )).toBeTruthy();
  });
});
