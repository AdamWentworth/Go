import type { BasePokemon } from '@pokemongonexus/shared-contracts/pokemon';
import { fireEvent, render } from '@testing-library/react-native';
import { NativePokemonSearchFilterSheet } from '../../../../src/features/search/NativePokemonSearchFilterSheet';
import { createNativePokemonSearchDraft } from '../../../../src/features/search/nativePokemonSearchDraft';

jest.mock('../../../../src/services/locationApi', () => ({
  getNativeLocationSuggestions: jest.fn().mockResolvedValue([]),
}));

const pikachu = {
  pokemon_id: 25,
  pokedex_number: 25,
  name: 'Pikachu',
  form: null,
  image_url: 'https://assets/pikachu.png',
  image_url_shiny: 'https://assets/shiny-pikachu.png',
  image_url_shadow: 'https://assets/shadow-pikachu.png',
  image_url_shiny_shadow: 'https://assets/shiny-shadow-pikachu.png',
  type_1_icon: '',
  type_2_icon: '',
  costumes: [{ costume_id: 8, name: 'Detective' }],
  backgrounds: [],
  moves: [],
  fusion: [],
  megaEvolutions: [],
  evolves_from: [],
  max: [{ dynamax: true }, { gigantamax: true }],
} as unknown as BasePokemon;

const baseProps = {
  assetBaseUrl: 'https://pokegonexus.com',
  catalog: [pikachu],
  draft: {
    ...createNativePokemonSearchDraft({
      city: 'Burnaby, British Columbia, Canada',
      latitude: 49.24,
      longitude: -122.98,
    }),
    pokemonId: 25,
    pokemonName: 'Pikachu',
  },
  onApply: jest.fn(),
  onChange: jest.fn(),
  onClose: jest.fn(),
  onNotice: jest.fn(),
  onReset: jest.fn(),
  visible: true,
};

describe('NativePokemonSearchFilterSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('keeps the canonical three-stage filter workflow and sticky apply action', () => {
    const view = render(<NativePokemonSearchFilterSheet {...baseProps} />);
    expect(view.getByRole('tab', { name: 'Pokémon' }).props.accessibilityState)
      .toEqual({ selected: true });
    expect(view.getByText('Choose the exact variant')).toBeTruthy();
    fireEvent.press(view.getByRole('tab', { name: 'Location' }));
    expect(view.getByText('Where should we look?')).toBeTruthy();
    fireEvent.press(view.getByText(/Apply & search/));
    expect(baseProps.onApply).toHaveBeenCalledTimes(1);
  });

  it('uses a contained native picker rather than a platform dropdown', () => {
    const view = render(<NativePokemonSearchFilterSheet {...baseProps} />);
    fireEvent.press(view.getByRole('button', { name: 'Choose Pokémon' }));
    expect(view.getByTestId('native-option-picker')).toBeTruthy();
    expect(view.getByLabelText('Search Choose a Pokémon')).toBeTruthy();
    expect(view.getByText('#0025')).toBeTruthy();
  });

  it('supports five-heart remote trade matching without coupling it to lucky trades', () => {
    const draft = {
      ...baseProps.draft,
      ownership: 'wanted' as const,
      friendshipLevel: 5,
      prefLucky: false,
    };
    const view = render(
      <NativePokemonSearchFilterSheet
        {...baseProps}
        draft={draft}
        initialSection="matching"
      />,
    );
    expect(view.getByText('Remote trade eligible')).toBeTruthy();
    expect(view.getByLabelText('Lucky trade preferred').props.value).toBe(false);
    fireEvent.press(view.getByLabelText('4 hearts'));
    expect(baseProps.onChange).toHaveBeenCalledWith(expect.objectContaining({
      friendshipLevel: 4,
      prefLucky: false,
    }));
  });
});
