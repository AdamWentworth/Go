// tests/instances/unit/updatePokemonInstanceStatus.unit.test.ts
import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { updatePokemonInstanceStatus } from '@/features/instances/services/updatePokemonInstanceStatus';
import * as PokemonIDUtils from '@/utils/PokemonIDUtils';
import * as instanceUtils from '@/features/instances/utils/createNewInstanceData';
import * as registrationUtils from '@/features/instances/utils/updateRegistrationStatus';
import { enableLogging, testLogger } from '../../setupTests';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';

function makeInstance(overrides: Partial<PokemonInstance> = {}): PokemonInstance {
  return {
    pokemon_id: 1,
    pokemonKey: '0001-bulbasaur',
    is_owned: false,
    is_unowned: true,
    is_for_trade: false,
    is_wanted: false,
    registered: false,
    shiny: false,
    shadow: false,
    lucky: false,
    mega: false,
    is_mega: false,
    dynamax: false,
    gigantamax: false,
    purified: false,
    last_update: 0,
    ...overrides,
  } as PokemonInstance;
}

function makeVariant(overrides: Partial<PokemonVariant> = {}): PokemonVariant {
  return {
    pokemon_id: 1,
    pokemonKey: '0001-bulbasaur',
    costumes: [],
    ...overrides,
  } as PokemonVariant;
}

