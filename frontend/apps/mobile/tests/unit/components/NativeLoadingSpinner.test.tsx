import { act, render } from '@testing-library/react-native';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  NativeLoadingSpinner,
  type NativeLoadingSpinnerHandle,
  NATIVE_LOADING_SPINNER_DURATION_MS,
  NATIVE_LOADING_SPINNER_SOURCES,
} from '../../../src/components/NativeLoadingSpinner';

const readGifFrameDelays = (fileName: string): number[] => {
  const bytes = readFileSync(path.resolve(__dirname, `../../../assets/${fileName}`));
  const delays: number[] = [];
  for (let index = 0; index < bytes.length - 7; index += 1) {
    if (bytes[index] !== 0x21 || bytes[index + 1] !== 0xf9 || bytes[index + 2] !== 0x04) {
      continue;
    }
    delays.push(bytes[index + 4] | (bytes[index + 5] << 8));
  }
  return delays;
};

describe('NativeLoadingSpinner', () => {
  it('plays the compact native-decoded canonical animation', () => {
    const view = render(<NativeLoadingSpinner light={false} />);

    const strip = view.getByTestId('native-loading-spinner-dark', { includeHiddenElements: true });
    expect(StyleSheet.flatten(strip.props.style)).toMatchObject({
      height: 50,
      width: 50,
    });
    expect(strip.props.source).toBe(NATIVE_LOADING_SPINNER_SOURCES[0]);

    view.unmount();
  });

  it('selects the light sprite without changing its geometry', () => {
    const view = render(<NativeLoadingSpinner light />);
    const spinner = view.getByTestId('native-loading-spinner-light', { includeHiddenElements: true });
    expect(StyleSheet.flatten(spinner.props.style)).toMatchObject({ height: 50, width: 50 });
    expect(spinner.props.source).toBe(NATIVE_LOADING_SPINNER_SOURCES[1]);
    view.unmount();
  });

  it('mounts and releases the native animation through its imperative handle', () => {
    const ref = createRef<NativeLoadingSpinnerHandle>();
    const view = render(<NativeLoadingSpinner autoStart={false} light={false} ref={ref} />);
    expect(view.queryByTestId('native-loading-spinner-dark', { includeHiddenElements: true })).toBeNull();
    act(() => ref.current?.start());
    expect(view.getByTestId('native-loading-spinner-dark', { includeHiddenElements: true })).toBeTruthy();
    act(() => ref.current?.stop());
    expect(view.queryByTestId('native-loading-spinner-dark', { includeHiddenElements: true })).toBeNull();
    view.unmount();
  });

  it('ships 72 native-decoded frames on the canonical 1.2-second loop', () => {
    for (const fileName of ['loading-spinner-dark.gif', 'loading-spinner-light.gif']) {
      const centisecondDelays = readGifFrameDelays(fileName);
      expect(centisecondDelays).toHaveLength(72);
      expect(centisecondDelays.reduce((total, delay) => total + delay, 0) * 10)
        .toBe(NATIVE_LOADING_SPINNER_DURATION_MS);
    }
  });
});
