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
      draft={draft}
      onBack={jest.fn()}
      onChange={jest.fn()}
      onOpenAccount={jest.fn()}
      onRetry={jest.fn()}
      onSaveCoordination={jest.fn()}
      onSavePrivacy={jest.fn()}
      {...props}
    />
  </SafeAreaProvider>,
);

describe('NativeTrainerSettingsScreen', () => {
  it('renders the canonical privacy and coordination hierarchy', () => {
    const view = renderScreen();
    expect(view.getByText('Privacy')).toBeTruthy();
    expect(view.getByText('Trade coordination')).toBeTruthy();
    expect(view.getByText('Pokémon GO Nexus does not provide messaging. Choose how an accepted trade partner can connect with you.')).toBeTruthy();
    expect(view.getByRole('tab', { name: 'Settings' }).props.accessibilityState.selected).toBe(true);
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
});
