import { describe, expect, it } from 'vitest';

import { buildOwnedPvPRoster } from '@/pages/Pvp/utils/pvpRoster';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonPvPRankingEntry } from '@shared-contracts/pokemon';

const moves = [
  {
    move_id: 1,
    name: 'Vine Whip',
    type_id: 12,
    raid_power: 7,
    pvp_power: 5,
    raid_energy: 7,
    pvp_energy: 8,
    raid_cooldown: 600,
    pvp_turns: 2,
    is_fast: 1,
    type_name: 'grass',
    legacy: false,
    type: 'grass',
  },
  {
    move_id: 2,
    name: 'Power Whip',
    type_id: 12,
    raid_power: 90,
    pvp_power: 90,
    raid_energy: -50,
    pvp_energy: -50,
    raid_cooldown: 2500,
    pvp_turns: 0,
    is_fast: 0,
    type_name: 'grass',
    legacy: false,
    type: 'grass',
  },
  {
    move_id: 3,
    name: 'Sludge Bomb',
    type_id: 4,
    raid_power: 80,
    pvp_power: 80,
    raid_energy: -50,
    pvp_energy: -50,
    raid_cooldown: 2300,
    pvp_turns: 0,
    is_fast: 0,
    type_name: 'poison',
    legacy: false,
    type: 'poison',
  },
];

const variant = {
  variant_id: '0001-default',
  pokemon_id: 1,
  pokedex_number: 1,
  name: 'Bulbasaur',
  species_name: 'Bulbasaur',
  attack: 118,
  defense: 111,
  stamina: 128,
  variantType: 'default',
  currentImage: '/images/bulbasaur.png',
  moves,
  fusion: [],
  crownForms: [],
  megaEvolutions: [],
} as unknown as PokemonVariant;

const ranking = {
  rank: 1,
  sourceRank: 1,
  speciesId: 'bulbasaur',
  name: 'Bulbasaur',
  pokemonId: 1,
  variantKind: 'pokemon',
  imageUrl: '/images/ranked-bulbasaur.png',
  types: ['grass', 'poison'],
  moveset: [],
  score: 90,
  rating: 700,
  categoryScores: [90, 90, 90, 90, 90, 90],
  matchups: [],
  counters: [],
  moveUsage: [],
  recommendedLevel: 50,
  attackIv: 0,
  defenseIv: 15,
  staminaIv: 15,
} as PokemonPvPRankingEntry;

const instance = (overrides: Partial<PokemonInstance> = {}): PokemonInstance => ({
  variant_id: variant.variant_id,
  pokemon_id: 1,
  nickname: 'Leaf',
  cp: 1_480,
  level: 32.5,
  attack_iv: 4,
  defense_iv: 14,
  stamina_iv: 15,
  fast_move_id: 1,
  charged_move1_id: 2,
  charged_move2_id: 3,
  is_caught: true,
  disabled: false,
  shadow: false,
  is_fused: false,
  crown: false,
  mega: false,
  is_mega: false,
  shiny: false,
  ...overrides,
} as PokemonInstance);

const crownMove = (
  moveId: number,
  name: string,
  fast: boolean,
  type: string,
) => ({
  move_id: moveId,
  name,
  type_id: 1,
  raid_power: fast ? 8 : 100,
  pvp_power: fast ? 5 : 100,
  raid_energy: fast ? 8 : -50,
  pvp_energy: fast ? 8 : -50,
  raid_cooldown: fast ? 600 : 2_500,
  pvp_turns: fast ? 2 : 0,
  is_fast: fast ? 1 : 0,
  type_name: type,
  legacy: false,
  type,
});

const crownedRosterFixture = ({
  species,
  pokedexNumber,
  heroPokemonId,
  crownPokemonId,
  crownLabel,
  fastMove,
  chargedMove1,
  chargedMove2,
}: {
  species: string;
  pokedexNumber: number;
  heroPokemonId: number;
  crownPokemonId: number;
  crownLabel: string;
  fastMove: ReturnType<typeof crownMove>;
  chargedMove1: ReturnType<typeof crownMove>;
  chargedMove2: ReturnType<typeof crownMove>;
}) => {
  const crownMoves = [fastMove, chargedMove1, chargedMove2];
  const hero = {
    ...variant,
    variant_id: `${pokedexNumber}-hero`,
    pokemon_id: heroPokemonId,
    pokedex_number: pokedexNumber,
    name: species,
    species_name: species,
    currentImage: `/images/${species.toLowerCase()}-hero.png`,
    moves: crownMoves,
    crownForms: [{
      id: crownPokemonId,
      base_pokemon_id: heroPokemonId,
      crown_pokemon_id: crownPokemonId,
      display_form: crownLabel,
      name: species,
      image_url: `/images/${species.toLowerCase()}-crown.png`,
      attack: 250,
      defense: 240,
      stamina: 220,
      type_1_id: 9,
      type1_name: 'Steel',
      moves: crownMoves,
    }],
  } as unknown as PokemonVariant;
  const crown = {
    ...hero,
    variant_id: `${pokedexNumber}-crown`,
    pokemon_id: crownPokemonId,
    name: `${crownLabel} ${species}`,
    species_name: `${crownLabel} ${species}`,
    crownForms: [],
  } as unknown as PokemonVariant;
  const crownRanking = {
    ...ranking,
    speciesId: `${species.toLowerCase()}_${crownLabel.toLowerCase().replace(' ', '_')}`,
    name: `${species} (${crownLabel})`,
    pokemonId: crownPokemonId,
    variantKind: 'crown',
  } as PokemonPvPRankingEntry;
  const crownInstance = instance({
    variant_id: hero.variant_id,
    pokemon_id: heroPokemonId,
    crown: true,
    crown_form: crownLabel,
    fast_move_id: fastMove.move_id,
    charged_move1_id: chargedMove1.move_id,
    charged_move2_id: chargedMove2.move_id,
  });

  return {
    variants: [hero, crown],
    ranking: crownRanking,
    instance: crownInstance,
  };
};

