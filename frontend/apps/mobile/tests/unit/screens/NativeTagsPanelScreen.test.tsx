import { act, cleanup, fireEvent, render, screen } from '@testing-library/react-native';
import { NativeTagsPanelScreen } from '../../../src/screens/NativeTagsPanelScreen';

const tag = {
  key: 'custom:purple-tag' as const,
  parent: 'caught' as const,
  name: 'Shadow Shinies',
  color: '#7c3aed',
  tone: 'custom' as const,
  rows: [{
    id: 'instance-1',
    pokemonId: 6,
    pokedexNumber: 6,
    name: 'Shiny Shadow Charizard',
    imageUri: 'https://pokegonexus.com/images/charizard.png',
    locationBackgroundUri: null,
    maxKind: null,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'caught' as const,
    source: 'instance' as const,
    cp: 2500,
    favorite: false,
    mostWanted: false,
  }],
};

const maxTag = {
  ...tag,
  key: 'system:trade' as const,
  name: 'Trade',
  color: '#3aa85f',
  tone: 'trade' as const,
  rows: [{
    ...tag.rows[0],
    id: 'instance-gigantamax',
    maxKind: 'gigantamax' as const,
  }],
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  cleanup();
  jest.useRealTimers();
});

describe('NativeTagsPanelScreen', () => {
  it('renders real tag membership and returns the selected tag to the Pokémon grid', () => {
    const onSelectTag = jest.fn();
    const onViewChange = jest.fn();
    render(
      <NativeTagsPanelScreen
        activeTagName={null}
        assetBaseUrl="https://pokegonexus.com"
        collectionCount={2500}
        error={null}
        isLoading={false}
        onActionMenuPress={jest.fn()}
        onRetry={jest.fn()}
        onSelectTag={onSelectTag}
        onViewChange={onViewChange}
        parent="caught"
        tags={[tag]}
      />,
    );

    expect(screen.getByText('Shadow Shinies')).toBeTruthy();
    expect(screen.getByText('1 Pokémon have this tag.')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /Open Shadow Shinies/i }));
    expect(onSelectTag).toHaveBeenCalledWith(tag);
    fireEvent.press(screen.getByRole('tab', { name: /wishlist/i }));
    expect(onViewChange).toHaveBeenCalledWith('wishlist');
  });

  it('keeps tag previews aligned with the web cards and preserves Max badges', () => {
    render(
      <NativeTagsPanelScreen
        activeTagName={null}
        assetBaseUrl="https://pokegonexus.com"
        collectionCount={1}
        error={null}
        isLoading={false}
        onActionMenuPress={jest.fn()}
        onRetry={jest.fn()}
        onSelectTag={jest.fn()}
        onViewChange={jest.fn()}
        parent="caught"
        tags={[maxTag]}
      />,
    );

    expect(screen.getByLabelText('Inventory tags')).toBeTruthy();
    expect(screen.getByText('1 Pokémon')).toBeTruthy();
    expect(screen.getByLabelText('Open Trade, 1 Pokémon')).toBeTruthy();
    expect(screen.UNSAFE_getByProps({ testID: 'native-tag-preview-gigantamax' })).toBeTruthy();
    expect(screen.queryByText('Inventory tags')).toBeNull();
    expect(screen.queryByText('›')).toBeNull();
  });

  it('provides the canonical arrange workflow', async () => {
    const onCreateTag = jest.fn().mockResolvedValue(undefined);
    const onDeleteTag = jest.fn().mockResolvedValue(undefined);
    const onSaveOrder = jest.fn().mockResolvedValue(undefined);
    const onUpdateTag = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeTagsPanelScreen
        activeTagName={null}
        assetBaseUrl="https://pokegonexus.com"
        collectionCount={1}
        error={null}
        isEditable
        isLoading={false}
        onActionMenuPress={jest.fn()}
        onCreateTag={onCreateTag}
        onDeleteTag={onDeleteTag}
        onRetry={jest.fn()}
        onSaveOrder={onSaveOrder}
        onSelectTag={jest.fn()}
        onUpdateTag={onUpdateTag}
        onViewChange={jest.fn()}
        parent="caught"
        tags={[maxTag, tag]}
      />,
    );

    expect(screen.getByRole('button', { name: 'New inventory tag' })).toBeTruthy();
    fireEvent.press(screen.getByText('↕ Arrange'));
    expect(screen.getByLabelText('Reorder Trade, position 1 of 2')).toBeTruthy();
    expect(screen.getByLabelText('Reorder Shadow Shinies, position 2 of 2')).toBeTruthy();
    fireEvent(
      screen.getByLabelText('Reorder Trade, position 1 of 2'),
      'accessibilityAction',
      { nativeEvent: { actionName: 'increment' } },
    );
    fireEvent.press(screen.getByText('✓ Save order'));
    await act(async () => Promise.resolve());
    expect(onSaveOrder).toHaveBeenCalledWith('caught', ['custom:purple-tag', 'system:trade']);
  });

  it('provides the canonical custom-tag editor workflow', async () => {
    const onUpdateTag = jest.fn().mockResolvedValue(undefined);
    render(
      <NativeTagsPanelScreen
        activeTagName={null}
        assetBaseUrl="https://pokegonexus.com"
        collectionCount={1}
        error={null}
        isEditable
        isLoading={false}
        onActionMenuPress={jest.fn()}
        onCreateTag={jest.fn().mockResolvedValue(undefined)}
        onDeleteTag={jest.fn().mockResolvedValue(undefined)}
        onRetry={jest.fn()}
        onSaveOrder={jest.fn().mockResolvedValue(undefined)}
        onSelectTag={jest.fn()}
        onUpdateTag={onUpdateTag}
        onViewChange={jest.fn()}
        parent="caught"
        tags={[tag]}
      />,
    );

    fireEvent.press(screen.getByText('Edit'));
    expect(screen.getByText('Edit tag')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Tag name'), 'Shadow favorites');
    fireEvent.press(screen.getByText('Save changes'));
    await act(async () => Promise.resolve());
    expect(onUpdateTag).toHaveBeenCalledWith('purple-tag', {
      color: '#7c3aed',
      name: 'Shadow favorites',
    });
  });
});
