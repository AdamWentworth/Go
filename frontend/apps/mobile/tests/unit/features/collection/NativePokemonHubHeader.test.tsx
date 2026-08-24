import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  NativePokemonHubHeader,
  type NativePokemonHubView,
} from '../../../../src/features/collection/NativePokemonHubHeader';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 412, height: 915, scale: 2.625, fontScale: 1 }),
}));

const renderHeader = (
  activeView: NativePokemonHubView,
  onViewChange = jest.fn(),
) => render(
  <NativePokemonHubHeader
    activeView={activeView}
    backgroundColor="#111"
    collectionCount={3285}
    onViewChange={onViewChange}
    secondaryTextColor="#abbbb8"
    textColor="#fff"
  />,
);

describe('NativePokemonHubHeader', () => {
  it('uses one persistent indicator that moves between the three canonical tabs', () => {
    const view = renderHeader('inventory');
    const firstIndicator = view.getByTestId('native-pokemon-hub-indicator');
    const firstStyle = StyleSheet.flatten(firstIndicator.props.style);

    expect(firstStyle.transform).toEqual([{ translateX: 0 }]);

    view.rerender(
      <NativePokemonHubHeader
        activeView="wishlist"
        backgroundColor="#111"
        collectionCount={3285}
        onViewChange={jest.fn()}
        secondaryTextColor="#abbbb8"
        textColor="#fff"
      />,
    );

    const lastIndicator = view.getByTestId('native-pokemon-hub-indicator');
    const lastStyle = StyleSheet.flatten(lastIndicator.props.style);
    expect(view.getAllByTestId('native-pokemon-hub-indicator')).toHaveLength(1);
    expect(lastStyle.transform[0].translateX).toBeCloseTo((392 / 3) * 2);
  });

  it('routes tab presses through the shared page controller', () => {
    const onViewChange = jest.fn();
    const view = renderHeader('pokemon', onViewChange);

    fireEvent.press(view.getByRole('tab', { name: /wishlist/i }));

    expect(onViewChange).toHaveBeenCalledWith('wishlist');
  });
});