describe('buildOwnedPvPRoster', () => {
  it('uses the caught copy actual build and recorded moves', () => {
    const roster = buildOwnedPvPRoster(
      [ranking],
      [variant],
      { caught: instance() },
      1_500,
    );

    expect(roster.eligibleCount).toBe(1);
    expect(roster.entries[0]).toMatchObject({
      nickname: 'Leaf',
      cp: 1_480,
      entry: {
        recommendedLevel: 32.5,
        attackIv: 4,
        defenseIv: 14,
        staminaIv: 15,
        imageUrl: '/images/bulbasaur.png',
        battleHp: 106,
      },
    });
    expect(roster.entries[0].entry.battleAttack).toBeCloseTo(91.1073, 4);
    expect(roster.entries[0].entry.battleDefense).toBeCloseTo(93.3477, 4);
    expect(roster.entries[0].entry.statProduct).toBeCloseTo(901_493.2, 0);
    expect(roster.entries[0].entry.moveset.map((move) => move.name)).toEqual([
      'Vine Whip',
      'Power Whip',
      'Sludge Bomb',
    ]);
    expect(roster.entries[0].entry.moveset[0]).toMatchObject({
      power: 5,
      energyGain: 8,
      energyCost: 0,
      turns: 2,
    });
    expect(roster.entries[0].entry.moveset[1]).toMatchObject({
      power: 90,
      energyGain: 0,
      energyCost: 50,
      turns: 1,
    });
  });

  it('separates over-cap, incomplete, and unmatched caught copies', () => {
    const roster = buildOwnedPvPRoster(
      [ranking],
      [variant],
      {
        over: instance({ cp: 1_501 }),
        incomplete: instance({ charged_move2_id: null }),
        unmatched: instance({ variant_id: '9999-default' }),
      },
      1_500,
    );

    expect(roster).toMatchObject({
      caughtCount: 3,
      eligibleCount: 0,
      overCapCount: 1,
      incompleteCount: 1,
      unmatchedCount: 1,
    });
  });

  it('does not substitute a recommendation build for an unsupported level', () => {
    const roster = buildOwnedPvPRoster(
      [ranking],
      [variant],
      { unsupported: instance({ level: 99 }) },
      1_500,
    );

    expect(roster).toMatchObject({
      caughtCount: 1,
      eligibleCount: 0,
      incompleteCount: 1,
    });
  });

  it.each([
    {
      species: 'Zacian',
      pokedexNumber: 888,
      heroPokemonId: 2_290,
      crownPokemonId: 888,
      crownLabel: 'Crowned Sword',
      fastMove: crownMove(101, 'Metal Claw', true, 'steel'),
      chargedMove1: crownMove(102, 'Behemoth Blade', false, 'steel'),
      chargedMove2: crownMove(103, 'Close Combat', false, 'fighting'),
    },
    {
      species: 'Zamazenta',
      pokedexNumber: 889,
      heroPokemonId: 2_292,
      crownPokemonId: 889,
      crownLabel: 'Crowned Shield',
      fastMove: crownMove(201, 'Metal Claw', true, 'steel'),
      chargedMove1: crownMove(202, 'Behemoth Bash', false, 'steel'),
      chargedMove2: crownMove(203, 'Crunch', false, 'dark'),
    },
  ])(
    'includes an owned $crownLabel $species using its crowned ranking',
    (fixture) => {
      const crowned = crownedRosterFixture(fixture);
      const roster = buildOwnedPvPRoster(
        [crowned.ranking],
        crowned.variants,
        { crowned: crowned.instance },
        null,
      );

      expect(roster).toMatchObject({
        caughtCount: 1,
        eligibleCount: 1,
        incompleteCount: 0,
        unmatchedCount: 0,
      });
      expect(roster.entries[0]).toMatchObject({
        referenceEntry: {
          pokemonId: fixture.crownPokemonId,
          variantKind: 'crown',
        },
        entry: {
          pokemonId: fixture.crownPokemonId,
          variantKind: 'crown',
          imageUrl: `/images/${fixture.species.toLowerCase()}-crown.png`,
        },
      });
      expect(roster.entries[0].entry.moveset.map((move) => move.name)).toEqual([
        fixture.fastMove.name,
        fixture.chargedMove1.name,
        fixture.chargedMove2.name,
      ]);
    },
  );

  it('indexes large caught rosters instead of rescanning every ranking per copy', () => {
    const irrelevantRankings = Array.from({ length: 5_000 }, (_, index) => ({
      ...ranking,
      speciesId: `species-${index + 10}`,
      name: `Species ${index + 10}`,
      pokemonId: index + 10,
      rank: index + 2,
      sourceRank: index + 2,
    }));
    const caught = Object.fromEntries(
      Array.from({ length: 10_000 }, (_, index) => [
        `caught-${index}`,
        instance({ instance_id: `caught-${index}` }),
      ]),
    );
    const startedAt = performance.now();

    const roster = buildOwnedPvPRoster(
      [...irrelevantRankings, ranking],
      [variant],
      caught,
      1_500,
    );

    expect(roster.eligibleCount).toBe(10_000);
    expect(performance.now() - startedAt).toBeLessThan(1_000);
  }, 5_000);
});
