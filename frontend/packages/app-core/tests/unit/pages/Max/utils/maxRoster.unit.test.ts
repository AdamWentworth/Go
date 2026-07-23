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

  it.each([
    {
      legacyPokemonId: 2290,
      currentPokemonId: 888,
      form: 'Crowned_sword',
      species: 'Zacian',
      fastMoveId: 29,
      fastMoveName: 'Metal Claw',
      maxMoveId: 468,
      maxMoveName: 'Behemoth Blade',
    },
    {
      legacyPokemonId: 2292,
      currentPokemonId: 889,
      form: 'Crowned_shield',
      species: 'Zamazenta',
      fastMoveId: 29,
      fastMoveName: 'Metal Claw',
      maxMoveId: 469,
      maxMoveName: 'Behemoth Bash',
    },
  ])(
    'maps a caught legacy $species entry to its current Crowned catalog form',
    ({
      legacyPokemonId,
      currentPokemonId,
      form,
      species,
      fastMoveId,
      fastMoveName,
      maxMoveId,
      maxMoveName,
    }) => {
      const fastMove = move(fastMoveId, fastMoveName, true);
      const maxMove = move(maxMoveId, maxMoveName, false);
      const current = {
        ...variant(
          `${String(currentPokemonId).padStart(4, '0')}-default`,
          'default',
          [fastMove, maxMove],
        ),
        pokemon_id: currentPokemonId,
        pokedex_number: currentPokemonId,
        name: species,
        species_name: species,
        form,
      } as PokemonVariant;
      const hero = {
        ...variant(
          `${legacyPokemonId}-shiny`,
          'shiny',
          [fastMove, maxMove],
        ),
        pokemon_id: legacyPokemonId,
        pokedex_number: currentPokemonId,
        name: `Shiny ${species}`,
        species_name: species,
        form: 'Hero',
        crownForms: [
          {
            id: legacyPokemonId,
            base_pokemon_id: legacyPokemonId,
            crown_pokemon_id: currentPokemonId,
            display_form:
              species === 'Zacian' ? 'Crowned Sword' : 'Crowned Shield',
            name: species,
            form,
            attack: current.attack,
            defense: current.defense,
            stamina: current.stamina,
            type1_name: current.type1_name,
            type2_name: current.type2_name,
            image_url: `/${species.toLowerCase()}-crowned.png`,
            image_url_shiny: `/${species.toLowerCase()}-crowned-shiny.png`,
            moves: [fastMove, maxMove],
          },
        ],
      } as unknown as PokemonVariant;
      const instances: InstancesMap = {
        legacy: caughtInstance({
          instance_id: `legacy-${species.toLowerCase()}`,
          variant_id: `${legacyPokemonId}-shiny`,
          pokemon_id: legacyPokemonId,
          shiny: true,
          fast_move_id: fastMoveId,
          dynamax: false,
          crown: true,
        }),
      };

      const roster = buildMaxRoster([hero, current], instances);

      expect(roster).toMatchObject({
        caughtCount: 1,
        eligibleCount: 1,
        incompleteEntryCount: 0,
        unmappedCount: 0,
      });
      expect(roster.pokemon[0]).toMatchObject({
        pokemon_id: legacyPokemonId,
        form,
        variantType: 'default',
        instanceData: {
          pokemon_id: legacyPokemonId,
        },
      });
      expect(roster.pokemon[0].moves?.map((entry) => entry.name)).toEqual([
        fastMoveName,
        maxMoveName,
      ]);
    },
  );

  it('does not promote a legacy Hero form that has not been crowned', () => {
    const metalClaw = move(29, 'Metal Claw', true);
    const hero = {
      ...variant('2290-default', 'default', [
        metalClaw,
        move(468, 'Behemoth Blade', false),
      ]),
      pokemon_id: 2290,
      pokedex_number: 888,
      name: 'Zacian',
      species_name: 'Zacian',
      form: 'Hero',
    } as PokemonVariant;

    const roster = buildMaxRoster(
      [hero],
      {
        hero: caughtInstance({
          variant_id: '2290-default',
          pokemon_id: 2290,
          fast_move_id: 29,
          dynamax: false,
          crown: false,
        }),
      },
    );

    expect(roster.pokemon).toEqual([]);
    expect(roster.unmappedCount).toBe(0);
  });

  it('includes a complete caught Eternatus without requiring a Dynamax flag', () => {
    const dragonTail = move(47, 'Dragon Tail', true);
    const eternatus = {
      ...variant('0890-default', 'default', [
        dragonTail,
        move(479, 'Dynamax Cannon', false),
      ]),
      pokemon_id: 890,
      pokedex_number: 890,
      name: 'Eternatus',
      species_name: 'Eternatus',
      form: null,
    } as PokemonVariant;

    const roster = buildMaxRoster(
      [eternatus],
      {
        eternatus: caughtInstance({
          instance_id: 'caught-eternatus',
          variant_id: '0890-default',
          pokemon_id: 890,
          fast_move_id: 47,
          dynamax: false,
          gigantamax: false,
          crown: false,
        }),
      },
    );

    expect(roster).toMatchObject({
      caughtCount: 1,
      eligibleCount: 1,
      incompleteEntryCount: 0,
      unmappedCount: 0,
    });
    expect(roster.pokemon[0]).toMatchObject({
      pokemon_id: 890,
      name: 'Eternatus',
      instanceData: { instance_id: 'caught-eternatus' },
    });
  });
});