describe('updatePokemonInstanceStatus (unit)', () => {
  let instancesData: Instances;
  let variants: PokemonVariant[];

  beforeAll(() => {
    enableLogging('verbose');
    testLogger.fileStart('updatePokemonInstanceStatus');
    testLogger.suiteStart('updatePokemonInstanceStatus unit tests');
  });

  afterAll(() => {
    testLogger.suiteComplete();
    testLogger.fileEnd();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    instancesData = {};
    variants = [makeVariant()];
    vi.spyOn(PokemonIDUtils, 'generateUUID').mockReturnValue('UUID123');
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockImplementation((key) => ({
      baseKey: key.includes('_UUID') ? key.split('_UUID')[0] : key,
      hasUUID: key.includes('_UUID'),
    }));
    vi.spyOn(instanceUtils, 'createNewInstanceData').mockImplementation((variant) =>
      makeInstance({ pokemon_id: variant.pokemon_id, pokemonKey: variant.pokemonKey })
    );
    vi.spyOn(registrationUtils, 'updateRegistrationStatus').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    testLogger.suiteComplete();
  });

  it('updates status flags for existing instance with UUID', async () => {
    testLogger.suiteStart('updates status flags with UUID');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance();
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      is_owned: true,
      is_unowned: false,
      is_for_trade: false,
      is_wanted: false,
    });
    expect(registrationUtils.updateRegistrationStatus).toHaveBeenCalledWith(
      instancesData[key],
      instancesData
    );
    testLogger.assertion('status flags updated and registration status called');
    testLogger.suiteComplete();
  });

  it('reuses unowned instance for base key if available', async () => {
    testLogger.suiteStart('reuses unowned instance for base key');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({ is_unowned: true, is_wanted: false });
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: false });

    const result = await updatePokemonInstanceStatus('0001-bulbasaur', 'Owned', variants, instancesData);

    expect(result).toBe(key);
    expect(instancesData[key]).toMatchObject({
      is_owned: true,
      is_unowned: false,
    });
    expect(instanceUtils.createNewInstanceData).not.toHaveBeenCalled();
    testLogger.assertion('reused existing unowned instance');
    testLogger.suiteComplete();
  });

  it('creates new instance for base key when no unowned slots exist', async () => {
    testLogger.suiteStart('creates new instance for base key');
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: false });

    const result = await updatePokemonInstanceStatus('0001-bulbasaur', 'Wanted', variants, instancesData);

    expect(result).toBe('0001-bulbasaur_UUID123');
    expect(instancesData['0001-bulbasaur_UUID123']).toMatchObject({
      pokemon_id: 1,
      pokemonKey: '0001-bulbasaur',
      is_wanted: true,
      is_unowned: true,
    });
    expect(instanceUtils.createNewInstanceData).toHaveBeenCalledWith(variants[0]);
    expect(registrationUtils.updateRegistrationStatus).toHaveBeenCalledWith(
      instancesData['0001-bulbasaur_UUID123'],
      instancesData
    );
    testLogger.assertion('new instance created with UUID');
    testLogger.suiteComplete();
  });

  it('blocks Trade/Wanted for shadow Pokémon', async () => {
    testLogger.suiteStart('blocks Trade/Wanted for shadow Pokémon');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({ shadow: true });
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    const result = await updatePokemonInstanceStatus(key, 'Trade', variants, instancesData);

    expect(result).toBe(key);
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Cannot move 0001-bulbasaur_UUID1 to Trade as it is shadow')
    );
    expect(console.log).toHaveBeenCalledWith('[update] blocked due to special status');
    expect(instancesData[key]).toMatchObject({
      is_for_trade: false,
      shadow: true,
    });
    testLogger.assertion('Trade blocked for shadow Pokémon');
    testLogger.suiteComplete();
  });

  it('blocks Trade/Wanted for lucky Pokémon', async () => {
    testLogger.suiteStart('blocks Trade/Wanted for lucky Pokémon');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({ lucky: true });
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Wanted', variants, instancesData);

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Cannot move 0001-bulbasaur_UUID1 to Wanted as it is lucky')
    );
    expect(console.log).toHaveBeenCalledWith('[update] blocked due to special status');
    expect(instancesData[key]).toMatchObject({
      is_wanted: false,
      lucky: true,
    });
    testLogger.assertion('Wanted blocked for lucky Pokémon');
    testLogger.suiteComplete();
  });

  it('blocks Trade/Wanted for mega Pokémon', async () => {
    testLogger.suiteStart('blocks Trade/Wanted for mega Pokémon');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({ is_mega: true });
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Trade', variants, instancesData);

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Cannot move 0001-bulbasaur_UUID1 to Trade as it is mega')
    );
    expect(console.log).toHaveBeenCalledWith('[update] blocked due to special status');
    expect(instancesData[key]).toMatchObject({
      is_for_trade: false,
      is_mega: true,
    });
    testLogger.assertion('Trade blocked for mega Pokémon');
    testLogger.suiteComplete();
  });

  it('blocks Trade/Wanted for fusion Pokémon (ID 2270/2271)', async () => {
    testLogger.suiteStart('blocks Trade/Wanted for fusion Pokémon');
    const key = '2270-fusion_UUID1';
    instancesData[key] = makeInstance({ pokemon_id: 2270, pokemonKey: '2270-fusion' });
    variants = [makeVariant({ pokemon_id: 2270, pokemonKey: '2270-fusion' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '2270-fusion', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Trade', variants, instancesData);

    expect(window.alert).toHaveBeenCalledWith(
      expect.stringContaining('Cannot move 2270-fusion_UUID1 to Trade as it is a fusion Pokémon')
    );
    expect(console.log).toHaveBeenCalledWith('[update] blocked due to special status');
    expect(instancesData[key]).toMatchObject({
      is_for_trade: false,
      pokemon_id: 2270,
    });
    testLogger.assertion('Trade blocked for fusion Pokémon');
    testLogger.suiteComplete();
  });

  it('sets purified flag for 2301-default and 2302-default', async () => {
    testLogger.suiteStart('sets purified flag for 2301-default and 2302-default');
    
    // Test 2301-default
    let key = '2301-default_UUID1';
    instancesData[key] = makeInstance({ pokemon_id: 2301, pokemonKey: '2301-default' });
    variants = [makeVariant({ pokemon_id: 2301, pokemonKey: '2301-default' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '2301-default', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      purified: true,
      is_owned: true,
    });
    testLogger.assertion('purified flag set for 2301-default');

    // Test 2302-default
    key = '2302-default_UUID2';
    instancesData[key] = makeInstance({ pokemon_id: 2302, pokemonKey: '2302-default' });
    variants = [makeVariant({ pokemon_id: 2302, pokemonKey: '2302-default' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '2302-default', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      purified: true,
      is_owned: true,
    });
    testLogger.assertion('purified flag set for 2302-default');
    testLogger.suiteComplete();
  });

  it('does not set purified flag for 2301-shadow or 2302-shadow', async () => {
    testLogger.suiteStart('does not set purified flag for 2301-shadow or 2302-shadow');
    
    // Test 2301-shadow
    let key = '2301-shadow_UUID1';
    instancesData[key] = makeInstance({ pokemon_id: 2301, pokemonKey: '2301-shadow' });
    variants = [makeVariant({ pokemon_id: 2301, pokemonKey: '2301-shadow' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '2301-shadow', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      purified: false,
      is_owned: true,
    });
    testLogger.assertion('purified flag not set for 2301-shadow');

    // Test 2302-shadow
    key = '2302-shadow_UUID2';
    instancesData[key] = makeInstance({ pokemon_id: 2302, pokemonKey: '2302-shadow' });
    variants = [makeVariant({ pokemon_id: 2302, pokemonKey: '2302-shadow' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '2302-shadow', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      purified: false,
      is_owned: true,
    });
    testLogger.assertion('purified flag not set for 2302-shadow');
    testLogger.suiteComplete();
  });

  it('sets dynamax flag when key includes dynamax', async () => {
    testLogger.suiteStart('sets dynamax flag when key includes dynamax');
    const key = '0001-bulbasaur_dynamax_UUID1';
    instancesData[key] = makeInstance({ pokemonKey: '0001-bulbasaur_dynamax' });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur_dynamax' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur_dynamax', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      dynamax: true,
      is_owned: true,
    });
    testLogger.assertion('dynamax flag set correctly');
    testLogger.suiteComplete();
  });

  it('sets gigantamax flag when key includes gigantamax', async () => {
    testLogger.suiteStart('sets gigantamax flag when key includes gigantamax');
    const key = '0001-bulbasaur_gigantamax_UUID1';
    instancesData[key] = makeInstance({ pokemonKey: '0001-bulbasaur_gigantamax' });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur_gigantamax' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur_gigantamax', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Owned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      gigantamax: true,
      is_owned: true,
    });
    testLogger.assertion('gigantamax flag set correctly');
    testLogger.suiteComplete();
  });

  it('sets is_unowned to false for Wanted status when an owned sibling instance exists', async () => {
    testLogger.suiteStart('sets is_unowned to false for Wanted status when an owned sibling exists');
    instancesData['0001-bulbasaur_UUID1'] = makeInstance({ is_owned: true, pokemonKey: '0001-bulbasaur' });
    instancesData['0001-bulbasaur_UUID2'] = makeInstance({ pokemonKey: '0001-bulbasaur' });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus('0001-bulbasaur_UUID2', 'Wanted', variants, instancesData);

    expect(instancesData['0001-bulbasaur_UUID2']).toMatchObject({
      is_wanted: true,
      is_unowned: false,
    });
    testLogger.assertion('is_unowned is false because an owned sibling instance exists for the same Pokémon species');
    testLogger.suiteComplete();
  });

  it('transitions from Owned to Trade status', async () => {
    testLogger.suiteStart('transitions from Owned to Trade status');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({ is_owned: true, pokemonKey: '0001-bulbasaur' });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Trade', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      is_owned: true,
      is_for_trade: true,
      is_wanted: false,
      is_unowned: false,
      registered: true,
    });
    expect(registrationUtils.updateRegistrationStatus).toHaveBeenCalledWith(
      instancesData[key],
      instancesData
    );
    testLogger.assertion('successfully transitioned from Owned to Trade status');
    testLogger.suiteComplete();
  });

  it('transitions from Trade to Unowned status', async () => {
    testLogger.suiteStart('transitions from Trade to Unowned status');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({
      is_owned: true,
      is_for_trade: true,
      is_unowned: false,
      pokemonKey: '0001-bulbasaur',
    });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus(key, 'Unowned', variants, instancesData);

    expect(instancesData[key]).toMatchObject({
      is_owned: false,
      is_for_trade: false,
      is_wanted: false,
      is_unowned: true,
      registered: false,
    });
    expect(registrationUtils.updateRegistrationStatus).toHaveBeenCalledWith(
      instancesData[key],
      instancesData
    );
    testLogger.assertion('successfully transitioned from Trade to Unowned status');
    testLogger.suiteComplete();
  });

  it('creates new instance when transitioning from Owned to Wanted status', async () => {
    testLogger.suiteStart('creates new instance when transitioning from Owned to Wanted status');
    const key = '0001-bulbasaur_UUID1';
    instancesData[key] = makeInstance({ is_owned: true, pokemonKey: '0001-bulbasaur' });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    const result = await updatePokemonInstanceStatus(key, 'Wanted', variants, instancesData);

    expect(result).toBe('0001-bulbasaur_UUID123');
    expect(instancesData['0001-bulbasaur_UUID123']).toMatchObject({
      is_wanted: true,
      is_owned: false,
      is_for_trade: false,
      is_unowned: false,
      registered: true,
    });
    expect(instancesData[key]).toMatchObject({
      is_owned: true,
      is_wanted: false,
      is_unowned: false,
    });
    expect(registrationUtils.updateRegistrationStatus).toHaveBeenCalledWith(
      instancesData['0001-bulbasaur_UUID123'],
      instancesData
    );
    testLogger.assertion('new instance created for Wanted status when current instance is owned');
    testLogger.suiteComplete();
  });

  it('sets sibling instance is_unowned to false when transitioning to Owned status', async () => {
    testLogger.suiteStart('sets sibling instance is_unowned to false when transitioning to Owned status');
    instancesData['0001-bulbasaur_UUID1'] = makeInstance({ pokemonKey: '0001-bulbasaur', is_unowned: true });
    instancesData['0001-bulbasaur_UUID2'] = makeInstance({ pokemonKey: '0001-bulbasaur', is_unowned: true });
    variants = [makeVariant({ pokemonKey: '0001-bulbasaur' })];
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: true });

    await updatePokemonInstanceStatus('0001-bulbasaur_UUID1', 'Owned', variants, instancesData);

    expect(instancesData['0001-bulbasaur_UUID1']).toMatchObject({
      is_owned: true,
      is_unowned: false,
      is_wanted: false,
      is_for_trade: false,
    });
    expect(instancesData['0001-bulbasaur_UUID2']).toMatchObject({
      is_unowned: false,
    });
    expect(registrationUtils.updateRegistrationStatus).toHaveBeenCalledWith(
      instancesData['0001-bulbasaur_UUID1'],
      instancesData
    );
    testLogger.assertion('sibling instance is_unowned set to false when transitioning to Owned');
    testLogger.suiteComplete();
  });

  it('returns null and logs error when no variant for baseKey', async () => {
    testLogger.suiteStart('handles missing variant');
    vi.spyOn(PokemonIDUtils, 'parsePokemonKey').mockReturnValue({ baseKey: '0001-bulbasaur', hasUUID: false });

    const result = await updatePokemonInstanceStatus('0001-bulbasaur', 'Owned', [], instancesData);

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      '[updatePokemonInstanceStatus] No variant for',
      '0001-bulbasaur'
    );
    testLogger.assertion('null returned for missing variant');
    testLogger.suiteComplete();
  });
});