import { fireEvent, render } from '@testing-library/react-native';
import { NativeTrainerWorkspaceNav } from '../../../src/components/NativeTrainerWorkspaceNav';

describe('NativeTrainerWorkspaceNav', () => {
  it('keeps the current workspace selected and opens the adjacent workspace', () => {
    const onOpenFriends = jest.fn();
    const onOpenProfile = jest.fn();
    const view = render(
      <NativeTrainerWorkspaceNav
        active="profile"
        onOpenFriends={onOpenFriends}
        onOpenProfile={onOpenProfile}
      />,
    );
    expect(view.getByRole('tab', { name: 'Profile' }).props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true }),
    );
    fireEvent.press(view.getByRole('tab', { name: 'Profile' }));
    expect(onOpenProfile).not.toHaveBeenCalled();
    fireEvent.press(view.getByRole('tab', { name: 'Friends' }));
    expect(onOpenFriends).toHaveBeenCalledTimes(1);
  });
});
