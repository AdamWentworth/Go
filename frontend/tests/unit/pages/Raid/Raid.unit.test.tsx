import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import Raid from '@/pages/Raid/Raid';

type MockRaidMove = {
  name: string;
  is_fast: number;
  raid_power: number;
  raid_cooldown: number;
  raid_energy: number;
  type_name: string;
};

const mocks = vi.hoisted(() => ({
  storeState: {
    variants: [] as Array<Record<string, unknown>>,
    variantsLoading: false,
  },
  useRaidBossesDataMock: vi.fn(),
  getMoveCombinationsMock: vi.fn(),
  calculateRaidBossDPSMock: vi.fn(),
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: typeof mocks.storeState) => unknown) =>
    selector(mocks.storeState),
}));

vi.mock('@/pages/Raid/hooks/useRaidBossesData', () => ({
  default: (...args: unknown[]) => mocks.useRaidBossesDataMock(...args),
}));

vi.mock('@/pages/Raid/utils/moveCombinations', () => ({
  getMoveCombinations: (...args: unknown[]) => mocks.getMoveCombinationsMock(...args),
}));

vi.mock('@/pages/Raid/utils/calculateRaidBossDPS', () => ({
  calculateRaidBossDPS: (...args: unknown[]) => mocks.calculateRaidBossDPSMock(...args),
}));

vi.mock('@/components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading</div>,
}));

const baseMoves: MockRaidMove[] = [
  {
    name: 'Psycho Cut',
    is_fast: 1,
    raid_power: 5,
    raid_cooldown: 1000,
    raid_energy: 8,
    type_name: 'psychic',
  },
  {
    name: 'Psystrike',
    is_fast: 0,
    raid_power: 100,
    raid_cooldown: 2300,
    raid_energy: -50,
    type_name: 'psychic',
  },
];

const raidBossVariant = {
  name: 'Mewtwo',
  attack: 300,
  defense: 182,
  stamina: 214,
  moves: baseMoves,
  type_1_id: 15,
  type_2_id: 0,
  type1_name: 'psychic',
  type2_name: 'none',
  variantType: 'default',
  form: null,
  raid_boss: [{ id: 1 }],
};

const defaultVariant = {
  ...raidBossVariant,
  raid_boss: [],
};

const shinyVariant = {
  ...raidBossVariant,
  name: 'ShinyMewtwo',
  variantType: 'shiny',
  raid_boss: [],
};

const costumeVariant = {
  ...raidBossVariant,
  name: 'CostumeMewtwo',
  variantType: 'costume_party',
  raid_boss: [],
};

describe('Raid page', () => {
  beforeEach(() => {
    mocks.storeState.variants = [defaultVariant, shinyVariant, costumeVariant];
    mocks.storeState.variantsLoading = false;

    mocks.useRaidBossesDataMock.mockReset();
    mocks.getMoveCombinationsMock.mockReset();
    mocks.calculateRaidBossDPSMock.mockReset();

    mocks.useRaidBossesDataMock.mockReturnValue({
      raidBossesData: [raidBossVariant],
      raidLoading: false,
    });

    mocks.calculateRaidBossDPSMock.mockReturnValue(['15.50']);

    mocks.getMoveCombinationsMock.mockImplementation((variant) => [
      {
        name: String((variant as { name?: string }).name ?? 'Unknown'),
        fastMove: 'Psycho Cut',
        chargedMove: 'Psystrike',
        dps: 20,
        tdo: '---',
        er: '---',
        cp: '4724',
      },
    ]);
  });

  it('renders loading spinner while variants are loading', () => {
    mocks.storeState.variantsLoading = true;

    render(<Raid />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders raid controls, supports selecting a raid boss, and toggles best mode', () => {
    mocks.storeState.variantsLoading = false;
    mocks.useRaidBossesDataMock.mockReturnValue({
      raidBossesData: [raidBossVariant],
      raidLoading: false,
    });

    render(<Raid />);

    expect(screen.getByRole('heading', { name: 'Raid Page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show Best' })).toBeInTheDocument();
    expect(screen.getAllByText('Mewtwo').length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Select or Type Raid Boss:'), {
      target: { value: 'Mewtwo' },
    });

    expect(screen.getByText('Fast Move:')).toBeInTheDocument();
    expect(screen.getByText('Charged Move:')).toBeInTheDocument();
    expect(mocks.calculateRaidBossDPSMock).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Show Best' }));
    expect(screen.getByRole('button', { name: 'Show All' })).toBeInTheDocument();

    // Only default variants should be considered in combinations.
    expect(mocks.getMoveCombinationsMock).toHaveBeenCalled();
    expect(
      mocks.getMoveCombinationsMock.mock.calls.every(
        (call) =>
          !String((call[0] as { variantType?: string }).variantType).includes('shiny') &&
          !String((call[0] as { variantType?: string }).variantType).startsWith('costume'),
      ),
    ).toBe(true);
  });
});
