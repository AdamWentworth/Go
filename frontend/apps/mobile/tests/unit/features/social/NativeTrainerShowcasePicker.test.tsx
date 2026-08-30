import { fireEvent, render } from '@testing-library/react-native';
import type { NativeCollectionRow } from '../../../../src/features/collection/collectionModel';
import { NativeTrainerShowcasePicker } from '../../../../src/features/social/NativeTrainerShowcasePicker';

const row = (id: string, name: string, pokedexNumber: number): NativeCollectionRow => ({
  id,
  pokemonId: pokedexNumber,
  pokedexNumber,
  name,
  imageUri: `https://pokegonexus.com/images/${id}.png`,
  locationBackgroundUri: null,
  maxKind: null,
  purified: false,
  lucky: false,
  typeIconUris: [],
  status: 'caught',
  source: 'instance',
  cp: 2500,
  favorite: false,
  mostWanted: false,
});

describe('NativeTrainerShowcasePicker', () => {
  it('searches candidates, prevents duplicates, and exposes clear and close actions', () => {
    const onClear = jest.fn();
    const onClose = jest.fn();
    const onSelect = jest.fn();
    const view = render(
      <NativeTrainerShowcasePicker
        assetBaseUrl="https://pokegonexus.com"
        candidates={[
          row('charizard', 'Shiny Charizard', 6),
          row('suicune', 'Shiny Suicune', 245),
          row('metagross', 'Shiny Metagross', 376),
        ]}
        onClear={onClear}
        onClose={onClose}
        onSelect={onSelect}
        selectedIds={['charizard', 'suicune']}
        slotIndex={0}
        visible
      />,
    );

    expect(view.getByTestId('native-trainer-showcase-picker').props.edges).toMatchObject({
      bottom: 'additive',
      top: 'additive',
    });
    expect(view.getByRole('button', { name: 'Shiny Charizard, selected in this slot' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Shiny Suicune, already featured' }).props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(view.getByLabelText('Search caught Pokémon'), 'meta');
    expect(view.queryByText('Shiny Suicune')).toBeNull();
    fireEvent.press(view.getByRole('button', { name: 'Shiny Metagross' }));
    expect(onSelect).toHaveBeenCalledWith('metagross');
    fireEvent.press(view.getByRole('button', { name: 'Clear slot' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    fireEvent.press(view.getByRole('button', { name: 'Close showcase picker' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
