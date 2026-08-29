import { fireEvent, render } from '@testing-library/react-native';
import { Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
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
    syncSummary={{ canRetry: true, detail: 'No pending changes.', title: 'Up to date' }}
    {...props}
  />,
);

describe('NativeTrainerSettingsScreen', () => {
  it('clears text focus while scrolling and before saving coordination settings', () => {
    const dismissKeyboard = jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    const onSaveCoordination = jest.fn();
    const view = renderScreen({ onSaveCoordination });

    expect(view.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(
      Platform.OS === 'ios' ? 'padding' : 'height',
    );
    expect(view.getByTestId('native-trainer-settings-content').props.keyboardDismissMode).toBe('on-drag');

    fireEvent(view.getByTestId('native-trainer-settings-content'), 'scrollBeginDrag');
    fireEvent.press(view.getByRole('button', { name: 'Save coordination' }));

    expect(dismissKeyboard).toHaveBeenCalledTimes(2);
    expect(onSaveCoordination).toHaveBeenCalledTimes(1);
    dismissKeyboard.mockRestore();
  });
});
