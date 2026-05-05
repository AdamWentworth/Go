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

  it('clears mirror flag on save when pokemon was mirrored and mirror is turned off', async () => {
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

    expect(updateDetails).not.toHaveBeenCalled();
    expect(result.current.editMode).toBe(true);

    await act(async () => {
      result.current.toggleEditMode();
      await Promise.resolve();
    });

    expect(updateDetails).toHaveBeenCalledWith({
      current: {
        not_wanted_list: {},
        wanted_filters: {},
        mirror: false,
      },
    });
  });

  it('creates a missing mirror target on save using the preview key', async () => {
    const updateDetails = vi.fn().mockResolvedValue(undefined);
    const setLocalNotWantedList = vi.fn();
    const setMirrorKey = vi.fn();
    const setListsState = vi.fn();

    useInstancesStore.setState({
      instances: {
        current: {
          instance_id: 'current',
          variant_id: '0001-default',
          pokemon_id: 1,
          is_caught: true,
          is_for_trade: true,
          is_wanted: false,
          not_wanted_list: { old: true },
        },
        old: { instance_id: 'old', variant_id: '0002-default', not_trade_list: { current: true } },
      },
    } as any);

    const pokemon = {
      variant_id: '0001-default',
      pokemon_id: 1,
      species_name: 'Bulbasaur',
      currentImage: '/images/bulbasaur.png',
      instanceData: {
        instance_id: 'current',
        variant_id: '0001-default',
        pokemon_id: 1,
        not_wanted_list: { old: true },
        mirror: false,
      },
    } as any;

    const { result } = renderHook(() =>
      useToggleEditModeTrade(
        pokemon,
        true,
        'preview-mirror',
        setMirrorKey,
        vi.fn(),
        { wanted: {} },
        { wanted: {} },
        setListsState,
        { other: true },
        setLocalNotWantedList,
        { shiny: true },
        updateDetails,
        ['filtered'],
      ),
    );

    act(() => {
      result.current.toggleEditMode();
    });

    await act(async () => {
      result.current.toggleEditMode();
      await Promise.resolve();
    });

    expect(updateDetails).toHaveBeenCalledWith({
      'preview-mirror': expect.objectContaining({
        instance_id: 'preview-mirror',
        variant_id: '0001-default',
        pokemon_id: 1,
        is_wanted: true,
        is_caught: false,
        is_for_trade: false,
      }),
      old: { not_trade_list: {} },
      current: {
        not_wanted_list: {},
        wanted_filters: {},
        mirror: true,
      },
    });
    expect(setMirrorKey).toHaveBeenCalledWith('preview-mirror');
    expect(setLocalNotWantedList).toHaveBeenCalledWith({});
    expect(setListsState).toHaveBeenCalled();
  });

  it('reuses an existing wanted mirror target on save', async () => {
    const updateDetails = vi.fn().mockResolvedValue(undefined);
    const setMirrorKey = vi.fn();

    useInstancesStore.setState({
      instances: {
        current: {
          instance_id: 'current',
          variant_id: '0001-default',
          pokemon_id: 1,
          is_caught: true,
          is_for_trade: true,
          is_wanted: false,
        },
        existingMirror: {
          instance_id: 'existingMirror',
          variant_id: '0001-default',
          pokemon_id: 1,
          is_caught: false,
          is_for_trade: false,
          is_wanted: true,
        },
      },
    } as any);

    const pokemon = {
      variant_id: '0001-default',
      pokemon_id: 1,
      instanceData: {
        instance_id: 'current',
        variant_id: '0001-default',
        pokemon_id: 1,
        not_wanted_list: {},
        mirror: false,
      },
    } as any;

    const { result } = renderHook(() =>
      useToggleEditModeTrade(
        pokemon,
        true,
        null,
        setMirrorKey,
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

    await act(async () => {
      result.current.toggleEditMode();
      await Promise.resolve();
    });

    expect(updateDetails).toHaveBeenCalledWith({
      current: {
        not_wanted_list: {},
        wanted_filters: {},
        mirror: true,
      },
    });
    expect(setMirrorKey).toHaveBeenCalledWith('existingMirror');
    expect(result.current.editMode).toBe(false);
  });
});
