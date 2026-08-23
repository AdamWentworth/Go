import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeInstanceDetailScreen } from '../../../src/screens/NativeInstanceDetailScreen';

const detail = {
  row: {
    id: 'instance-1',
    pokemonId: 6,
    pokedexNumber: 6,
    name: 'Shiny Charizard',
    imageUri: 'https://pokegonexus.com/images/charizard.png',
    status: 'trade' as const,
    cp: 2499,
    favorite: false,
    mostWanted: false,
  },
  traits: ['Shiny'],
  stats: [{ label: 'CP', value: '2,499' }],
  ivs: [{ label: 'Attack', value: 15 }],
  moves: [{ label: 'Fast move', value: 'Fire Spin' }],
  provenance: [],
  preferences: [{ label: 'Friendship', value: '5/5 hearts' }],
};

describe('NativeInstanceDetailScreen', () => {
  it('renders canonical Pokémon details and keeps editing behind the fallback', () => {
    const onEditInCurrentApp = jest.fn();
    render(
      <NativeInstanceDetailScreen
        detail={detail}
        isLoading={false}
        error={null}
        movesWarning={null}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onEditInCurrentApp={onEditInCurrentApp}
      />,
    );

    expect(screen.getByText('Shiny Charizard')).toBeTruthy();
    expect(screen.getByText('Fire Spin')).toBeTruthy();
    expect(screen.getByText('15/15')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Edit in current app' }));
    expect(onEditInCurrentApp).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable missing-instance state', () => {
    const onBack = jest.fn();
    render(
      <NativeInstanceDetailScreen
        detail={null}
        isLoading={false}
        error={null}
        movesWarning={null}
        onRetry={jest.fn()}
        onBack={onBack}
        onEditInCurrentApp={jest.fn()}
      />,
    );

    expect(screen.getByText('This instance was not found.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Back to collection' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
