import {
  clearNativeSearchSession,
  patchNativeSearchSession,
  readNativeSearchSession,
  writeNativeSearchSession,
} from '../../../../src/features/search/nativeSearchSessionCache';
import { createNativePokemonSearchDraft } from '../../../../src/features/search/nativePokemonSearchDraft';

const pokemonQuery = {
  pokemon_id: 25,
  shiny: false,
  shadow: false,
  costume_id: null,
  fast_move_id: null,
  charged_move_1_id: null,
  charged_move_2_id: null,
  gender: null,
  background_id: null,
  attack_iv: null,
  defense_iv: null,
  stamina_iv: null,
  only_matching_trades: null,
  pref_lucky: null,
  friendship_level: null,
  already_registered: null,
  trade_in_wanted_list: null,
  latitude: 49.25,
  longitude: -122.98,
  ownership: 'trade' as const,
  range_km: 25,
  limit: 20,
  dynamax: false,
  gigantamax: false,
};

describe('nativeSearchSessionCache', () => {
  beforeEach(() => clearNativeSearchSession());

  it('keeps each trainer search session isolated in memory', () => {
    const draft = createNativePokemonSearchDraft({ city: 'Burnaby' });
    writeNativeSearchSession({
      activeView: 'pokemon',
      draft,
      executedDraft: draft,
      ownerKey: 'trainer-1',
      pokemonQuery,
      pokemonScrollOffset: 480,
      trainerQuery: '',
      trainerScrollOffset: 0,
    });

    expect(readNativeSearchSession('trainer-1')).toEqual(expect.objectContaining({
      activeView: 'pokemon',
      pokemonScrollOffset: 480,
    }));
    expect(readNativeSearchSession('trainer-2')).toBeNull();
  });

  it('patches navigation and scroll context without losing the executed search', () => {
    const draft = createNativePokemonSearchDraft({ city: 'Burnaby' });
    writeNativeSearchSession({
      activeView: 'pokemon',
      draft,
      executedDraft: draft,
      ownerKey: 'trainer-1',
      pokemonQuery,
      pokemonScrollOffset: 0,
      trainerQuery: '',
      trainerScrollOffset: 0,
    });

    patchNativeSearchSession('trainer-1', {
      activeView: 'trainers',
      pokemonScrollOffset: 720,
      trainerQuery: 'misty',
    });

    expect(readNativeSearchSession('trainer-1')).toEqual(expect.objectContaining({
      activeView: 'trainers',
      executedDraft: draft,
      pokemonQuery: expect.objectContaining({ pokemon_id: 25 }),
      pokemonScrollOffset: 720,
      trainerQuery: 'misty',
    }));
  });

  it('can clear one trainer without affecting another', () => {
    for (const ownerKey of ['trainer-1', 'trainer-2']) {
      writeNativeSearchSession({
        activeView: 'pokemon',
        draft: createNativePokemonSearchDraft(),
        executedDraft: null,
        ownerKey,
        pokemonQuery: null,
        pokemonScrollOffset: 0,
        trainerQuery: '',
        trainerScrollOffset: 0,
      });
    }

    clearNativeSearchSession('trainer-1');

    expect(readNativeSearchSession('trainer-1')).toBeNull();
    expect(readNativeSearchSession('trainer-2')).not.toBeNull();
  });
});
