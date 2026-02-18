import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { NavigateFunction } from 'react-router-dom';

import usePokemonPageController from '@/pages/Pokemon/hooks/usePokemonPageController';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';

const loadForeignProfileMock = vi.fn();
const updateInstanceStatusMock = vi.fn();
const setHighlightedCardsMock = vi.fn();
const setIsFastSelectEnabledMock = vi.fn();
const handleConfirmChangeTagsMock = vi.fn(async () => undefined);
const modalAlertMock = vi.fn().mockResolvedValue(undefined);

const baseVariant = { variant_id: '0001-default', pokemon_id: 1 } as PokemonVariant;
const variantsStoreState = {
  variants: [baseVariant],
  pokedexLists: { default: [baseVariant] },
  variantsLoading: false,
};
const instancesStoreState = {
  foreignInstances: null,
  updateInstanceStatus: updateInstanceStatusMock,
  instances: {} as Instances,
};
const tagsStoreState = {
  tags: {} as TagBuckets,
  foreignTags: null,
};
const userSearchStoreState = {
  userExists: true,
  foreignInstancesLoading: false,
  loadForeignProfile: loadForeignProfileMock,
  canonicalUsername: '',
};

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector(variantsStoreState),
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector(instancesStoreState),
}));

vi.mock('@/features/tags/store/useTagsStore', () => ({
  useTagsStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector(tagsStoreState),
}));

vi.mock('@/stores/useUserSearchStore', () => ({
  useUserSearchStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector(userSearchStoreState),
}));

vi.mock('@/contexts/ModalContext', () => ({
  useModal: () => ({
    alert: modalAlertMock,
    confirm: vi.fn(),
  }),
}));

vi.mock('@/pages/Pokemon/hooks/useUIControls', () => ({
  default: () => ({
    showEvolutionaryLine: false,
    toggleEvolutionaryLine: vi.fn(),
    isFastSelectEnabled: false,
    setIsFastSelectEnabled: setIsFastSelectEnabledMock,
    sortType: 'number',
    setSortType: vi.fn(),
    sortMode: 'ascending',
    setSortMode: vi.fn(),
    highlightedCards: new Set<string>(),
    setHighlightedCards: setHighlightedCardsMock,
    toggleCardHighlight: vi.fn(),
  }),
}));

vi.mock('@/pages/Pokemon/hooks/usePokemonProcessing', () => ({
  default: () => ({
    filteredVariants: [baseVariant],
    sortedPokemons: [
      {
        ...baseVariant,
        instanceData: { instance_id: 'inst-1' },
      },
      { variant_id: '0002-default', pokemon_id: 2 },
    ] as PokemonVariant[],
  }),
}));

vi.mock('@/pages/Pokemon/hooks/useInstanceIdProcessor', () => ({
  default: vi.fn(),
}));

vi.mock('@/pages/Pokemon/services/changeInstanceTag/hooks/useHandleChangeTags', () => ({
  default: () => ({
    handleConfirmChangeTags: handleConfirmChangeTagsMock,
  }),
}));

vi.mock('@/pages/Pokemon/features/mega/hooks/useMegaPokemonHandler', () => ({
  default: () => ({
    promptMegaPokemonSelection: vi.fn(),
    isMegaSelectionOpen: false,
    megaSelectionData: null,
    handleMegaSelectionResolve: vi.fn(),
    handleMegaSelectionReject: vi.fn(),
  }),
}));

vi.mock('@/pages/Pokemon/features/fusion/hooks/useFusionPokemonHandler', () => ({
  default: () => ({
    promptFusionPokemonSelection: vi.fn(),
    isFusionSelectionOpen: false,
    fusionSelectionData: null,
    handleFusionSelectionResolve: vi.fn(),
    closeFusionSelection: vi.fn(),
    handleCreateNewLeft: vi.fn(),
    handleCreateNewRight: vi.fn(),
  }),
}));

vi.mock('@/pages/Pokemon/hooks/useSwipeHandler', () => ({
  default: () => ({
    onTouchStart: vi.fn(),
    onTouchMove: vi.fn(),
    onTouchEnd: vi.fn(),
  }),
}));

describe('usePokemonPageController', () => {
  it('loads foreign profile for username routes and exits loading state', async () => {
    const navigate = vi.fn() as unknown as NavigateFunction;
    const location = { pathname: '/pokemon/ash', state: null } as any;

    const { result } = renderHook(() =>
      usePokemonPageController({
        isOwnCollection: false,
        urlUsername: 'ash',
        location,
        navigate,
      }),
    );

    await waitFor(() => {
      expect(result.current.isPageLoading).toBe(false);
    });

    expect(result.current.isUsernamePath).toBe(true);
    expect(loadForeignProfileMock).toHaveBeenCalledWith('ash', expect.any(Function));
  });

  it('select-all action sends computed ids to highlighted state and enables fast-select', async () => {
    const navigate = vi.fn() as unknown as NavigateFunction;
    const location = { pathname: '/pokemon', state: null } as any;

    const { result } = renderHook(() =>
      usePokemonPageController({
        isOwnCollection: true,
        location,
        navigate,
      }),
    );

    await waitFor(() => {
      expect(result.current.isPageLoading).toBe(false);
    });

    act(() => {
      result.current.handleSelectAll();
    });

    const highlightedArg = setHighlightedCardsMock.mock.calls.at(-1)?.[0];
    expect(highlightedArg).toBeInstanceOf(Set);
    expect(Array.from(highlightedArg)).toEqual(['inst-1', '0002-default']);
    expect(setIsFastSelectEnabledMock).toHaveBeenCalledWith(true);
  });

  it('updates local tag/menu/view state when selecting a tag from tags panel', async () => {
    const navigate = vi.fn() as unknown as NavigateFunction;
    const location = { pathname: '/pokemon', state: null } as any;

    const { result } = renderHook(() =>
      usePokemonPageController({
        isOwnCollection: true,
        location,
        navigate,
      }),
    );

    await waitFor(() => {
      expect(result.current.isPageLoading).toBe(false);
    });

    act(() => {
      result.current.handleTagSelect('Trade');
    });

    expect(result.current.tagFilter).toBe('Trade');
    expect(result.current.lastMenu).toBe('ownership');
    expect(result.current.activeView).toBe('pokemon');
  });
});
