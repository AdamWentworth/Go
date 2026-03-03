import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
  onError?: (event: { nativeEvent: { description?: string; code?: number } }) => void;
  onHttpError?: (event: { nativeEvent: { statusCode: number; description?: string } }) => void;
  onMessage?: (event: { nativeEvent: { data: string } }) => void;
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

  it('falls back to root route when pokemon route fails to load', () => {
    render(<WebReplicaApp />);
    expect(screen.getByTestId('web-replica-loading')).toBeTruthy();

    act(() => {
      getWebViewProps().onError?.({
        nativeEvent: { description: 'network error', code: -1 },
      });
    });

    expect(getWebViewProps().source?.uri).toBe('https://pokemongonexus.com/');
  });

  it('shows error panel when both pokemon and root routes fail', () => {
    render(<WebReplicaApp />);

    act(() => {
      getWebViewProps().onError?.({
        nativeEvent: { description: 'pokemon route failed', code: -1 },
      });
    });

    act(() => {
      getWebViewProps().onHttpError?.({
        nativeEvent: { statusCode: 500, description: 'server error' },
      });
    });

    expect(screen.getByTestId('web-replica-error')).toBeTruthy();
  });

  it('promotes repeated hydrate_failed diagnostics to a visible load error', () => {
    render(<WebReplicaApp />);

    act(() => {
      getWebViewProps().onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            __mobile_diag__: true,
            type: 'hydrate_failed',
            payload: { checks: 12, children: 0 },
          }),
        },
      });
    });

    expect(getWebViewProps().source?.uri).toBe('https://pokemongonexus.com/');

    act(() => {
      getWebViewProps().onMessage?.({
        nativeEvent: {
          data: JSON.stringify({
            __mobile_diag__: true,
            type: 'hydrate_failed',
            payload: { checks: 12, children: 0 },
          }),
        },
      });
    });

    expect(screen.getByTestId('web-replica-error')).toBeTruthy();
  });

  it('retry from error state returns to pokemon route', () => {
    render(<WebReplicaApp />);

    act(() => {
      getWebViewProps().onError?.({
        nativeEvent: { description: 'pokemon route failed', code: -1 },
      });
    });

    act(() => {
      getWebViewProps().onHttpError?.({
        nativeEvent: { statusCode: 500, description: 'server error' },
      });
    });

    act(() => {
      fireEvent.press(screen.getByText('Retry'));
    });

    expect(getWebViewProps().source?.uri).toBe('https://pokemongonexus.com/pokemon');
  });

  it('falls back from stuck loading after timeout', () => {
    jest.useFakeTimers();
    render(<WebReplicaApp />);

    act(() => {
      jest.advanceTimersByTime(15001);
    });

    expect(getWebViewProps().source?.uri).toBe('https://pokemongonexus.com/');
  });

  it('shows error overlay after repeated timeout and exposes recovery actions', () => {
    jest.useFakeTimers();
    render(<WebReplicaApp />);

    act(() => {
      jest.advanceTimersByTime(15001);
    });

    act(() => {
      jest.advanceTimersByTime(15001);
    });

    expect(screen.getByTestId('web-replica-error')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    expect(screen.getByText('Open in Browser')).toBeTruthy();
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
