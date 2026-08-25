import { fireEvent, render } from '@testing-library/react-native';
import { NativeActionMenuAnchor } from '../../../src/components/NativeActionMenuAnchor';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));

describe('NativeActionMenuAnchor', () => {
  it('uses the canonical transparent Poké Ball control and respects the bottom safe area', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <NativeActionMenuAnchor assetBaseUrl="https://pokegonexus.com" onPress={onPress} />,
    );

    const anchor = getByLabelText('Open action menu');
    expect(anchor.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: 'transparent', borderRadius: 27 }),
      { bottom: 34 },
    ]));
    fireEvent.press(anchor);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
