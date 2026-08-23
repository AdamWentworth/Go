import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeCollectionScreen } from '../../../src/screens/NativeCollectionScreen';

const row = {
  id: 'instance-1',
  pokemonId: 6,
  pokedexNumber: 6,
  name: 'Shiny Charizard',
  imageUri: 'https://pokegonexus.com/images/charizard.png',
  status: 'trade' as const,
  cp: 2499,
  favorite: false,
  mostWanted: false,
};

describe('NativeCollectionScreen', () => {
  it('renders a virtualized read-only collection and exposes filter controls', () => {
    const onFilterChange = jest.fn();
    const onOpenInstance = jest.fn();
    const onOpenCurrentApp = jest.fn();
    render(
      <NativeCollectionScreen
        rows={[row]}
        filter="all"
        query=""
        isLoading={false}
        error={null}
        onFilterChange={onFilterChange}
        onQueryChange={jest.fn()}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onOpenInstance={onOpenInstance}
        onOpenCurrentApp={onOpenCurrentApp}
      />,
    );

    expect(screen.getByText('Shiny Charizard')).toBeTruthy();
    expect(screen.getByText('For trade')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Open Shiny Charizard' }));
    expect(onOpenInstance).toHaveBeenCalledWith('instance-1');
    fireEvent.press(screen.getByRole('tab', { name: 'Wanted' }));
    expect(onFilterChange).toHaveBeenCalledWith('wanted');
    fireEvent.press(screen.getByRole('button', { name: 'Edit in current app' }));
    expect(onOpenCurrentApp).toHaveBeenCalledTimes(1);
  });
});
