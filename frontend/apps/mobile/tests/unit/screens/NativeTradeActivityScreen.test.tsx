import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import type { TradeRecord } from '@pokemongonexus/shared-contracts/trades';
import type { NativeInstanceDetail } from '../../../src/features/collection/collectionModel';
import { buildNativeTradeActivityModel } from '../../../src/features/trades/nativeTradeActivityModel';
import type { NativeTradeActivityRow } from '../../../src/features/trades/nativeTradeActivityRows';
import { NativeTradeActivityScreen } from '../../../src/screens/NativeTradeActivityScreen';

const detail = (id: string, name: string): NativeInstanceDetail => ({
  row: {
    id,
    pokemonId: 1,
    pokedexNumber: 1,
    name,
    imageUri: `https://pokegonexus.com/${id}.png`,
    locationBackgroundUri: null,
    maxKind: null,
    purified: false,
    lucky: false,
    typeIconUris: [],
    status: 'trade',
    source: 'instance',
    cp: null,
    favorite: false,
    mostWanted: false,
  },
  traits: [],
  stats: [],
  ivs: [],
  moves: [],
  provenance: [],
  preferences: [],
});

const buildRow = (
  id: string,
  status: TradeRecord['trade_status'],
  overrides: Partial<TradeRecord> = {},
): NativeTradeActivityRow => {
  const model = buildNativeTradeActivityModel({
    trade_id: id,
    trade_status: status,
    username_proposed: status === 'proposed' && id === 'incoming' ? 'OtherTrainer' : 'AdamZilla',
    username_accepting: status === 'proposed' && id === 'incoming' ? 'AdamZilla' : 'OtherTrainer',
    pokemon_instance_id_user_proposed: `${id}-proposed`,
    pokemon_instance_id_user_accepting: `${id}-accepting`,
    trade_friendship_level: 'Forever',
    trade_dust_cost: 40_000,
    ...overrides,
  }, 'AdamZilla');
  if (!model) throw new Error('Invalid test trade');
  return {
    model,
    currentUserPokemon: detail(model.currentUserInstanceId, `My ${id}`),
    partnerPokemon: detail(model.partnerInstanceId, `Their ${id}`),
  };
};

const rows = [
  buildRow('incoming', 'proposed'),
  buildRow('sent', 'proposed'),
  buildRow('active', 'pending'),
  buildRow('done', 'completed'),
  buildRow('closed', 'cancelled'),
];

const renderScreen = ({
  onAction = jest.fn().mockResolvedValue(undefined),
  onRevealPartner = jest.fn().mockResolvedValue({
    sharingEnabled: true,
    trainerCode: '1234 5678 9012',
    pokemonGoName: 'OtherPogoName',
    coordinationMethod: 'campfire',
    coordinationHandle: 'OtherTrainer',
  }),
} = {}) => render(
  <NativeTradeActivityScreen
    assetBaseUrl="https://pokegonexus.com"
    error={null}
    isLoading={false}
    onAction={onAction}
    onOpenPreferences={jest.fn()}
    onRetry={jest.fn()}
    onRevealPartner={onRevealPartner}
    rows={rows}
  />,
);

describe('NativeTradeActivityScreen', () => {
  it('renders the canonical five stages and starts with incoming offers', () => {
    const { getByTestId, getByText, queryByTestId } = renderScreen();

    expect(getByText('Your trades')).toBeTruthy();
    expect(getByText('Offers')).toBeTruthy();
    expect(getByText('Sent')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Done')).toBeTruthy();
    expect(getByText('Closed')).toBeTruthy();
    expect(queryByTestId('trade-card-incoming')).toBeTruthy();
    expect(queryByTestId('trade-card-sent')).toBeNull();
    const listStyle = StyleSheet.flatten(getByTestId('trade-activity-list').props.contentContainerStyle);
    expect(listStyle.paddingBottom).toBeGreaterThanOrEqual(90);
  });

  it('switches stages immediately and preserves mine-left/theirs-right labels', () => {
    const { getByTestId, getByText, queryByTestId } = renderScreen();

    fireEvent.press(getByTestId('trade-filter-Proposed'));
    expect(queryByTestId('trade-card-incoming')).toBeNull();
    expect(queryByTestId('trade-card-sent')).toBeTruthy();
    expect(getByText('YOU OFFER')).toBeTruthy();
    expect(getByText('OTHERTRAINER OFFERS')).toBeTruthy();
  });

  it('requires confirmation and reports a server-confirmed action visibly', async () => {
    const onAction = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText } = renderScreen({ onAction });

    fireEvent.press(getByTestId('trade-filter-Proposed'));
    fireEvent.press(getByTestId('trade-action-cancel-sent'));
    expect(getByTestId('trade-action-confirmation')).toBeTruthy();
    expect(onAction).not.toHaveBeenCalled();

    fireEvent.press(getByText('Cancel trade'));
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(rows[1].model, 'cancel'));
    expect(getByText('Trade updated from the server response.')).toBeTruthy();
  });

  it('keeps a failed command visible instead of pretending it succeeded', async () => {
    const onAction = jest.fn().mockRejectedValue(new Error('Trade state has changed.'));
    const { getByTestId, getByText } = renderScreen({ onAction });

    fireEvent.press(getByTestId('trade-action-deny-incoming'));
    fireEvent.press(getByText('Deny offer'));
    await waitFor(() => expect(getByText('Trade state has changed.')).toBeTruthy());
  });

  it('reveals privacy-bounded external coordination details only for active trades', async () => {
    const onRevealPartner = jest.fn().mockResolvedValue({
      sharingEnabled: true,
      trainerCode: '1234 5678 9012',
      pokemonGoName: 'OtherPogoName',
      coordinationMethod: 'campfire',
      coordinationHandle: 'OtherTrainer',
    });
    const { getByTestId, getByText } = renderScreen({ onRevealPartner });

    fireEvent.press(getByTestId('trade-filter-Pending'));
    fireEvent.press(getByTestId('trade-action-coordinate-active'));
    await waitFor(() => expect(onRevealPartner).toHaveBeenCalledWith('active'));
    expect(getByTestId('trade-partner-information')).toBeTruthy();
    expect(getByText('Trainer code: 1234 5678 9012')).toBeTruthy();
    expect(getByText(/does not include chat/i)).toBeTruthy();
  });
});
