import { describe, expect, it, vi } from 'vitest';

import { toggleEditMode } from '@/pages/Pokemon/features/instances/hooks/useToggleEditModeWanted';

describe('toggleEditMode (wanted)', () => {
  it('builds patch map using canonical instances input when leaving edit mode', () => {
    const setEditMode = vi.fn();
    const setLocalNotTradeList = vi.fn();
    const updateDetails = vi.fn().mockResolvedValue(undefined);

    const pokemon = {
      instanceData: {
        instance_id: 'current',
        not_trade_list: { removed: true },
      },
    };

    const instances = {
      removed: { not_wanted_list: { current: true, keep: true } },
      added: { not_wanted_list: {} },
      filtered: { not_wanted_list: {} },
    };

    toggleEditMode({
      editMode: true,
      setEditMode,
      localNotTradeList: { added: true },
      setLocalNotTradeList,
      pokemon,
      instances,
      filteredOutPokemon: ['filtered'],
      localTradeFilters: { shiny: true },
      updateDetails,
    });

    expect(updateDetails).toHaveBeenCalledTimes(1);
    expect(updateDetails).toHaveBeenCalledWith({
      removed: { not_wanted_list: { keep: true } },
      added: { not_wanted_list: { current: true } },
      filtered: { not_wanted_list: { current: true } },
      current: {
        not_trade_list: { added: true, filtered: true },
        trade_filters: { shiny: true },
      },
    });
    expect(setLocalNotTradeList).toHaveBeenCalledWith({
      added: true,
      filtered: true,
    });
    expect(setEditMode).toHaveBeenCalledWith(false);
  });

  it('skips reciprocal partner patches when instances map does not contain those keys', () => {
    const setEditMode = vi.fn();
    const setLocalNotTradeList = vi.fn();
    const updateDetails = vi.fn().mockResolvedValue(undefined);

    const pokemon = {
      instanceData: {
        instance_id: 'current',
        not_trade_list: {},
      },
    };

    toggleEditMode({
      editMode: true,
      setEditMode,
      localNotTradeList: { partner: true },
      setLocalNotTradeList,
      pokemon,
      instances: {},
      filteredOutPokemon: [],
      localTradeFilters: {},
      updateDetails,
    });

    expect(updateDetails).toHaveBeenCalledWith({
      current: {
        not_trade_list: { partner: true },
        trade_filters: {},
      },
    });
    expect(setEditMode).toHaveBeenCalledWith(false);
  });

  it('only toggles edit mode when entering edit state', () => {
    const setEditMode = vi.fn();
    const setLocalNotTradeList = vi.fn();
    const updateDetails = vi.fn();

    toggleEditMode({
      editMode: false,
      setEditMode,
      localNotTradeList: {},
      setLocalNotTradeList,
      pokemon: {
        instanceData: {
          instance_id: 'current',
          not_trade_list: {},
        },
      },
      instances: {},
      filteredOutPokemon: [],
      localTradeFilters: {},
      updateDetails,
    });

    expect(updateDetails).not.toHaveBeenCalled();
    expect(setLocalNotTradeList).not.toHaveBeenCalled();
    expect(setEditMode).toHaveBeenCalledWith(true);
  });
});
