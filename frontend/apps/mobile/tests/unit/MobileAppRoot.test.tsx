import { fireEvent, render, screen } from '@testing-library/react-native';
import { MobileAppRoot } from '../../src/MobileAppRoot';

jest.mock('../../src/screens/WebReplicaApp', () => {
  const ReactLocal = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    WebReplicaApp: () =>
      ReactLocal.createElement(Text, { testID: 'web-experience' }, 'Web'),
  };
});

describe('MobileAppRoot', () => {
  it('keeps the existing WebView experience as the default', () => {
    render(<MobileAppRoot experienceMode="webview" />);
    expect(screen.getByTestId('web-experience')).toBeTruthy();
    expect(screen.queryByTestId('native-migration-preview')).toBeNull();
  });

  it('lets a native preview return directly to the stable WebView', () => {
    render(<MobileAppRoot experienceMode="native-preview" />);

    expect(screen.getByTestId('native-migration-preview')).toBeTruthy();
    fireEvent.press(screen.getByText('Open current app'));
    expect(screen.getByTestId('web-experience')).toBeTruthy();
  });

  it('exposes native sign in only when the routed preview provides it', () => {
    const onOpenNativeExperience = jest.fn();
    render(
      <MobileAppRoot
        experienceMode="native-preview"
        onOpenNativeExperience={onOpenNativeExperience}
      />,
    );

    fireEvent.press(screen.getByText('Try native sign in'));
    expect(onOpenNativeExperience).toHaveBeenCalledTimes(1);
  });
});
