import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { NativeCollectionSortMenu } from '../../../../src/features/collection/parity/NativeCollectionSortMenu';

let mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock('../../../../src/features/settings/NativeDevicePreferencesProvider', () => ({
  useOptionalNativeDevicePreferences: () => ({ shouldReduceMotion: true }),
}));

jest.mock('../../../../src/features/settings/useNativeColorScheme', () => ({
  useNativeColorScheme: () => 'dark',
}));

describe('NativeCollectionSortMenu', () => {
  beforeEach(() => {
    mockSafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  });

  it('uses a full-parent native gradient through the Android system window', () => {
    const { getByTestId } = render(
      <NativeCollectionSortMenu
        assetBaseUrl="https://pokegonexus.com"
        direction="ascending"
        onClose={jest.fn()}
        onSelect={jest.fn()}
        open
        sort="number"
      />,
    );

    expect(getByTestId('native-collection-sort-menu-background').props.colors).toHaveLength(2);
    expect(StyleSheet.flatten(getByTestId('native-collection-sort-menu-background').props.style)).toMatchObject({
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
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
});
