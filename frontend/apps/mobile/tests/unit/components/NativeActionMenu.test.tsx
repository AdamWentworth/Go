import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { NativeActionMenu } from '../../../src/components/NativeActionMenu';

const mockToggleColorTheme = jest.fn();

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('../../../src/features/settings/NativeDevicePreferencesProvider', () => ({
  useOptionalNativeDevicePreferences: () => ({ toggleColorTheme: mockToggleColorTheme }),
}));

describe('NativeActionMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the same nine primary destinations as the canonical action menu', () => {
    const { getByLabelText } = render(
      <NativeActionMenu
        assetBaseUrl="https://pokegonexus.com"
        onClose={jest.fn()}
        onNavigate={jest.fn()}
        visible
      />,
    );

    for (const label of [
      'Raid', 'Pokédex', 'PvP',
      'Search', 'Home', 'Trades',
      'Pokémon', 'Max Battles', 'Rankings',
    ]) {
      expect(getByLabelText(label)).toBeTruthy();
    }
  });

  it('routes corner actions and closes without falling through to another control', () => {
    const onClose = jest.fn();
    const onNavigate = jest.fn();
    const { getByLabelText } = render(
      <NativeActionMenu
        assetBaseUrl="https://pokegonexus.com"
        onClose={onClose}
        onNavigate={onNavigate}
        visible
      />,
    );

    fireEvent.press(getByLabelText('Share Trade Board'));
    expect(onNavigate).toHaveBeenCalledWith('/trade-board');

    fireEvent.press(getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens support links in place and preserves the canonical theme control', () => {
    const onNavigate = jest.fn();
    const { getByLabelText, getByText } = render(
      <NativeActionMenu
        assetBaseUrl="https://pokegonexus.com"
        onClose={jest.fn()}
        onNavigate={onNavigate}
        visible
      />,
    );

    fireEvent.press(getByLabelText('Learn and support'));
    fireEvent.press(getByText('FAQ'));
    expect(onNavigate).toHaveBeenCalledWith('/faq');

    fireEvent.press(getByLabelText(/Use .* theme/));
    expect(mockToggleColorTheme).toHaveBeenCalledTimes(1);
  });

  it('starts destinations below the viewport and animates them into the radial grid', () => {
    const { getByTestId } = render(
      <NativeActionMenu
        assetBaseUrl="https://pokegonexus.com"
        onClose={jest.fn()}
        onNavigate={jest.fn()}
        visible
      />,
    );

    expect(getByTestId('native-action-menu-destination-home')).toBeTruthy();
    act(() => jest.runAllTimers());
    expect(getByTestId('native-action-menu-destination-pokemon')).toBeTruthy();
  });

  it('keeps the bottom corner actions clear of the centered close control', () => {
    const { getByLabelText } = render(
      <NativeActionMenu
        assetBaseUrl="https://pokegonexus.com"
        onClose={jest.fn()}
        onNavigate={jest.fn()}
        visible
      />,
    );

    expect(StyleSheet.flatten(getByLabelText('Profile').props.style).maxWidth).toBe(142);
    expect(StyleSheet.flatten(getByLabelText('Learn and support').props.style).maxWidth).toBe(142);
  });
});
