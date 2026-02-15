import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useToggleEditModeTrade from '@/pages/Pokemon/features/instances/hooks/useToggleEditModeTrade';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

describe('useToggleEditModeTrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useInstancesStore.setState({
      instances: {
        removed: { not_trade_list: { current: true, keep: true } },
        added: { not_trade_list: {} },
        filtered: { not_trade_list: {} },
      },
    } as any);
  });

  it('builds patch map from canonical instances data when leaving edit mode', async () => {
    const updateDetails = vi.fn().mockResolvedValue(undefined);
    const setLocalNotWantedList = vi.fn();
    const setMirrorKey = vi.fn();
    const setIsMirror = vi.fn();
    const setListsState = vi.fn();

    const pokemon = {
      instanceData: {
        instance_id: 'current',
        not_wanted_list: { removed: true },
        mirror: false,
      },
    } as any;

    const { result } = renderHook(() =>
      useToggleEditModeTrade(
        pokemon,
        false,
        null,
        setMirrorKey,
        setIsMirror,
        { wanted: {} },
        { wanted: {} },
        setListsState,
        { added: true },
        setLocalNotWantedList,
        { registered: true },
        updateDetails,
        ['filtered'],
      ),
    );

    act(() => {
      result.current.toggleEditMode();
    });

    expect(result.current.editMode).toBe(true);
    expect(updateDetails).not.toHaveBeenCalled();

    await act(async () => {
      result.current.toggleEditMode();
      await Promise.resolve();
    });

    expect(updateDetails).toHaveBeenCalledWith({
      removed: { not_trade_list: { keep: true } },
      added: { not_trade_list: { current: true } },
      filtered: { not_trade_list: { current: true } },
      current: {
        not_wanted_list: { added: true, filtered: true },
        wanted_filters: { registered: true },
        mirror: false,
      },
    });
    expect(setLocalNotWantedList).toHaveBeenCalledWith({
      added: true,
      filtered: true,
    });
    expect(setListsState).not.toHaveBeenCalled();
  });

  it('clears mirror flag on enter-edit when pokemon was mirrored', () => {
    const updateDetails = vi.fn().mockResolvedValue(undefined);

    const pokemon = {
      instanceData: {
        instance_id: 'current',
        not_wanted_list: {},
        mirror: true,
      },
    } as any;

    const { result } = renderHook(() =>
      useToggleEditModeTrade(
        pokemon,
        false,
        null,
        vi.fn(),
        vi.fn(),
        { wanted: {} },
        { wanted: {} },
        vi.fn(),
        {},
        vi.fn(),
        {},
        updateDetails,
        [],
      ),
    );

    act(() => {
      result.current.toggleEditMode();
    });

    expect(updateDetails).toHaveBeenCalledWith('current', {
      instance_id: 'current',
      not_wanted_list: {},
      mirror: false,
    });
    expect(result.current.editMode).toBe(true);
  });
});

