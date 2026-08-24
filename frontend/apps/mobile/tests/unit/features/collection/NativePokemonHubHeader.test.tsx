import { Animated, StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  NativePokemonHubHeader,
  resolveNativePokemonHubIndicatorMetrics,
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

  it('moves the underline continuously with the page instead of jumping after navigation', () => {
    const scrollX = new Animated.Value(412);
    const view = render(
      <NativePokemonHubHeader
        activeView="pokemon"
        backgroundColor="#111"
        collectionCount={3285}
        onViewChange={jest.fn()}
        scrollX={scrollX}
        secondaryTextColor="#aaa"
        textColor="#fff"
      />,
    );
    const indicator = view.getByTestId('native-pokemon-hub-indicator');
    const indicatorStyle = StyleSheet.flatten(indicator.props.style);
    expect(indicatorStyle.transform[0].translateX).toBeDefined();

    const halfway = resolveNativePokemonHubIndicatorMetrics(412, 1.5);
    expect(halfway.indicatorTranslateX).toBeCloseTo((392 / 3) * 1.5);
  });
});
