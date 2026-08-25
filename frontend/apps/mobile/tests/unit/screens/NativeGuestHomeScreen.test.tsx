import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeGuestHomeScreen } from '../../../src/screens/NativeGuestHomeScreen';

describe('NativeGuestHomeScreen', () => {
  it('preserves the guest selling points, guide, directory, and account actions', () => {
    const onNavigate = jest.fn();
    render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
        <NativeGuestHomeScreen assetBaseUrl="https://pokegonexus.com" onNavigate={onNavigate} />
      </SafeAreaProvider>,
    );
    expect(screen.getByText('Bring every catch, wishlist, and trade into one connected place.')).toBeTruthy();
    expect(screen.getByText('Exact collection')).toBeTruthy();
    expect(screen.getByText('Reciprocal trading')).toBeTruthy();
    expect(screen.getByText('One clear trading workflow')).toBeTruthy();

    fireEvent.press(screen.getByText('Create free account →'));
    fireEvent.press(screen.getByText('See how it works'));
    expect(onNavigate).toHaveBeenNthCalledWith(1, '/register');
    expect(onNavigate).toHaveBeenNthCalledWith(2, '/getting-started');
  });
});
