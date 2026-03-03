import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { WebReplicaApp } from '../../../src/screens/WebReplicaApp';

const mockWebViewSpy = jest.fn();

jest.mock('../../../src/config/runtimeConfig', () => ({
  runtimeConfig: {
    api: {
      frontendAppUrl: 'https://pokemongonexus.com',
    },
  },
}));

jest.mock('react-native-webview', () => {
  const ReactLocal = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    WebView: (props: unknown) => {
      mockWebViewSpy(props);
      return ReactLocal.createElement(View, { testID: 'mock-webview' });
    },
  };
});

type MockWebViewProps = {
  source?: { uri?: string };
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: () => void;
  onHttpError?: () => void;
};

const getWebViewProps = (): MockWebViewProps =>
  (mockWebViewSpy.mock.calls.at(-1)?.[0] as MockWebViewProps) ?? {};

describe('WebReplicaApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('loads the pokemon route from configured frontend host', () => {
    render(<WebReplicaApp />);
    const props = getWebViewProps();
    expect(props.source?.uri).toBe('https://pokemongonexus.com/pokemon');
  });

  it('hides loading overlay once load ends', () => {
    render(<WebReplicaApp />);
    expect(screen.getByTestId('web-replica-loading')).toBeTruthy();

    act(() => {
      getWebViewProps().onLoadEnd?.();
    });

    expect(screen.queryByTestId('web-replica-loading')).toBeNull();
  });

  it('hides loading overlay on webview error', () => {
    render(<WebReplicaApp />);
    expect(screen.getByTestId('web-replica-loading')).toBeTruthy();

    act(() => {
      getWebViewProps().onError?.();
    });

    expect(screen.queryByTestId('web-replica-loading')).toBeNull();
  });

  it('falls back from stuck loading after timeout', () => {
    jest.useFakeTimers();
    render(<WebReplicaApp />);

    act(() => {
      getWebViewProps().onLoadStart?.();
      jest.advanceTimersByTime(15001);
    });

    expect(screen.queryByTestId('web-replica-loading')).toBeNull();
  });

  it('does not re-show blocking overlay after initial load completes', () => {
    render(<WebReplicaApp />);

    act(() => {
      getWebViewProps().onLoadEnd?.();
    });

    expect(screen.queryByTestId('web-replica-loading')).toBeNull();

    act(() => {
      getWebViewProps().onLoadStart?.();
    });

    expect(screen.queryByTestId('web-replica-loading')).toBeNull();
  });
});
