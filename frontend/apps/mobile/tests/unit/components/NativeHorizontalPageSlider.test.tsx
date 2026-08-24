import { Animated, AccessibilityInfo, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import {
  NativeHorizontalPageSlider,
  resolveNativeHorizontalPageSwipe,
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

  it('animates between the canonical Tags, Pokémon, and Wishlist positions', async () => {
    const start = jest.fn();
    const timing = jest.spyOn(Animated, 'timing').mockReturnValue({ start } as never);
    const { rerender } = render(
      <NativeHorizontalPageSlider activeIndex={0} onIndexChange={jest.fn()}>
        <Text>Tags panel</Text>
        <Text>Pokémon panel</Text>
        <Text>Wishlist panel</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());
    rerender(
      <NativeHorizontalPageSlider activeIndex={2} onIndexChange={jest.fn()}>
        <Text>Tags panel</Text>
        <Text>Pokémon panel</Text>
        <Text>Wishlist panel</Text>
      </NativeHorizontalPageSlider>,
    );

    expect(timing).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        toValue: -824,
        duration: 300,
        useNativeDriver: true,
      }),
    );
    expect(start).toHaveBeenCalled();
  });

  it('turns a horizontal swipe into exactly one adjacent page change', () => {
    expect(resolveNativeHorizontalPageSwipe({
      currentIndex: 1,
      distanceX: -110,
      panelCount: 3,
      velocityX: -0.7,
      width: 412,
    })).toBe(2);
    expect(resolveNativeHorizontalPageSwipe({
      currentIndex: 1,
      distanceX: 110,
      panelCount: 3,
      velocityX: 0.7,
      width: 412,
    })).toBe(0);
    expect(resolveNativeHorizontalPageSwipe({
      currentIndex: 1,
      distanceX: 18,
      panelCount: 3,
      velocityX: 0.1,
      width: 412,
    })).toBe(1);
  });
});
