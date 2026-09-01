import { fireEvent, render } from '@testing-library/react-native';
import { NativeCollectionSearchMenu } from '../../../../src/features/collection/parity/NativeCollectionSearchControls';

describe('NativeCollectionSearchMenu', () => {
  it('exposes filter tiles as real native controls and reports the selected filter', () => {
    const onFilterPress = jest.fn();
    const { getByTestId } = render(
      <NativeCollectionSearchMenu
        assetBaseUrl="https://pokegonexus.com"
        onFilterPress={onFilterPress}
        textColor="#ffffff"
      />,
    );

    expect(getByTestId('native-region-gradient-kanto')).toBeTruthy();
    fireEvent.press(getByTestId('native-collection-filter-shiny'));
    expect(onFilterPress).toHaveBeenCalledWith('Shiny');
  });
});
