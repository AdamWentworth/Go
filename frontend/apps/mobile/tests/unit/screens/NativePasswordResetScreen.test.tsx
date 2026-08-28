import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { NativePasswordResetScreen } from '../../../src/screens/NativePasswordResetScreen';

describe('NativePasswordResetScreen', () => {
  it('requests a reset without revealing whether the account exists', async () => {
    const onRequest = jest.fn().mockResolvedValue(undefined);
    render(<NativePasswordResetScreen onBackToLogin={jest.fn()} onConfirm={jest.fn()} onRequest={onRequest} />);
    fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'misty@example.com');
    fireEvent.press(screen.getByText('Email reset link'));
    await waitFor(() => expect(onRequest).toHaveBeenCalledWith('misty@example.com'));
    await waitFor(() => expect(screen.getByText('Check your email')).toBeTruthy());
  });

  it('confirms only matching strong passwords', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<NativePasswordResetScreen onBackToLogin={jest.fn()} onConfirm={onConfirm} onRequest={jest.fn()} token="reset-token" />);
    fireEvent.changeText(screen.getByLabelText('New password'), 'Strong_password_42');
    fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'Strong_password_42');
    fireEvent.press(screen.getByText('Update password'));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('reset-token', 'Strong_password_42'));
    await waitFor(() => expect(screen.getByText('Password updated')).toBeTruthy());
  });
});
