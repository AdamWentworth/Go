import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Moves from '@/components/pokemonComponents/Moves';
import type { Move } from '@/types/pokemonSubTypes';

const buildMove = (overrides: Partial<Move>): Move => ({
  move_id: 1,
  name: 'Quick Attack',
  type_id: 1,
  raid_power: 8,
  pvp_power: 5,
  raid_energy: 10,
  pvp_energy: 8,
  raid_cooldown: 1,
  pvp_turns: 1,
  is_fast: 1,
  type_name: 'Normal',
  legacy: false,
  type: 'Normal',
  ...overrides,
});

describe('Moves', () => {
  const getVisibleDamageValues = (container: HTMLElement): string[] => {
    const visiblePage = container.querySelector(
      '.moves-page[aria-hidden="false"]',
    );
    if (!visiblePage) return [];
    return Array.from(visiblePage.querySelectorAll('.move-power-value')).map(
      (node) => node.textContent?.trim() ?? '',
    );
  };

  const getVisiblePage = (container: HTMLElement): HTMLElement | null =>
    container.querySelector('.moves-page[aria-hidden="false"]');

  it('renders move names and right-side raid damage in read-only mode', () => {
    const pokemon = {
      moves: [
        buildMove({ move_id: 1, name: 'Quick Attack', raid_power: 8, pvp_power: 4, is_fast: 1 }),
        buildMove({ move_id: 2, name: 'Wild Charge', raid_power: 90, pvp_power: 45, is_fast: 0 }),
      ],
      instanceData: {
        fast_move_id: 1,
        charged_move1_id: 2,
        charged_move2_id: null,
      },
      fusion: [],
    };

    const { container } = render(
      <Moves
        pokemon={pokemon}
        editMode={false}
        onMovesChange={vi.fn()}
        isShadow={false}
        isPurified={false}
      />,
    );

    const visiblePage = getVisiblePage(container);
    expect(visiblePage).not.toBeNull();
    expect(visiblePage?.textContent).toContain('Quick Attack');
    expect(visiblePage?.textContent).toContain('Wild Charge');

    expect(getVisibleDamageValues(container)).toEqual(['8', '90']);
  });

  it('falls back to "-" when raid damage is not a finite number', () => {
    const pokemon = {
      moves: [
        buildMove({ move_id: 1, name: 'Hidden Power', raid_power: Number.NaN, is_fast: 1 }),
        buildMove({ move_id: 2, name: 'Thunderbolt', raid_power: 80, is_fast: 0 }),
      ],
      instanceData: {
        fast_move_id: 1,
        charged_move1_id: 2,
        charged_move2_id: null,
      },
      fusion: [],
    };

    const { container } = render(
      <Moves
        pokemon={pokemon}
        editMode={false}
        onMovesChange={vi.fn()}
        isShadow={false}
        isPurified={false}
      />,
    );

    expect(getVisibleDamageValues(container)).toEqual(['-', '80']);
  });

  it('switches damage values when Trainer Battles is selected', async () => {
    const user = userEvent.setup();
    const pokemon = {
      moves: [
        buildMove({ move_id: 1, name: 'Quick Attack', raid_power: 8, pvp_power: 4, is_fast: 1 }),
        buildMove({ move_id: 2, name: 'Wild Charge', raid_power: 90, pvp_power: 45, is_fast: 0 }),
      ],
      instanceData: {
        fast_move_id: 1,
        charged_move1_id: 2,
        charged_move2_id: null,
      },
      fusion: [],
    };

    const { container } = render(
      <Moves
        pokemon={pokemon}
        editMode={false}
        onMovesChange={vi.fn()}
        isShadow={false}
        isPurified={false}
      />,
    );

    const trainerButton = screen.getByRole('tab', { name: 'Trainer Battles' });
    await user.click(trainerButton);

    expect(getVisibleDamageValues(container)).toEqual(['4', '45']);
    expect(trainerButton).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Gyms & Raids' })).toHaveAttribute(
      'aria-selected',
      'false',
    );

    const track = container.querySelector('.moves-pages-track');
    expect(track).toHaveStyle({ transform: 'translateX(-50%)' });
  });

  it('shows shadow bonus rows and appends rounded +20% bonus in blue term', () => {
    const pokemon = {
      moves: [
        buildMove({ move_id: 1, name: 'Quick Attack', raid_power: 5, pvp_power: 2, is_fast: 1 }),
        buildMove({ move_id: 2, name: 'Wild Charge', raid_power: 90, pvp_power: 45, is_fast: 0 }),
      ],
      instanceData: {
        fast_move_id: 1,
        charged_move1_id: 2,
        charged_move2_id: null,
      },
      fusion: [],
    };

    const { container } = render(
      <Moves
        pokemon={pokemon}
        editMode={false}
        onMovesChange={vi.fn()}
        isShadow
        isPurified={false}
      />,
    );

    expect(getVisibleDamageValues(container)).toEqual(['5+1', '90+18']);

    const visiblePage = getVisiblePage(container);
    expect(
      visiblePage?.querySelectorAll('.move-shadow-bonus-row').length,
    ).toBe(2);
    expect(visiblePage?.textContent).toContain('SHADOW BONUS');
  });

  it('updates fusion move options immediately when fusion_form changes without save', async () => {
    const user = userEvent.setup();
    const onMovesChange = vi.fn();
    const fusionMoveId = 999;

    const pokemonBase = {
      moves: [
        buildMove({ move_id: 1, name: 'Dragon Breath', is_fast: 1 }),
        buildMove({ move_id: 2, name: 'Crunch', is_fast: 0 }),
        buildMove({
          move_id: fusionMoveId,
          name: 'Fusion Flare',
          is_fast: 0,
          fusion_id: 3,
        }),
      ],
      fusion: [{ name: 'White Kyurem', fusion_id: 3 }],
    };

    const { rerender } = render(
      <Moves
        pokemon={{
          ...pokemonBase,
          instanceData: {
            fast_move_id: 1,
            charged_move1_id: 2,
            charged_move2_id: null,
            fusion_form: null,
          },
        }}
        editMode
        onMovesChange={onMovesChange}
        isShadow={false}
        isPurified={false}
      />,
    );

    const chargedSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(chargedSelect, String(2));
    expect(screen.queryByRole('option', { name: 'Fusion Flare' })).not.toBeInTheDocument();

    rerender(
      <Moves
        pokemon={{
          ...pokemonBase,
          instanceData: {
            fast_move_id: 1,
            charged_move1_id: 2,
            charged_move2_id: null,
            fusion_form: 'White Kyurem',
          },
        }}
        editMode
        onMovesChange={onMovesChange}
        isShadow={false}
        isPurified={false}
      />,
    );

    expect(screen.getByRole('option', { name: 'Fusion Flare' })).toBeInTheDocument();
  });
});
