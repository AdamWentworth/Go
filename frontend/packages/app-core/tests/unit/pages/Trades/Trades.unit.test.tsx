import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Trades from '@/pages/Trades/Trades';

const mocks = vi.hoisted(() => ({
  tradeStoreState: {
    trades: { t1: { trade_status: 'pending' } },
    relatedInstances: { i1: { instance_id: 'i1' } },
  },
  variantsStoreState: {
    variants: [{ variant_id: '1' }],
    variantsLoading: true,
  },
  instancesStoreState: {
    instances: { i1: { instance_id: 'i1', is_caught: true } },
    setInstances: vi.fn(),
    periodicUpdates: vi.fn(),
  },
  statusPropsHistory: [] as Array<Record<string, unknown>>,
  listPropsHistory: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/features/trades/store/useTradeStore', () => ({
  useTradeStore: (selector: (state: typeof mocks.tradeStoreState) => unknown) =>
    selector(mocks.tradeStoreState),
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: typeof mocks.variantsStoreState) => unknown) =>
    selector(mocks.variantsStoreState),
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (selector: (state: typeof mocks.instancesStoreState) => unknown) =>
    selector(mocks.instancesStoreState),
}));

vi.mock('@/pages/Trades/TradeStatusButtons', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.statusPropsHistory.push(props);
    return <div data-testid="trade-status-buttons" />;
  },
}));

vi.mock('@/pages/Trades/TradeList', () => ({
  default: (props: Record<string, unknown>) => {
    mocks.listPropsHistory.push(props);
    return <div data-testid="trade-list" />;
  },
}));

vi.mock('@/components/ActionMenu', () => ({
  default: () => <div data-testid="action-menu" />,
}));

describe('Trades page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.statusPropsHistory.length = 0;
    mocks.listPropsHistory.length = 0;
  });

  it('wires store data to status controls and list, and updates selected status', () => {
    render(<Trades />);

    expect(screen.getByTestId('trade-status-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('trade-list')).toBeInTheDocument();
    expect(screen.getByTestId('action-menu')).toBeInTheDocument();

    const initialStatusProps = mocks.statusPropsHistory.at(-1);
    const initialListProps = mocks.listPropsHistory.at(-1);

    expect(initialStatusProps?.selectedStatus).toBe('Pending');
    expect(initialListProps?.selectedStatus).toBe('Pending');
    expect(initialListProps?.trades).toEqual(mocks.tradeStoreState.trades);
    expect(initialListProps?.relatedInstances).toEqual(mocks.tradeStoreState.relatedInstances);
    expect(initialListProps?.variants).toEqual(mocks.variantsStoreState.variants);
    expect(initialListProps?.instances).toEqual(mocks.instancesStoreState.instances);
    expect(initialListProps?.loading).toBe(true);

    const setSelectedStatus = initialStatusProps?.setSelectedStatus as
      | ((status: string) => void)
      | undefined;
    expect(setSelectedStatus).toBeTypeOf('function');

    act(() => {
      setSelectedStatus?.('Completed');
    });

    const updatedListProps = mocks.listPropsHistory.at(-1);
    expect(updatedListProps?.selectedStatus).toBe('Completed');
  });
});
