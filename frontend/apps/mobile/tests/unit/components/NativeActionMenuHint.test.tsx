import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeActionMenuHint } from '../../../src/components/NativeActionMenuHint';

describe('NativeActionMenuHint', () => {
  it('lets guests open or dismiss the persistent action-menu explanation', () => {
    const onDismiss = jest.fn();
    const onOpen = jest.fn();
    render(
      <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 24, right: 0, bottom: 20, left: 0 } }}>
        <NativeActionMenuHint
          assetBaseUrl="https://pokegonexus.com"
          audience="guest"
          onDismiss={onDismiss}
          onOpen={onOpen}
        />
      </SafeAreaProvider>,
    );

    expect(screen.getByText('Tap the Poké Ball below to explore the app.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Open action menu from tip'));
    fireEvent.press(screen.getByLabelText('Dismiss quick navigation hint'));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
