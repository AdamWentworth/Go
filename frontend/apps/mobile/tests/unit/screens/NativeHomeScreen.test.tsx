import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeHomeScreen } from '../../../src/screens/NativeHomeScreen';

const baseProps = {
  username: 'misty',
  summary: {
    collection_total: 24,
    caught: 20,
    for_trade: 4,
    wanted: 7,
    favorite: 3,
    most_wanted: 2,
  },
  isLoading: false,
  error: null,
  onRetry: jest.fn(),
  onOpenCurrentApp: jest.fn(),
  onSignOut: jest.fn(),
};

describe('NativeHomeScreen', () => {
  it('renders collection summary counts and keeps full editing in the current app', () => {
    render(<NativeHomeScreen {...baseProps} />);

    expect(screen.getByText('Welcome, misty')).toBeTruthy();
    expect(screen.getByText('24')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Open full collection' }));
    expect(baseProps.onOpenCurrentApp).toHaveBeenCalledTimes(1);
  });

  it('puts an API failure next to a retry action', () => {
    const onRetry = jest.fn();
    render(
      <NativeHomeScreen
        {...baseProps}
        summary={null}
        error="Service unavailable"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('Service unavailable')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
