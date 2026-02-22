import type { PokemonInstance } from '@pokemongonexus/shared-contracts/instances';
import {
  mutateInstanceFavorite,
  mutateInstanceBattleStats,
  mutateInstanceCaughtDetails,
  mutateInstanceAura,
  mutateInstanceLocationDetails,
  mutateInstanceMaxStats,
  mutateInstanceMoves,
  mutateInstanceFusion,
  mutateInstanceMega,
  mutateInstanceAddTag,
  mutateInstanceClearTags,
  mutateInstanceRemoveTag,
  mutateInstanceSetTags,
  mutateInstanceMostWanted,
  mutateInstanceNickname,
  mutateInstanceStatus,
  toReceiverPokemonPayload,
} from '../../../../src/features/instances/instanceMutations';

const makeBaseInstance = (): PokemonInstance =>
  ({
    instance_id: 'i1',
    variant_id: 'v-001',
    pokemon_id: 1,
    nickname: null,
    cp: null,
    level: null,
    attack_iv: null,
    defense_iv: null,
    stamina_iv: null,
    shiny: false,
    costume_id: null,
    lucky: false,
    shadow: false,
    purified: false,
    fast_move_id: null,
    charged_move1_id: null,
    charged_move2_id: null,
    weight: null,
    height: null,
    gender: null,
    mega: false,
    mega_form: null,
    is_mega: false,
    dynamax: false,
    gigantamax: false,
    crown: false,
    max_attack: null,
    max_guard: null,
    max_spirit: null,
    is_fused: false,
    fusion: null,
    fusion_form: null,
    fused_with: null,
    is_traded: false,
    traded_date: null,
    original_trainer_id: null,
    original_trainer_name: null,
    is_caught: true,
    is_for_trade: false,
    is_wanted: false,
    most_wanted: false,
    caught_tags: null,
    trade_tags: null,
    wanted_tags: null,
    not_trade_list: null,
    not_wanted_list: null,
    trade_filters: null,
    wanted_filters: null,
    mirror: false,
    pref_lucky: false,
    registered: true,
    favorite: false,
    disabled: false,
    pokeball: null,
    location_card: null,
    location_caught: null,
    date_caught: null,
    date_added: '2026-01-01T00:00:00Z',
    last_update: 1,
  }) as PokemonInstance;

