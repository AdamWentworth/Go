import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getAllTagDefs: vi.fn(),
  getAllInstanceTags: vi.fn(),
  persistSystemMembershipsFromBuckets: vi.fn(),
  getSystemChildrenSnapshot: vi.fn(),
  setSystemChildrenSnapshot: vi.fn(),
}));

vi.mock('@/db/tagsDB', () => dbMocks);
vi.mock('@/db/variantsDB', () => ({ getAllVariants: vi.fn() }));
vi.mock('@/db/instancesDB', () => ({ getAllInstances: vi.fn() }));

import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

const variantsFixture = [
  {
    variant_id: '0001-default',
    pokemon_id: 1,
    name: 'Bulbasaur',
    form: null,
    variantType: 'default',
    currentImage: '/images/default/pokemon_1.png',
    stamina: 111,
    shiny_rarity: 'common',
    rarity: 'common',
    pokedex_number: 1,
    moves: [],
    type1_name: 'Grass',
    type2_name: 'Poison',
    type_1_icon: '/images/types/grass.png',
    type_2_icon: '/images/types/poison.png',
  },
] as any[];

const caughtTagItem = {
  instance_id: 'caught-fav',
  currentImage: '/images/default/pokemon_1.png',
  pokemon_id: 1,
  cp: 500,
  hp: 111,
  favorite: true,
  most_wanted: false,
  is_caught: true,
  is_for_trade: false,
  is_wanted: false,
  mirror: false,
  pref_lucky: false,
  registered: true,
  gender: 'Male',
  pokedex_number: 1,
  moves: [],
  shiny: false,
  rarity: 'common',
  shiny_rarity: 'common',
} as any;

const wantedTagItem = {
  ...caughtTagItem,
  instance_id: 'wanted-most',
  favorite: false,
  most_wanted: true,
  is_caught: false,
  is_wanted: true,
} as any;

describe('useTagsStore integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    dbMocks.getAllTagDefs.mockResolvedValue([]);
    dbMocks.getAllInstanceTags.mockResolvedValue([]);
    dbMocks.persistSystemMembershipsFromBuckets.mockResolvedValue(undefined);
    dbMocks.getSystemChildrenSnapshot.mockResolvedValue(null);
    dbMocks.setSystemChildrenSnapshot.mockResolvedValue(undefined);

    useVariantsStore.setState({
      variants: [],
      variantsLoading: false,
      pokedexLists: {} as any,
      isRefreshing: false,
    });

    useInstancesStore.setState({
      instances: {},
      foreignInstances: null,
      instancesLoading: false,
    });

    useTagsStore.setState({
      tags: { caught: {}, wanted: {}, trade: {} } as any,
      customTags: { caught: {}, wanted: {} },
      systemChildren: {
        caught: { favorite: {}, trade: {} },
        wanted: { mostWanted: {} },
      },
      tagsLoading: true,
      customTagsLoading: true,
      foreignTags: null,
    });
  });

  it('rebuildCustomTags groups memberships by allowed parents and ignores legacy trade parent', async () => {
    useTagsStore.setState({
      tags: {
        caught: { 'caught-fav': caughtTagItem },
        wanted: { 'wanted-most': wantedTagItem },
      } as any,
    });

    dbMocks.getAllTagDefs.mockResolvedValue([
      { tag_id: 'tag-caught', parent: 'caught', name: 'My Caught' },
      { tag_id: 'tag-wanted', parent: 'wanted', name: 'My Wanted' },
      { tag_id: 'legacy-trade-parent', parent: 'trade', name: 'Legacy Trade Parent' },
      { tag_id: 'deleted-tag', parent: 'caught', name: 'Deleted', deleted_at: '2026-01-01T00:00:00Z' },
    ]);
    dbMocks.getAllInstanceTags.mockResolvedValue([
      { key: 'tag-caught:caught-fav', tag_id: 'tag-caught', instance_id: 'caught-fav' },
      { key: 'tag-wanted:wanted-most', tag_id: 'tag-wanted', instance_id: 'wanted-most' },
      { key: 'legacy-trade-parent:caught-fav', tag_id: 'legacy-trade-parent', instance_id: 'caught-fav' },
      { key: 'deleted-tag:caught-fav', tag_id: 'deleted-tag', instance_id: 'caught-fav' },
    ]);

    await useTagsStore.getState().rebuildCustomTags();

    const state = useTagsStore.getState();
    expect(state.customTags.caught).toHaveProperty('tag-caught');
    expect(state.customTags.caught['tag-caught'].items).toHaveProperty('caught-fav');

    expect(state.customTags.wanted).toHaveProperty('tag-wanted');

    expect(state.customTags.caught).not.toHaveProperty('legacy-trade-parent');
    expect(state.customTags.caught).not.toHaveProperty('deleted-tag');
  });

  it('reacts to instances-store updates via subscription quick rebuild', async () => {
    useVariantsStore.setState({ variants: variantsFixture, variantsLoading: false });
    useInstancesStore.setState({
      instances: {
        'caught-fav': {
          instance_id: 'caught-fav',
          variant_id: '0001-default',
          pokemon_id: 1,
          shiny: false,
          is_caught: true,
          is_for_trade: false,
          is_wanted: false,
          favorite: true,
          most_wanted: false,
          registered: true,
          mirror: false,
          pref_lucky: false,
          gender: 'Male',
        },
      } as any,
      instancesLoading: false,
    });

    await Promise.resolve();

    const state = useTagsStore.getState();
    expect(state.tags.caught).toHaveProperty('caught-fav');
    expect(state.systemChildren.caught.favorite).toHaveProperty('caught-fav');
    expect(dbMocks.persistSystemMembershipsFromBuckets).toHaveBeenCalled();
  });
});
