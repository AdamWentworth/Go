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
    expect(screen.getByText('Build your collection.')).toBeTruthy();
    expect(screen.getByText('Find the right trade.')).toBeTruthy();
    expect(screen.getByText('Exact variants and custom tags')).toBeTruthy();
    expect(screen.getByText('Reciprocal trade matching')).toBeTruthy();
    expect(screen.getByText('You each have what the other trainer wants')).toBeTruthy();
    expect(screen.getByText('Catalog what you have')).toBeTruthy();
    expect(screen.getByText('Find a real match')).toBeTruthy();
    expect(screen.getByText('Propose with confidence')).toBeTruthy();

    fireEvent.press(screen.getByText('Create your free account'));
    fireEvent.press(screen.getByText('Explore the app ↓'));
    expect(onNavigate).toHaveBeenNthCalledWith(1, '/register');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
