import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Trades from '@/pages/Trades/Trades';

const mocks = vi.hoisted(() => ({
  params: new URLSearchParams(),
  setParams: vi.fn(),
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

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    useSearchParams: () => [mocks.params, mocks.setParams],
  };
});

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
vi.mock('@/pages/Trades/components/TradeMatches', () => ({
  default: () => <div data-testid="trade-matches" />,
}));

describe('Trades page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.params = new URLSearchParams();
    mocks.statusPropsHistory.length = 0;
    mocks.listPropsHistory.length = 0;
  });

  it('starts in Matches and switches to grouped Active trades', () => {
    render(<Trades />);

    expect(screen.getByTestId('trade-status-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('trade-matches')).toBeInTheDocument();
    const initialStatusProps = mocks.statusPropsHistory.at(-1);
    expect(initialStatusProps?.selectedSection).toBe('matches');
    expect(initialStatusProps?.activeCount).toBe(1);

    const setSelectedSection = initialStatusProps?.setSelectedSection as
      | ((section: 'active') => void)
      | undefined;
    act(() => setSelectedSection?.('active'));

    expect(screen.getAllByTestId('trade-list')).toHaveLength(3);
    expect(mocks.listPropsHistory.map((props) => props.selectedStatus)).toEqual([
      'Accepting',
      'Proposed',
      'Pending',
    ]);
    expect(mocks.listPropsHistory[0]?.trades).toEqual(mocks.tradeStoreState.trades);
    expect(mocks.setParams).toHaveBeenCalled();
  });
});
