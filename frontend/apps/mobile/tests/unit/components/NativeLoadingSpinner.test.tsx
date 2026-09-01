import { render } from '@testing-library/react-native';
import { Animated, StyleSheet } from 'react-native';
import {
  NativeLoadingSpinner,
  NATIVE_LOADING_SPINNER_DURATION_MS,
  resolveNativeLoadingSpinnerPhase,
} from '../../../src/components/NativeLoadingSpinner';

describe('NativeLoadingSpinner', () => {
  it('plays the canonical 36-frame loop on the native driver without blocking interactions', () => {
    const loop = jest.spyOn(Animated, 'loop');
    const timing = jest.spyOn(Animated, 'timing');
    const view = render(<NativeLoadingSpinner light={false} />);

    expect(timing).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        duration: NATIVE_LOADING_SPINNER_DURATION_MS,
        isInteraction: false,
        useNativeDriver: true,
      }),
    );
    expect(loop).toHaveBeenCalledWith(
      expect.anything(),
      { resetBeforeIteration: true },
    );
    expect(StyleSheet.flatten(view.getByTestId('native-loading-spinner-dark', { includeHiddenElements: true }).props.style)).toMatchObject({
      height: 100,
      width: 1800,
    });

    view.unmount();
    timing.mockRestore();
    loop.mockRestore();
  });

  it('selects the light sprite without changing its geometry', () => {
    const view = render(<NativeLoadingSpinner light />);
    expect(StyleSheet.flatten(view.getByTestId('native-loading-spinner-light', { includeHiddenElements: true }).props.style)).toMatchObject({
      height: 100,
      width: 1800,
    });
    view.unmount();
  });

  it('keeps every spinner instance on the same 1.2-second animation clock', () => {
    expect(resolveNativeLoadingSpinnerPhase(0)).toBe(0);
    expect(resolveNativeLoadingSpinnerPhase(600)).toBeCloseTo(0.5);
    expect(resolveNativeLoadingSpinnerPhase(1200)).toBe(0);
    expect(resolveNativeLoadingSpinnerPhase(1500)).toBeCloseTo(0.25);
  });
});
