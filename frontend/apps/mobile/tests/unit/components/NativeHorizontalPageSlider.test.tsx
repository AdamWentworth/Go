import { AccessibilityInfo, Animated, Text } from 'react-native';
import { createRef } from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import {
  NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
  NativeHorizontalPageSlider,
  type NativeHorizontalPageSliderHandle,
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
    const { getByTestId, queryByText } = render(
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
    expect(queryByText('Tags panel')).toBeNull();
    expect(queryByText('Pokémon panel')).toBeTruthy();
    expect(queryByText('Wishlist panel')).toBeNull();
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

  it('publishes native drag progress for the coordinated header underline', async () => {
    const scrollX = new Animated.Value(412);
    const { getByTestId } = render(
      <NativeHorizontalPageSlider
        activeIndex={1}
        onIndexChange={jest.fn()}
        scrollX={scrollX}
      >
        <Text>Tags panel</Text>
        <Text>Pokémon panel</Text>
        <Text>Wishlist panel</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());
    const slider = getByTestId('native-horizontal-page-slider');
    expect(typeof slider.props.onScroll).toBe('function');
    expect(slider.props.scrollEventThrottle).toBe(16);
    expect(slider.props.pagingEnabled).toBe(true);
    expect(slider.props.scrollEnabled).toBe(false);
    expect(slider.props.keyboardShouldPersistTaps).toBe('always');
  });

  it('keeps inactive pages out of touch and accessibility navigation', async () => {
    const { getByTestId } = render(
      <NativeHorizontalPageSlider activeIndex={1} onIndexChange={jest.fn()}>
        <Text>Friends panel</Text>
        <Text>Find panel</Text>
        <Text>Blocked panel</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());

    expect(getByTestId('native-horizontal-page-0', { includeHiddenElements: true }).props).toEqual(
      expect.objectContaining({
        accessibilityElementsHidden: true,
        'aria-hidden': true,
        importantForAccessibility: 'no-hide-descendants',
        pointerEvents: 'none',
      }),
    );
    expect(getByTestId('native-horizontal-page-1').props).toEqual(
      expect.objectContaining({
        accessibilityElementsHidden: false,
        'aria-hidden': false,
        importantForAccessibility: 'auto',
        pointerEvents: 'auto',
      }),
    );
    expect(getByTestId('native-horizontal-page-2', { includeHiddenElements: true }).props).toEqual(
      expect.objectContaining({
        accessibilityElementsHidden: true,
        'aria-hidden': true,
        importantForAccessibility: 'no-hide-descendants',
        pointerEvents: 'none',
      }),
    );
  });

  it('synchronizes shared header progress when a tab changes the page programmatically', async () => {
    const scrollX = new Animated.Value(0);
    const timing = jest.spyOn(Animated, 'timing');
    const ref = createRef<NativeHorizontalPageSliderHandle>();
    render(
      <NativeHorizontalPageSlider
        activeIndex={0}
        onIndexChange={jest.fn()}
        ref={ref}
        scrollX={scrollX}
      >
        <Text>Trade Preferences</Text>
        <Text>Trade Activity</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());
    act(() => ref.current?.setPage(1));
    expect(timing).toHaveBeenCalledWith(scrollX, expect.objectContaining({
      duration: NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
      toValue: 412,
      useNativeDriver: true,
    }));
    act(() => ref.current?.setPage(0));
    expect(timing).toHaveBeenLastCalledWith(scrollX, expect.objectContaining({
      duration: NATIVE_HORIZONTAL_PAGE_TRANSITION_MS,
      toValue: 0,
      useNativeDriver: true,
    }));
  });

  it('updates the shared indicator immediately when reduced motion disables the page animation', async () => {
    const scrollX = new Animated.Value(0);
    const setValue = jest.spyOn(scrollX, 'setValue');
    const ref = createRef<NativeHorizontalPageSliderHandle>();
    render(
      <NativeHorizontalPageSlider
        activeIndex={0}
        onIndexChange={jest.fn()}
        ref={ref}
        scrollX={scrollX}
      >
        <Text>Tags</Text>
        <Text>Pokémon</Text>
      </NativeHorizontalPageSlider>,
    );

    await act(async () => Promise.resolve());
    act(() => ref.current?.setPage(1, false));
    expect(setValue).toHaveBeenLastCalledWith(412);
  });
});
