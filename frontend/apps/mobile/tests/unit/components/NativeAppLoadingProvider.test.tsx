import { act, fireEvent, render } from '@testing-library/react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import {
  NativeAppLoadingOverlay,
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
      <NativeAppLoadingProvider navigationPath="/native">
        <Harness action={action} />
        <NativeAppLoadingOverlay />
      </NativeAppLoadingProvider>,
    );

    fireEvent.press(view.getByLabelText('Navigate'));
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();
    expect(view.getByTestId('native-loading-spinner-dark', { includeHiddenElements: true })).toBeTruthy();
    expect(StyleSheet.flatten(view.getByTestId('native-app-loading-overlay').props.style)).toMatchObject({
      backgroundColor: '#101a19',
      flex: 1,
    });
    expect(action).not.toHaveBeenCalled();

    fireEvent(view.getByTestId('native-app-loading-modal'), 'show');
    act(() => jest.advanceTimersByTime(32));
    expect(action).toHaveBeenCalledTimes(1);
    expect(view.getByTestId('native-app-loading-overlay')).toBeTruthy();

    view.rerender(
      <NativeAppLoadingProvider navigationPath="/native/collection">
        <Harness action={action} />
        <NativeAppLoadingOverlay />
      </NativeAppLoadingProvider>,
    );
    act(() => jest.advanceTimersByTime(32));
    act(() => jest.advanceTimersByTime(2999));
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
        <NativeAppLoadingOverlay />
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
        <NativeAppLoadingOverlay />
      </NativeAppLoadingProvider>,
    );
    expect(view.getByTestId('native-loading-spinner-light', { includeHiddenElements: true })).toBeTruthy();
    expect(StyleSheet.flatten(view.getByTestId('native-app-loading-overlay').props.style)).toMatchObject({
      backgroundColor: '#f8fff9',
    });
  });
});
