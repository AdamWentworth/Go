import {
  buildPokemonSearchQuery,
  defaultSearchFormState,
} from '../../../../src/features/search/searchQueryBuilder';

describe('searchQueryBuilder', () => {
  it('builds query with sane defaults', () => {
    const query = buildPokemonSearchQuery(defaultSearchFormState);

    expect(query).toMatchObject({
      pokemon_id: 1,
      shiny: false,
      shadow: false,
      latitude: 0,
      longitude: 0,
      ownership: 'caught',
      range_km: 100,
      limit: 50,
      dynamax: false,
      gigantamax: false,
      only_matching_trades: null,
      pref_lucky: null,
      already_registered: null,
      trade_in_wanted_list: null,
    });
  });

  it('maps optional fields and tri-state booleans correctly', () => {
    const query = buildPokemonSearchQuery({
      ...defaultSearchFormState,
      pokemonIdInput: '150',
      ownershipMode: 'trade',
      shinyInput: 'true',
      shadowInput: 'true',
      dynamaxInput: 'true',
      gigantamaxInput: 'false',
      costumeIdInput: '8',
      fastMoveIdInput: '16',
      chargedMove1Input: '90',
      chargedMove2Input: '42',
      genderInput: 'female',
      backgroundIdInput: '7',
      attackIvInput: '14',
      defenseIvInput: '13',
      staminaIvInput: '12',
      onlyMatchingTradesInput: 'true',
      prefLuckyInput: 'false',
      alreadyRegisteredInput: 'true',
      tradeInWantedListInput: 'false',
      friendshipLevelInput: '4',
    });

    expect(query).toMatchObject({
      pokemon_id: 150,
      ownership: 'trade',
      shiny: true,
      shadow: true,
      dynamax: true,
      gigantamax: false,
      costume_id: 8,
      fast_move_id: 16,
      charged_move_1_id: 90,
      charged_move_2_id: 42,
      gender: 'female',
      background_id: 7,
      attack_iv: 14,
      defense_iv: 13,
      stamina_iv: 12,
      only_matching_trades: true,
      pref_lucky: false,
      already_registered: true,
      trade_in_wanted_list: false,
      friendship_level: 4,
    });
  });

  it('normalizes invalid optional number inputs to null', () => {
    const query = buildPokemonSearchQuery({
      ...defaultSearchFormState,
      costumeIdInput: 'x',
      fastMoveIdInput: ' ',
      chargedMove1Input: 'abc',
      chargedMove2Input: '',
      backgroundIdInput: 'z',
      attackIvInput: 'nan',
      defenseIvInput: '',
      staminaIvInput: '!',
      friendshipLevelInput: 'unknown',
    });

    expect(query.costume_id).toBeNull();
    expect(query.fast_move_id).toBeNull();
    expect(query.charged_move_1_id).toBeNull();
    expect(query.charged_move_2_id).toBeNull();
    expect(query.background_id).toBeNull();
    expect(query.attack_iv).toBeNull();
    expect(query.defense_iv).toBeNull();
    expect(query.stamina_iv).toBeNull();
    expect(query.friendship_level).toBeNull();
  });
});

