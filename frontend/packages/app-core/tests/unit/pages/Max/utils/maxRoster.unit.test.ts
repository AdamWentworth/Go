import { describe, expect, it } from 'vitest';

import { buildMaxRoster } from '@/pages/Max/utils/maxRoster';
import type { InstancesMap, PokemonInstance } from '@/types/pokemonInstance';
import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const move = (id: number, name: string, fast: boolean): Move =>
  ({
    move_id: id,
    name,
    is_fast: fast ? 1 : 0,
    raid_power: fast ? 10 : 100,
    raid_energy: fast ? 10 : -50,
    raid_cooldown: fast ? 0.5 : 2,
    type_name: 'grass',
    type: 'grass',
  }) as Move;

const variant = (
  variantId: string,
  variantType: string,
  moves: Move[],
): PokemonVariant =>
  ({
    variant_id: variantId,
    variantType,
    pokemon_id: 1,
    pokedex_number: 1,
    name: variantType.includes('shiny') ? 'Shiny Bulbasaur' : 'Bulbasaur',
    species_name: 'Bulbasaur',
    attack: 118,
    defense: 111,
    stamina: 128,
    type1_name: 'grass',
    type2_name: 'poison',
    currentImage: `/${variantType}.png`,
    moves,
  }) as PokemonVariant;

const caughtInstance = (
  overrides: Partial<PokemonInstance> = {},
): PokemonInstance =>
  ({
    instance_id: 'caught-1',
    variant_id: '1-default',
    pokemon_id: 1,
    nickname: null,
    cp: 927,
    level: 30,
    attack_iv: 15,
    defense_iv: 13,
    stamina_iv: 12,
    shiny: false,
    fast_move_id: 1,
    dynamax: true,
    gigantamax: false,
    crown: false,
    max_attack: 2,
    max_guard: 1,
    max_spirit: 3,
    is_caught: true,
    disabled: false,
    ...overrides,
  }) as PokemonInstance;

describe('Max caught roster adapter', () => {
  const fast = move(1, 'Vine Whip', true);
  const otherFast = move(2, 'Tackle', true);
  const charged = move(3, 'Power Whip', false);
  const variants = [
    variant('1-default', 'default', [fast, otherFast, charged]),
    variant('1-dynamax', 'dynamax', [fast, otherFast, charged]),
    variant('1-shiny-dynamax', 'shiny_dynamax', [fast, otherFast, charged]),
    variant('1-gigantamax', 'gigantamax', [fast, otherFast, charged]),
    variant('1-shiny-gigantamax', 'shiny_gigantamax', [fast, otherFast, charged]),
  ];

  it('projects a caught Dynamax copy with only its recorded Fast Move', () => {
    const instances: InstancesMap = { caught: caughtInstance() };

    const roster = buildMaxRoster(variants, instances);

    expect(roster).toMatchObject({
      caughtCount: 1,
      eligibleCount: 1,
      incompleteEntryCount: 0,
      unmappedCount: 0,
    });
    expect(roster.pokemon[0]).toMatchObject({
      variantType: 'dynamax',
      instanceData: {
        instance_id: 'caught-1',
        level: 30,
        max_attack: 2,
        max_guard: 1,
        max_spirit: 3,
      },
      raidRoster: {
        source: 'caught',
        moveSource: 'recorded',
        levelSource: 'recorded',
      },
    });
    expect(roster.pokemon[0].moves?.map((entry) => entry.move_id)).toEqual([
      fast.move_id,
      charged.move_id,
    ]);
  });

  it('selects the caught copy\'s shiny Gigantamax form', () => {
    const instances: InstancesMap = {
      caught: caughtInstance({ shiny: true, dynamax: true, gigantamax: true }),
    };

    const roster = buildMaxRoster(variants, instances);

    expect(roster.pokemon[0].variantType).toBe('shiny_gigantamax');
  });

  it('omits non-Max and incomplete caught copies with an honest summary', () => {
    const instances: InstancesMap = {
      ordinary: caughtInstance({
        instance_id: 'ordinary',
        dynamax: false,
        gigantamax: false,
      }),
      incomplete: caughtInstance({
        instance_id: 'incomplete',
        attack_iv: null,
      }),
    };

    const roster = buildMaxRoster(variants, instances);

    expect(roster.pokemon).toEqual([]);
    expect(roster.caughtCount).toBe(1);
    expect(roster.incompleteEntryCount).toBe(1);
  });

  it('projects an unlocked Crowned form into the personal Max roster', () => {
    const metalClaw = {
      ...move(29, 'Metal Claw', true),
      type_name: 'steel',
      type: 'steel',
    };
    const behemothBlade = {
      ...move(468, 'Behemoth Blade', false),
      type_name: 'steel',
      type: 'steel',
    };
    const zacian = {
      ...variant('0888-default', 'default', [metalClaw]),
      pokemon_id: 888,
      pokedex_number: 888,
      name: 'Zacian',
      species_name: 'Zacian',
      crownForms: [
        {
          id: 1,
          base_pokemon_id: 888,
          crown_pokemon_id: 2_288,
          display_form: 'Crowned Sword',
          name: 'Crowned Sword Zacian',
          form: 'Crowned_sword',
          attack: 332,
          defense: 240,
          stamina: 192,
          type_1_id: 18,
          type_2_id: 17,
          type1_name: 'fairy',
          type2_name: 'steel',
          moves: [metalClaw, behemothBlade],
        },
      ],
    } as PokemonVariant;
    const crownedCatalog = {
      ...zacian,
      variant_id: '2288-default',
      pokemon_id: 2_288,
      crownForms: [],
    } as PokemonVariant;
    const instances: InstancesMap = {
      zacian: caughtInstance({
        instance_id: 'crowned-zacian',
        variant_id: '0888-default',
        pokemon_id: 888,
        fast_move_id: 29,
        dynamax: false,
        crown: true,
        crown_form: 'Crowned_sword',
      }),
    };

    const roster = buildMaxRoster([zacian, crownedCatalog], instances);

    expect(roster.pokemon).toHaveLength(1);
    expect(roster.pokemon[0]).toMatchObject({
      pokemon_id: 888,
      form: 'Crowned_sword',
      raidRoster: { formSource: 'crown' },
    });
    expect(roster.pokemon[0].moves?.map((entry) => entry.name)).toEqual([
      'Metal Claw',
      'Behemoth Blade',
    ]);
  });
});