describe('instanceMutations', () => {
  it('mutates status to trade and keeps instance caught', () => {
    const next = mutateInstanceStatus(makeBaseInstance(), 'trade', 100);
    expect(next.is_caught).toBe(true);
    expect(next.is_for_trade).toBe(true);
    expect(next.is_wanted).toBe(false);
    expect(next.registered).toBe(true);
    expect(next.last_update).toBe(100);
  });

  it('mutates status to missing and clears registration', () => {
    const next = mutateInstanceStatus(
      {
        ...makeBaseInstance(),
        is_wanted: true,
        most_wanted: true,
      },
      'missing',
      101,
    );
    expect(next.is_caught).toBe(false);
    expect(next.is_for_trade).toBe(false);
    expect(next.is_wanted).toBe(false);
    expect(next.most_wanted).toBe(false);
    expect(next.registered).toBe(false);
    expect(next.last_update).toBe(101);
  });

  it('applies favorite/most_wanted/nickname mutations safely', () => {
    const favorite = mutateInstanceFavorite(makeBaseInstance(), true, 102);
    expect(favorite.favorite).toBe(true);
    expect(favorite.last_update).toBe(102);

    const wanted = mutateInstanceStatus(makeBaseInstance(), 'wanted', 103);
    const mostWanted = mutateInstanceMostWanted(wanted, true, 104);
    expect(mostWanted.most_wanted).toBe(true);

    const caught = mutateInstanceStatus(makeBaseInstance(), 'caught', 105);
    const blockedMostWanted = mutateInstanceMostWanted(caught, true, 106);
    expect(blockedMostWanted.most_wanted).toBe(false);

    const nicknamed = mutateInstanceNickname(makeBaseInstance(), 'Buddy', 107);
    expect(nicknamed.nickname).toBe('Buddy');
    expect(nicknamed.last_update).toBe(107);
  });

  it('applies CP/level/IV mutations safely', () => {
    const next = mutateInstanceBattleStats(
      makeBaseInstance(),
      {
        cp: 2500,
        level: 40,
        attackIv: 15,
        defenseIv: 14,
        staminaIv: 13,
      },
      108,
    );
    expect(next.cp).toBe(2500);
    expect(next.level).toBe(40);
    expect(next.attack_iv).toBe(15);
    expect(next.defense_iv).toBe(14);
    expect(next.stamina_iv).toBe(13);
    expect(next.last_update).toBe(108);
  });

  it('applies caught-detail mutations safely', () => {
    const next = mutateInstanceCaughtDetails(
      makeBaseInstance(),
      {
        gender: 'male',
        dateCaught: '2026-02-22',
      },
      109,
    );
    expect(next.gender).toBe('male');
    expect(next.date_caught).toBe('2026-02-22');
    expect(next.last_update).toBe(109);
  });

  it('applies move-id mutations safely', () => {
    const next = mutateInstanceMoves(
      makeBaseInstance(),
      {
        fastMoveId: 216,
        chargedMove1Id: 90,
        chargedMove2Id: 14,
      },
      110,
    );
    expect(next.fast_move_id).toBe(216);
    expect(next.charged_move1_id).toBe(90);
    expect(next.charged_move2_id).toBe(14);
    expect(next.last_update).toBe(110);
  });

  it('normalizes aura mutations safely', () => {
    const purified = mutateInstanceAura(
      makeBaseInstance(),
      {
        lucky: true,
        shadow: true,
        purified: true,
      },
      111,
    );
    expect(purified.shadow).toBe(false);
    expect(purified.purified).toBe(true);
    expect(purified.lucky).toBe(true);

    const shadow = mutateInstanceAura(
      makeBaseInstance(),
      {
        lucky: true,
        shadow: true,
        purified: false,
      },
      112,
    );
    expect(shadow.shadow).toBe(true);
    expect(shadow.purified).toBe(false);
    expect(shadow.lucky).toBe(false);
  });

  it('applies location-detail mutations safely', () => {
    const next = mutateInstanceLocationDetails(
      makeBaseInstance(),
      {
        locationCaught: 'Seattle, WA',
        locationCard: '1234',
      },
      113,
    );
    expect(next.location_caught).toBe('Seattle, WA');
    expect(next.location_card).toBe('1234');
    expect(next.last_update).toBe(113);
  });

  it('applies max-stat mutations safely', () => {
    const next = mutateInstanceMaxStats(
      makeBaseInstance(),
      {
        maxAttack: 3,
        maxGuard: 2,
        maxSpirit: 1,
      },
      114,
    );
    expect(next.max_attack).toBe(3);
    expect(next.max_guard).toBe(2);
    expect(next.max_spirit).toBe(1);
    expect(next.last_update).toBe(114);
  });

  it('applies mega/fusion/tag mutations safely', () => {
    const megaEnabled = mutateInstanceMega(makeBaseInstance(), true, 'mega_x', 115);
    expect(megaEnabled.mega).toBe(true);
    expect(megaEnabled.is_mega).toBe(true);
    expect(megaEnabled.mega_form).toBe('mega_x');

    const megaDisabled = mutateInstanceMega(megaEnabled, false, null, 116);
    expect(megaDisabled.mega).toBe(false);
    expect(megaDisabled.is_mega).toBe(false);
    expect(megaDisabled.mega_form).toBeNull();

    const fusionEnabled = mutateInstanceFusion(makeBaseInstance(), true, 'dawn_wings', 117);
    expect(fusionEnabled.is_fused).toBe(true);
    expect(fusionEnabled.fusion_form).toBe('dawn_wings');
    expect(fusionEnabled.fusion).toEqual({});

    const fusionDisabled = mutateInstanceFusion(fusionEnabled, false, null, 118);
    expect(fusionDisabled.is_fused).toBe(false);
    expect(fusionDisabled.fusion_form).toBeNull();
    expect(fusionDisabled.fusion).toBeNull();

    const tags1 = mutateInstanceAddTag(makeBaseInstance(), 'caught', 'Great League', 119);
    expect(tags1.caught_tags).toEqual(['Great League']);

    const tags2 = mutateInstanceAddTag(tags1, 'caught', 'great league', 120);
    expect(tags2.caught_tags).toEqual(['Great League']);

    const tags3 = mutateInstanceAddTag(tags2, 'trade', 'regional', 121);
    expect(tags3.trade_tags).toEqual(['regional']);

    const tags4 = mutateInstanceRemoveTag(tags3, 'caught', 'great league', 122);
    expect(tags4.caught_tags).toEqual([]);

    const tags5 = mutateInstanceRemoveTag(tags4, 'trade', 'Regional', 123);
    expect(tags5.trade_tags).toEqual([]);

    const tags6 = mutateInstanceSetTags(tags5, 'wanted', ['PVP', 'pvp', '  raid  '], 124);
    expect(tags6.wanted_tags).toEqual(['PVP', 'raid']);

    const tags7 = mutateInstanceClearTags(tags6, 'wanted', 125);
    expect(tags7.wanted_tags).toEqual([]);
  });

  it('builds receiver payload with key + instance_id', () => {
    const payload = toReceiverPokemonPayload(makeBaseInstance());
    expect(payload).toEqual(
      expect.objectContaining({
        operation: 'updatePokemon',
        key: 'i1',
        instance_id: 'i1',
      }),
    );
  });
});
