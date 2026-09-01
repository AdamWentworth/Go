import { fireEvent, render } from '@testing-library/react-native';
import { Animated, Modal, StyleSheet } from 'react-native';
import { collectionExperienceParityContract } from '@pokemongonexus/shared-ui-tokens';
import { NativeCollectionSortMenu } from '../../../../src/features/collection/parity/NativeCollectionSortMenu';

let mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
let mockReduceMotion = true;

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock('../../../../src/features/settings/NativeDevicePreferencesProvider', () => ({
  useOptionalNativeDevicePreferences: () => ({ shouldReduceMotion: mockReduceMotion }),
}));

jest.mock('../../../../src/features/settings/useNativeColorScheme', () => ({
  useNativeColorScheme: () => 'dark',
}));

describe('NativeCollectionSortMenu', () => {
  beforeEach(() => {
    mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
    mockReduceMotion = true;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses a full-parent native gradient through the Android system window', () => {
    const view = render(
      <NativeCollectionSortMenu
        assetBaseUrl="https://pokegonexus.com"
        direction="ascending"
        onClose={jest.fn()}
        onSelect={jest.fn()}
        open
        sort="number"
      />,
    );

    expect(view.UNSAFE_getByType(Modal).props.hardwareAccelerated).toBe(true);
    expect(view.getByTestId('native-collection-sort-menu-background').props.colors).toHaveLength(2);
    expect(StyleSheet.flatten(view.getByTestId('native-collection-sort-menu-background').props.style)).toMatchObject({
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
    });
  });

  it('can use the existing full-screen host without creating an Android window', () => {
    const view = render(
      <NativeCollectionSortMenu
        assetBaseUrl="https://pokegonexus.com"
        direction="ascending"
        onClose={jest.fn()}
        onSelect={jest.fn()}
        open
        presentation="inline"
        sort="number"
      />,
    );

    expect(view.UNSAFE_queryByType(Modal)).toBeNull();
    expect(StyleSheet.flatten(view.getByTestId('native-collection-sort-menu').props.style)).toMatchObject({
      bottom: 0,
      elevation: 24,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0,
      zIndex: 2000,
    });
  });

  it('keeps the close control above a real bottom safe-area inset', () => {
    mockSafeAreaInsets = { top: 42, right: 0, bottom: 34, left: 0 };
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const { getByLabelText, getByText } = render(
      <NativeCollectionSortMenu
        assetBaseUrl="https://pokegonexus.com"
        direction="ascending"
        onClose={onClose}
        onSelect={onSelect}
        open
        sort="number"
      />,
    );

    expect(StyleSheet.flatten(getByLabelText('Close sort menu').props.style).bottom).toBe(34);
    fireEvent.press(getByText('NAME'));
    expect(onSelect).toHaveBeenCalledWith('name');
    fireEvent.press(getByLabelText('Close sort menu'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('owns the exact Vite backdrop duration on the native driver', () => {
    mockReduceMotion = false;
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const timing = jest.spyOn(Animated, 'timing');
    const { rerender } = render(
      <NativeCollectionSortMenu
        assetBaseUrl="https://pokegonexus.com"
        direction="ascending"
        onClose={jest.fn()}
        onSelect={jest.fn()}
        open
        sort="number"
        visible
      />,
    );

    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      duration: collectionExperienceParityContract.sortMenuTransitionMs,
      toValue: 1,
      useNativeDriver: true,
    }));

    rerender(
      <NativeCollectionSortMenu
        assetBaseUrl="https://pokegonexus.com"
        direction="ascending"
        onClose={jest.fn()}
        onSelect={jest.fn()}
        open={false}
        sort="number"
        visible
      />,
    );
    expect(timing).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      duration: collectionExperienceParityContract.sortMenuTransitionMs,
      toValue: 0,
      useNativeDriver: true,
    }));
  });
});
