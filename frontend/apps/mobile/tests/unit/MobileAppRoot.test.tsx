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
    expect(screen.queryByTestId('native-parity-lab')).toBeNull();
  });

  it('keeps unfinished native workflows inside an explicit parity lab', () => {
    render(<MobileAppRoot experienceMode="native-preview" />);

    expect(screen.getByTestId('native-parity-lab')).toBeTruthy();
    expect(screen.queryByText('Try native sign in')).toBeNull();
    expect(screen.queryByText('Your collection')).toBeNull();
  });

  it('opens the functional native collection slice from the parity lab', () => {
    const onOpenCollectionParityCandidate = jest.fn();
    render(
      <MobileAppRoot
        experienceMode="native-preview"
        onOpenCollectionParityCandidate={onOpenCollectionParityCandidate}
      />,
    );

    fireEvent.press(screen.getByText('Review native collection'));
    expect(onOpenCollectionParityCandidate).toHaveBeenCalledTimes(1);
  });

  it('lets the parity lab return directly to the canonical app', () => {
    render(<MobileAppRoot experienceMode="native-preview" />);

    fireEvent.press(screen.getByText('Open canonical app'));
    expect(screen.getByTestId('web-experience')).toBeTruthy();
    expect(screen.queryByTestId('native-parity-lab')).toBeNull();
  });
});
