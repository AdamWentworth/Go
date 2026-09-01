import { useState } from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  NativeCollectionSearchControls,
  NativeCollectionSearchMenu,
} from '../../../../src/features/collection/parity/NativeCollectionSearchControls';

const controls = (query: string, onQueryChange: (value: string) => void) => (
  <NativeCollectionSearchControls
    assetBaseUrl="https://pokegonexus.com"
    inputBackground="#ffffff"
    inputTextColor="#111111"
    menuVisible={false}
    onMenuVisibleChange={jest.fn()}
    onQueryChange={onQueryChange}
    onToggleEvolutionaryLine={jest.fn()}
    query={query}
    showEvolutionaryLine={false}
    textColor="#111111"
  />
);

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

describe('NativeCollectionSearchControls', () => {
  it('keeps the native input immediately responsive while committing its query', () => {
    const Harness = () => {
      const [query, setQuery] = useState('');
      return (
        <>
          {controls(query, setQuery)}
          <Text testID="committed-query">{query}</Text>
        </>
      );
    };
    const { getByLabelText, getByTestId } = render(<Harness />);

    fireEvent.changeText(getByLabelText('Search Pokémon'), 'char');

    expect(getByLabelText('Search Pokémon').props.value).toBe('char');
    expect(getByTestId('committed-query').props.children).toBe('char');
  });

  it('synchronizes route-driven query changes into its local input', () => {
    const onQueryChange = jest.fn();
    const view = render(controls('', onQueryChange));

    view.rerender(controls('Shiny', onQueryChange));

    expect(view.getByLabelText('Search Pokémon').props.value).toBe('Shiny');
    expect(view.getByLabelText('Clear Pokémon search')).toBeTruthy();
  });
});
