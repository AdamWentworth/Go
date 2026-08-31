import { act, fireEvent, render } from '@testing-library/react-native';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import {
  NativeAppLoadingProvider,
  useNativeAppLoading,
} from '../../../src/components/NativeAppLoadingProvider';

let mockScheme: 'dark' | 'light' = 'dark';

jest.mock('../../../src/features/settings/useNativeColorScheme', () => ({
  useNativeColorScheme: () => mockScheme,
}));

const Harness = ({ action }: { action: () => void }) => {
  const { runWithLoading } = useNativeAppLoading();
  return (
    <Pressable accessibilityLabel="Navigate" onPress={() => runWithLoading('route', action)}>
      <Text>Navigate</Text>
    </Pressable>
  );
};

describe('NativeAppLoadingProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockScheme = 'dark';
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('covers navigation with the canonical spinner through the hide grace period', () => {
    const action = jest.fn();
    const view = render(
      <NativeAppLoadingProvider>
        <Harness action={action} />
      </NativeAppLoadingProvider>,
    );

    fireEvent.press(view.getByLabelText('Navigate'));
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();
    expect(view.getByTestId('native-loading-spinner-dark', { includeHiddenElements: true })).toBeTruthy();
    expect(view.UNSAFE_getByType(Modal).props).toMatchObject({
      navigationBarTranslucent: true,
      presentationStyle: 'overFullScreen',
      statusBarTranslucent: true,
      transparent: false,
    });
    expect(action).not.toHaveBeenCalled();

    act(() => view.UNSAFE_getByType(Modal).props.onShow());
    act(() => jest.advanceTimersByTime(32));
    expect(action).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();

    act(() => jest.advanceTimersByTime(1799));
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();
    act(() => jest.advanceTimersByTime(1));
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();
    act(() => jest.advanceTimersByTime(100));
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();
    act(() => jest.advanceTimersByTime(100));
    expect(view.queryByTestId('native-app-loading-overlay')).toBeNull();
  });

  it('matches the canonical dark and light overlay surfaces', () => {
    const action = jest.fn();
    const view = render(
      <NativeAppLoadingProvider>
        <Harness action={action} />
      </NativeAppLoadingProvider>,
    );

    fireEvent.press(view.getByLabelText('Navigate'));
    expect(StyleSheet.flatten(view.getByTestId('native-app-loading-overlay').props.style)).toMatchObject({
      backgroundColor: '#101a19',
    });

    act(() => jest.runOnlyPendingTimers());
    mockScheme = 'light';
    view.rerender(
      <NativeAppLoadingProvider>
        <Harness action={action} />
      </NativeAppLoadingProvider>,
    );
    fireEvent.press(view.getByLabelText('Navigate'));
    expect(view.getByTestId('native-loading-spinner-light', { includeHiddenElements: true })).toBeTruthy();
    expect(StyleSheet.flatten(view.getByTestId('native-app-loading-overlay').props.style)).toMatchObject({
      backgroundColor: '#f8fff9',
    });
  });
});
