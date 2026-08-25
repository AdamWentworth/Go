import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NativeRegisterScreen } from '../../../src/screens/NativeRegisterScreen';

describe('NativeRegisterScreen', () => {
  it('collects the canonical account fields and submits a normalized registration', async () => {
    const onRegister = jest.fn().mockResolvedValue(undefined);
    const onRegistered = jest.fn();
    render(
      <NativeRegisterScreen
        onBackToLogin={jest.fn()}
        onOpenPrivacy={jest.fn()}
        onOpenTerms={jest.fn()}
        onRegister={onRegister}
        onRegistered={onRegistered}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Choose a unique username'), 'Misty_42');
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'MISTY@example.com ');
    fireEvent.press(screen.getByText('Continue ›'));

    fireEvent.changeText(screen.getByPlaceholderText('Create a password'), 'Strong_password_42');
    fireEvent.changeText(screen.getByPlaceholderText('Enter it again'), 'Strong_password_42');
    fireEvent.press(screen.getByText('Continue ›'));

    fireEvent.changeText(screen.getByPlaceholderText('Optional'), 'MistyGo');
    fireEvent.changeText(screen.getByPlaceholderText('0000 0000 0000'), '123456789012');
    fireEvent.press(screen.getByText('Continue ›'));

    fireEvent.changeText(
      screen.getByPlaceholderText('City, region, country (optional)'),
      'Cerulean City',
    );
    fireEvent(screen.getByRole('switch'), 'valueChange', true);
    fireEvent.press(screen.getByText('Continue ›'));

    fireEvent.press(screen.getByText('Create account ✓'));
    await waitFor(() => expect(onRegister).toHaveBeenCalledWith({
      allowLocation: true,
      email: 'misty@example.com',
      location: 'Cerulean City',
      password: 'Strong_password_42',
      pokemonGoName: 'MistyGo',
      trainerCode: '123456789012',
      username: 'Misty_42',
    }));
    expect(onRegistered).toHaveBeenCalledTimes(1);
  });

  it('keeps the user on the current step when validation fails', () => {
    render(
      <NativeRegisterScreen
        onBackToLogin={jest.fn()}
        onOpenPrivacy={jest.fn()}
        onOpenTerms={jest.fn()}
        onRegister={jest.fn()}
        onRegistered={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByText('Continue ›'));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Username must be 3–15 letters, numbers, or underscores.',
    );
    expect(screen.getByPlaceholderText('Choose a unique username')).toBeTruthy();
  });
});
