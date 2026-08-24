import { AccessibilityInfo, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  NativeHorizontalPageSlider,
  resolveNativeHorizontalPageOffset,
} from '../../../src/components/NativeHorizontalPageSlider';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

describe('NativeHorizontalPageSlider', () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  });

  afterEach(() => jest.restoreAllMocks());

  it('opens on the active page instead of rendering a mismatched tab body', async () => {
    const { getByTestId } = render(
      <NativeHorizontalPageSlider activeIndex={1} onIndexChange={jest.fn()}>
        <Text>Tags panel</Text>
        <Text>Pokémon panel</Text>
        <Text>Wishlist panel</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());
    expect(getByTestId('native-horizontal-page-slider').props.contentOffset).toEqual({
      x: 412,
      y: 0,
    });
  });

  it('lets the native pager report the canonical Tags, Pokémon, and Wishlist page', async () => {
    const onIndexChange = jest.fn();
    const { getByTestId } = render(
      <NativeHorizontalPageSlider activeIndex={0} onIndexChange={onIndexChange}>
        <Text>Tags panel</Text>
        <Text>Pokémon panel</Text>
        <Text>Wishlist panel</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());
    fireEvent(getByTestId('native-horizontal-page-slider'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: 824, y: 0 } },
    });

    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it('resolves native scroll offsets to bounded page indexes', () => {
    expect(resolveNativeHorizontalPageOffset({
      offsetX: 824,
      panelCount: 3,
      width: 412,
    })).toBe(2);
    expect(resolveNativeHorizontalPageOffset({
      offsetX: 410,
      panelCount: 3,
      width: 412,
    })).toBe(1);
    expect(resolveNativeHorizontalPageOffset({
      offsetX: 5000,
      panelCount: 3,
      width: 412,
    })).toBe(2);
  });
});
