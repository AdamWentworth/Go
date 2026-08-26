import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeTrainerSettingsScreen } from '../../../src/screens/NativeTrainerSettingsScreen';
import type { NativeTrainerPreferencesDraft } from '../../../src/features/social/nativeTrainerPreferencesModel';

const draft: NativeTrainerPreferencesDraft = {
  collectionVisibility: 'friends',
  coordinationHandle: 'MistyTrades',
  coordinationMethod: 'discord',
  friendRequestPermission: 'everyone',
  profileVisibility: 'public',
  shareTradeContact: true,
  showLocation: false,
  showPokemonGoName: true,
  trainerCodeVisibility: 'friends',
};

const renderScreen = (props: Partial<React.ComponentProps<typeof NativeTrainerSettingsScreen>> = {}) => render(
  <SafeAreaProvider initialMetrics={{
    frame: { x: 0, y: 0, width: 412, height: 915 },
    insets: { top: 24, right: 0, bottom: 20, left: 0 },
  }}>
    <NativeTrainerSettingsScreen
      colorTheme="dark"
      draft={draft}
      onBack={jest.fn()}
      onChange={jest.fn()}
      onChangeColorTheme={jest.fn()}
      onChangeReduceMotion={jest.fn()}
      onOpenAccount={jest.fn()}
      onRetry={jest.fn()}
      onRetrySync={jest.fn()}
      onSaveCoordination={jest.fn()}
      onSavePrivacy={jest.fn()}
      reduceMotion={false}
      syncSummary={{ canRetry: true, detail: 'No collection changes are waiting on this device.', title: 'Up to date' }}
      {...props}
    />
  </SafeAreaProvider>,
);

describe('NativeTrainerSettingsScreen', () => {
  it('renders the canonical privacy and coordination hierarchy', () => {
    const view = renderScreen();
    expect(view.getByText('Privacy')).toBeTruthy();
    expect(view.getByText('Trade coordination')).toBeTruthy();
    expect(view.getByText('Display')).toBeTruthy();
    expect(view.getByText('Pokémon synchronization')).toBeTruthy();
    expect(view.getByText('Pokémon Go Nexus does not provide messaging. Choose how an accepted trade partner can connect with you.')).toBeTruthy();
    expect(view.getByRole('tab', { name: 'Settings' }).props.accessibilityState.selected).toBe(true);
  });

  it('updates device display settings and retries collection synchronization', () => {
    const onChangeColorTheme = jest.fn();
    const onChangeReduceMotion = jest.fn();
    const onRetrySync = jest.fn();
    const view = renderScreen({ onChangeColorTheme, onChangeReduceMotion, onRetrySync });
    fireEvent.press(view.getByRole('button', { name: 'Color theme, Dark' }));
    fireEvent.press(view.getByRole('radio', { name: 'Light' }));
    expect(onChangeColorTheme).toHaveBeenCalledWith('light');
    fireEvent(view.getByLabelText('Reduce motion'), 'valueChange', true);
    expect(onChangeReduceMotion).toHaveBeenCalledWith(true);
    fireEvent.press(view.getByRole('button', { name: 'Retry now' }));
    expect(onRetrySync).toHaveBeenCalledTimes(1);
  });

  it('updates picker, toggle, handle, and save commands explicitly', () => {
    const onChange = jest.fn();
    const onSavePrivacy = jest.fn();
    const onSaveCoordination = jest.fn();
    const view = renderScreen({ onChange, onSaveCoordination, onSavePrivacy });

    fireEvent.press(view.getByRole('button', { name: 'Profile visibility, Everyone' }));
    fireEvent.press(view.getByRole('radio', { name: 'Friends only' }));
    expect(onChange).toHaveBeenCalledWith({ ...draft, profileVisibility: 'friends' });
    fireEvent(view.getByLabelText('Show profile location'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith({ ...draft, showLocation: true });
    fireEvent.changeText(view.getByLabelText('Coordination handle'), 'UpdatedTrainer');
    expect(onChange).toHaveBeenCalledWith({ ...draft, coordinationHandle: 'UpdatedTrainer' });
    fireEvent.press(view.getByRole('button', { name: 'Save privacy' }));
    fireEvent.press(view.getByRole('button', { name: 'Save coordination' }));
    expect(onSavePrivacy).toHaveBeenCalledTimes(1);
    expect(onSaveCoordination).toHaveBeenCalledTimes(1);
  });

  it('surfaces retryable loading and error states', () => {
    const retry = jest.fn();
    const view = renderScreen({ draft: null, error: 'Settings are unavailable.', isLoading: true, onRetry: retry });
    expect(view.getByText('Loading settings…')).toBeTruthy();
    expect(view.getByText('Settings are unavailable.')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('keeps command feedback visible and dismissible independently of scroll position', () => {
    const onDismissFeedback = jest.fn();
    const view = renderScreen({
      feedback: { tone: 'success', text: 'Trade coordination settings saved.' },
      onDismissFeedback,
    });
    expect(view.getByText('Trade coordination settings saved.')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Dismiss message' }));
    expect(onDismissFeedback).toHaveBeenCalledTimes(1);
  });
});
