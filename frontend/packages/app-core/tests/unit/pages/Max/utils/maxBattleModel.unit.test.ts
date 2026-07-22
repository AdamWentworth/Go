import { describe, expect, it } from 'vitest';

import type { PokemonInstance } from '@/types/pokemonInstance';
import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import {
  getMaxBattleCatalog,
  MAX_MODEL_CONSTANTS,
  rankMaxBattlePokemon,
} from '@/pages/Max/utils/maxBattleModel';

const fastMove = (
  moveId: number,
  name: string,
  type: string,
  cooldown = 0.5,
): Move =>
  ({
    move_id: moveId,
    name,
    type_id: 1,
    raid_power: 10,
    raid_energy: 10,
    raid_cooldown: cooldown,
    is_fast: 1,
    type_name: type,
    type,
  }) as Move;

const chargedMove = (
  moveId: number,
  name: string,
  type: string,
  cooldown = 2_000,
  power = 200,
): Move =>
  ({
    move_id: moveId,
    name,
    type_id: 1,
    raid_power: power,
    raid_energy: -100,
    raid_cooldown: cooldown,
    is_fast: 0,
    type_name: type,
    type,
  }) as Move;

const maxVariant = (
  pokemonId: number,
  name: string,
  variantType: 'default' | 'dynamax' | 'gigantamax' | 'shiny_dynamax',
  options: {
    attack?: number;
    defense?: number;
    stamina?: number;
    types?: [string, string?];
    moves?: Move[];
    form?: string | null;
    gigantamaxMove?: { name: string; type: string };
  } = {},
): PokemonVariant =>
  ({
    pokemon_id: pokemonId,
    pokedex_number: pokemonId,
    name,
    species_name: name,
    variant_id: `${pokemonId}-${variantType}`,
    variantType,
    currentImage: `/images/${variantType}/${pokemonId}.png`,
    attack: options.attack ?? 200,
    defense: options.defense ?? 180,
    stamina: options.stamina ?? 180,
    type1_name: options.types?.[0] ?? 'normal',
    type2_name: options.types?.[1] ?? '',
    form: options.form ?? null,
    moves: options.moves ?? [fastMove(pokemonId, 'Tackle', 'normal')],
    max:
      variantType === 'gigantamax'
        ? [
            {
              pokemon_id: pokemonId,
              dynamax: 1,
              gigantamax: 1,
              dynamax_release_date: null,
              gigantamax_release_date: null,
              gigantamax_move_name:
                options.gigantamaxMove?.name ?? `G-Max ${name}`,
              gigantamax_move_type:
                options.gigantamaxMove?.type ?? options.types?.[0] ?? 'normal',
            },
          ]
        : [],
  }) as unknown as PokemonVariant;

const caughtMaxVariant = (
  base: PokemonVariant,
  overrides: Partial<PokemonInstance> = {},
): PokemonVariant => ({
  ...base,
  variant_id: `${base.variant_id}::max-caught::1`,
  instanceData: {
    instance_id: 'caught-1',
    variant_id: base.variant_id,
    pokemon_id: base.pokemon_id,
    nickname: null,
    cp: 1_000,
    level: 30,
    attack_iv: 15,
    defense_iv: 13,
    stamina_iv: 12,
    fast_move_id: base.moves?.find((move) => Number(move.is_fast) === 1)?.move_id,
    max_attack: 2,
    max_guard: 1,
    max_spirit: 3,
    is_caught: true,
    disabled: false,
    ...overrides,
  } as PokemonInstance,
  raidRoster: {
    source: 'caught',
    instanceId: 'caught-1',
    moveSource: 'recorded',
    levelSource: 'recorded',
    ivSource: 'recorded',
    formSource: 'base',
    cpSource: 'recorded',
  },
});

describe('Max Battle ranking model', () => {
  it('keeps released performance forms while removing cosmetic shiny duplicates', () => {
    const variants = [
      maxVariant(1, 'Bulbasaur', 'dynamax'),
      maxVariant(1, 'Shiny Bulbasaur', 'shiny_dynamax'),
      maxVariant(3, 'Venusaur', 'gigantamax'),
    ];

    expect(getMaxBattleCatalog(variants).map((variant) => variant.variantType)).toEqual([
      'dynamax',
      'gigantamax',
    ]);
  });

  it('includes Eternatus and the two Crowned forms as special Max-ready Pokémon', () => {
    const variants = [
      maxVariant(888, 'Zacian', 'default', {
        form: 'Crowned_sword',
        types: ['fairy', 'steel'],
        moves: [
          fastMove(29, 'Metal Claw', 'steel'),
          chargedMove(468, 'Behemoth Blade', 'steel'),
        ],
      }),
      maxVariant(889, 'Zamazenta', 'default', {
        form: 'Crowned_shield',
        types: ['fighting', 'steel'],
        moves: [
          fastMove(29, 'Metal Claw', 'steel'),
          chargedMove(469, 'Behemoth Bash', 'steel'),
        ],
      }),
      maxVariant(890, 'Eternatus', 'default', {
        types: ['poison', 'dragon'],
        moves: [
          fastMove(47, 'Dragon Tail', 'dragon'),
          chargedMove(479, 'Dynamax Cannon', 'dragon'),
        ],
      }),
      maxVariant(25, 'Pikachu', 'default'),
      maxVariant(2290, 'Zacian', 'default', { form: 'Hero' }),
    ];

    expect(getMaxBattleCatalog(variants).map((variant) => variant.pokemon_id)).toEqual([
      888,
      889,
      890,
    ]);
  });

  it('uses each special Max attack and its level-3 power without a fake Max form', () => {
    const variants = [
      maxVariant(888, 'Zacian', 'default', {
        form: 'Crowned_sword',
        types: ['fairy', 'steel'],
        moves: [
          fastMove(29, 'Metal Claw', 'steel'),
          chargedMove(468, 'Behemoth Blade', 'steel'),
        ],
      }),
      maxVariant(889, 'Zamazenta', 'default', {
        form: 'Crowned_shield',
        types: ['fighting', 'steel'],
        moves: [
          fastMove(29, 'Metal Claw', 'steel'),
          chargedMove(469, 'Behemoth Bash', 'steel'),
        ],
      }),
      maxVariant(890, 'Eternatus', 'default', {
        types: ['poison', 'dragon'],
        moves: [
          fastMove(47, 'Dragon Tail', 'dragon'),
          chargedMove(479, 'Dynamax Cannon', 'dragon'),
        ],
      }),
    ];

    const rankings = rankMaxBattlePokemon(variants, { role: 'damage' });
    const byID = new Map(rankings.map((entry) => [entry.variant.pokemon_id, entry]));

    expect(byID.get(888)).toMatchObject({
      displayName: 'Crowned Sword Zacian',
      maxForm: 'special',
      maxMoveName: 'Behemoth Blade',
      maxMoveType: 'steel',
      maxMovePower: 350,
    });
    expect(byID.get(889)).toMatchObject({
      displayName: 'Crowned Shield Zamazenta',
      maxForm: 'special',
      maxMoveName: 'Behemoth Bash',
      maxMoveType: 'steel',
      maxMovePower: 350,
    });
    expect(byID.get(890)).toMatchObject({
      displayName: 'Eternatus',
      maxForm: 'special',
      maxMoveName: 'Dynamax Cannon',
      maxMoveType: 'dragon',
      maxMovePower: 450,
    });
  });

  it('keeps special Max-ready Pokémon in support roles and enforces their damage type', () => {
    const eternatus = maxVariant(890, 'Eternatus', 'default', {
      types: ['poison', 'dragon'],
      moves: [
        fastMove(47, 'Dragon Tail', 'dragon'),
        chargedMove(479, 'Dynamax Cannon', 'dragon'),
      ],
    });

    expect(rankMaxBattlePokemon([eternatus], { role: 'tank' })).toHaveLength(1);
    expect(rankMaxBattlePokemon([eternatus], { role: 'healing' })).toHaveLength(1);
    expect(
      rankMaxBattlePokemon([eternatus], {
        role: 'damage',
        selectedType: 'dragon',
      }),
    ).toHaveLength(1);
    expect(
      rankMaxBattlePokemon([eternatus], {
        role: 'damage',
        selectedType: 'poison',
      }),
    ).toHaveLength(0);
  });

  it('does not rank a special Max-ready Pokémon without its signature move', () => {
    const eternatus = maxVariant(890, 'Eternatus', 'default', {
      moves: [fastMove(47, 'Dragon Tail', 'dragon')],
    });

    expect(rankMaxBattlePokemon([eternatus], { role: 'damage' })).toEqual([]);
  });

  it('uses the species-specific G-Max move type and power', () => {
    const venusaur = maxVariant(3, 'Gigantamax Venusaur', 'gigantamax', {
      types: ['grass', 'poison'],
      moves: [
        fastMove(1, 'Vine Whip', 'grass'),
        chargedMove(2, 'Frenzy Plant', 'grass'),
      ],
      gigantamaxMove: { name: 'G-Max Vine Lash', type: 'grass' },
    });

    const [entry] = rankMaxBattlePokemon([venusaur], { role: 'damage' });

    expect(entry.maxMoveType).toBe('grass');
    expect(entry.maxMoveName).toBe('G-Max Vine Lash');
    expect(entry.maxMovePower).toBe(450);
    expect(entry.chargedMove?.name).toBe('Frenzy Plant');
  });

  it('prefers a STAB Fast Attack when Max Meter cadence is equal', () => {
    const inteleon = maxVariant(818, 'Gigantamax Inteleon', 'gigantamax', {
      types: ['water'],
      moves: [
        { ...fastMove(1, 'Pound', 'normal', 0.5), raid_power: 6 },
        { ...fastMove(2, 'Water Gun', 'water', 0.5), raid_power: 5 },
      ],
      gigantamaxMove: { name: 'G-Max Hydrosnipe', type: 'water' },
    });

    const [entry] = rankMaxBattlePokemon([inteleon], { role: 'damage' });

    expect(entry.fastMove.name).toBe('Water Gun');
  });

  it('keeps a faster Fast Attack ahead of a slower STAB alternative', () => {
    const inteleon = maxVariant(818, 'Gigantamax Inteleon', 'gigantamax', {
      types: ['water'],
      moves: [
        fastMove(1, 'Pound', 'normal', 0.5),
        fastMove(2, 'Water Gun', 'water', 1),
      ],
      gigantamaxMove: { name: 'G-Max Hydrosnipe', type: 'water' },
    });

    const [entry] = rankMaxBattlePokemon([inteleon], { role: 'damage' });

    expect(entry.fastMove.name).toBe('Pound');
  });

  it('keeps known G-Max forms available while older catalog payloads lack move metadata', () => {
    const venusaur = maxVariant(3, 'Gigantamax Venusaur', 'gigantamax', {
      moves: [fastMove(1, 'Vine Whip', 'grass')],
    });
    venusaur.max = [];

    const [entry] = rankMaxBattlePokemon([venusaur], { role: 'damage' });

    expect(entry.maxMoveName).toBe('G-Max Vine Lash');
    expect(entry.maxMoveType).toBe('grass');
  });

  it.each([
    [3, 'G-Max Vine Lash', 'grass'],
    [6, 'G-Max Wildfire', 'fire'],
    [9, 'G-Max Cannonade', 'water'],
    [68, 'G-Max Chi Strike', 'fighting'],
    [94, 'G-Max Terror', 'ghost'],
    [99, 'G-Max Foam Burst', 'water'],
    [131, 'G-Max Resonance', 'ice'],
    [143, 'G-Max Replenish', 'normal'],
    [812, 'G-Max Drum Solo', 'grass'],
    [815, 'G-Max Fireball', 'fire'],
    [818, 'G-Max Hydrosnipe', 'water'],
    [849, 'G-Max Stun Shock', 'electric'],
    [2275, 'G-Max Stun Shock', 'electric'],
  ])('provides the canonical compatibility move for G-Max Pokémon %i', (pokemonId, name, type) => {
    const variant = maxVariant(pokemonId, `Gigantamax ${pokemonId}`, 'gigantamax', {
      moves: [fastMove(pokemonId, 'Fast Move', type)],
    });
    variant.max = [];

    const [entry] = rankMaxBattlePokemon([variant], { role: 'damage' });

    expect(entry.maxMoveName).toBe(name);
    expect(entry.maxMoveType).toBe(type);
  });

  it('shows the strongest legal charged move for the selected fast move', () => {
    const charizard = maxVariant(6, 'Dynamax Charizard', 'dynamax', {
      types: ['fire', 'flying'],
      moves: [
        fastMove(1, 'Fire Spin', 'fire', 1),
        chargedMove(2, 'Blast Burn', 'fire'),
        { ...chargedMove(3, 'Dragon Claw', 'dragon'), raid_power: 50 },
      ],
    });

    const [entry] = rankMaxBattlePokemon([charizard], { role: 'damage' });

    expect(entry.fastMove.name).toBe('Fire Spin');
    expect(entry.chargedMove?.name).toBe('Blast Burn');
  });

  it('exposes the raw Max Attack index instead of a top-score normalization', () => {
    const venusaur = maxVariant(3, 'Dynamax Venusaur', 'dynamax', {
      attack: 198,
      types: ['grass', 'poison'],
      moves: [fastMove(1, 'Vine Whip', 'grass')],
    });

    const [entry] = rankMaxBattlePokemon([venusaur], { role: 'damage' });
    const expectedAttack = (198 + 15) * MAX_MODEL_CONSTANTS.level50Cpm;

    expect(entry.attackIndex).toBeCloseTo(
      expectedAttack *
        MAX_MODEL_CONSTANTS.dynamaxMovePower *
        MAX_MODEL_CONSTANTS.stabMultiplier,
    );
    expect(entry).not.toHaveProperty('relativeScore');
  });

  it('chooses the best Dynamax fast-move type for the requested damage list', () => {
    const charizard = maxVariant(6, 'Dynamax Charizard', 'dynamax', {
      types: ['fire', 'flying'],
      moves: [
        fastMove(1, 'Fire Spin', 'fire', 1),
        fastMove(2, 'Air Slash', 'flying', 0.5),
      ],
    });

    const [flying] = rankMaxBattlePokemon([charizard], {
      role: 'damage',
      selectedType: 'flying',
    });

    expect(flying.fastMove.name).toBe('Air Slash');
    expect(flying.maxMoveType).toBe('flying');
  });

  it('treats Hidden Power as Max Strike rather than typed Hidden Power', () => {
    const pokemon = maxVariant(474, 'Dynamax Porygon-Z', 'dynamax', {
      moves: [fastMove(1, 'Hidden Power Ice', 'ice')],
    });

    const [entry] = rankMaxBattlePokemon([pokemon], { role: 'damage' });

    expect(entry.maxMoveType).toBe('normal');
  });

  it('combines tank typing, bulk, and meter cadence without hiding the inputs', () => {
    const waterTank = maxVariant(9, 'Dynamax Blastoise', 'dynamax', {
      defense: 230,
      stamina: 190,
      types: ['water'],
      moves: [fastMove(1, 'Bite', 'dark', 0.5)],
    });
    const fireTank = maxVariant(6, 'Dynamax Charizard', 'dynamax', {
      defense: 230,
      stamina: 190,
      types: ['fire', 'flying'],
      moves: [fastMove(2, 'Fire Spin', 'fire', 1.5)],
    });

    const rankings = rankMaxBattlePokemon([fireTank, waterTank], {
      role: 'tank',
      selectedType: 'water',
    });

    expect(rankings[0].variant.pokemon_id).toBe(9);
    expect(rankings[0].incomingMultiplier).toBeLessThan(1);
    expect(rankings[0].score).toBe(rankings[0].cycleEndurance);
    expect(rankings[0].cycleEndurance).toBeGreaterThan(
      rankings[1].cycleEndurance,
    );
  });

  it('rewards a tank that reaches Max Meter three times faster at equal bulk', () => {
    const slow = maxVariant(3, 'Slow tank', 'dynamax', {
      moves: [fastMove(1, 'Slow move', 'grass', 1.5)],
    });
    const fast = maxVariant(6, 'Fast tank', 'dynamax', {
      moves: [fastMove(2, 'Fast move', 'fire', 0.5)],
    });

    const rankings = rankMaxBattlePokemon([slow, fast], { role: 'tank' });

    expect(rankings[0].variant.name).toBe('Fast tank');
    expect(rankings[0].effectiveBulk).toBeCloseTo(rankings[1].effectiveBulk);
    expect(rankings[0].score).toBeCloseTo(rankings[1].score * 3);
  });

  it('reports level-3 Max Spirit healing directly for one ally and a full group', () => {
    const healer = maxVariant(143, 'Dynamax Snorlax', 'dynamax', {
      stamina: 330,
    });

    const [entry] = rankMaxBattlePokemon([healer], { role: 'healing' });
    const expectedHp = Math.floor(
      (330 + 15) * MAX_MODEL_CONSTANTS.level50Cpm,
    );
    const expectedHeal = Math.floor(
      expectedHp * MAX_MODEL_CONSTANTS.maxSpiritLevel3,
    );

    expect(entry.hp).toBe(expectedHp);
    expect(entry.healPerAlly).toBe(expectedHeal);
    expect(entry.teamHeal).toBe(
      expectedHeal * MAX_MODEL_CONSTANTS.maxGroupSize,
    );
    expect(entry.score).toBe(expectedHeal);
  });

  it('uses a caught copy\'s recorded level, IVs, CP, and Max Move levels', () => {
    const catalog = maxVariant(3, 'Dynamax Venusaur', 'dynamax', {
      attack: 198,
      defense: 189,
      stamina: 190,
      moves: [fastMove(1, 'Vine Whip', 'grass')],
      types: ['grass', 'poison'],
    });
    const caught = caughtMaxVariant(catalog);

    const [catalogEntry] = rankMaxBattlePokemon([catalog], { role: 'damage' });
    const [caughtEntry] = rankMaxBattlePokemon([caught], { role: 'damage' });

    expect(caughtEntry).toMatchObject({
      personalized: true,
      cp: 1_000,
      levelLabel: '30',
      ivPercent: 89,
      maxAttackLevel: 2,
      maxGuardLevel: 1,
      maxSpiritLevel: 3,
      maxMovePower: 300,
      maxGuardHp: 20,
      maxSpiritRate: 0.16,
    });
    expect(caughtEntry.attack).toBeLessThan(catalogEntry.attack);
    expect(caughtEntry.attackIndex).toBeLessThan(catalogEntry.attackIndex);
  });

  it('does not rank a caught copy as a healer while Max Spirit is locked', () => {
    const catalog = maxVariant(143, 'Dynamax Snorlax', 'dynamax', {
      stamina: 330,
    });
    const caught = caughtMaxVariant(catalog, { max_spirit: 0 });

    expect(rankMaxBattlePokemon([caught], { role: 'healing' })).toEqual([]);
    expect(rankMaxBattlePokemon([caught], { role: 'tank' })).toHaveLength(1);
  });

  it('keeps a caught shiny Max copy while catalog rankings remove cosmetic duplicates', () => {
    const shiny = caughtMaxVariant(
      maxVariant(9, 'Shiny Dynamax Blastoise', 'shiny_dynamax'),
      { shiny: true },
    );

    expect(getMaxBattleCatalog([shiny])).toHaveLength(1);
    expect(rankMaxBattlePokemon([shiny], { role: 'damage' })).toHaveLength(1);
  });

  it('keeps Max Spirit healing primary and uses matchup endurance between equal healers', () => {
    const resistant = maxVariant(9, 'Dynamax Blastoise', 'dynamax', {
      stamina: 240,
      types: ['water'],
      moves: [fastMove(1, 'Bite', 'dark', 0.5)],
    });
    const vulnerable = maxVariant(6, 'Dynamax Charizard', 'dynamax', {
      stamina: 240,
      types: ['fire', 'flying'],
      moves: [fastMove(2, 'Fire Spin', 'fire', 0.5)],
    });

    const rankings = rankMaxBattlePokemon([vulnerable, resistant], {
      role: 'healing',
      selectedType: 'water',
    });

    expect(rankings[0].healPerAlly).toBe(rankings[1].healPerAlly);
    expect(rankings[0].variant.name).toBe('Dynamax Blastoise');
    expect(rankings[0].cycleEndurance).toBeGreaterThan(
      rankings[1].cycleEndurance,
    );
  });

  it('normalizes catalog move cooldown milliseconds at the model boundary', () => {
    const pokemon = maxVariant(143, 'Gigantamax Snorlax', 'gigantamax', {
      moves: [fastMove(1, 'Lick', 'ghost', 500)],
    });

    const [entry] = rankMaxBattlePokemon([pokemon], { role: 'tank' });

    expect(entry.meterSeconds).toBe(0.5);
  });

  it('uses boss weaknesses for damage and boss STAB types for support roles', () => {
    const grassAttacker = maxVariant(3, 'Dynamax Venusaur', 'dynamax', {
      types: ['grass', 'poison'],
      moves: [fastMove(1, 'Vine Whip', 'grass')],
    });
    const fireAttacker = maxVariant(6, 'Dynamax Charizard', 'dynamax', {
      types: ['fire', 'flying'],
      moves: [fastMove(2, 'Fire Spin', 'fire')],
    });
    const waterBoss = maxVariant(9, 'Gigantamax Blastoise', 'gigantamax', {
      types: ['water'],
    });

    const damage = rankMaxBattlePokemon([grassAttacker, fireAttacker], {
      role: 'damage',
      boss: waterBoss,
    });
    const tanks = rankMaxBattlePokemon([grassAttacker, fireAttacker], {
      role: 'tank',
      boss: waterBoss,
    });

    expect(damage[0].variant.pokemon_id).toBe(3);
    expect(tanks[0].variant.pokemon_id).toBe(3);
  });

  it('produces a reproducible boss benchmark with damage, survival, and Guard', () => {
    const grassAttacker = maxVariant(3, 'Dynamax Venusaur', 'dynamax', {
      attack: 198,
      defense: 189,
      stamina: 190,
      types: ['grass', 'poison'],
      moves: [fastMove(1, 'Vine Whip', 'grass')],
    });
    const waterBoss = maxVariant(9, 'Gigantamax Blastoise', 'gigantamax', {
      attack: 171,
      defense: 207,
      stamina: 188,
      types: ['water'],
      moves: [
        fastMove(11, 'Water Gun', 'water', 500),
        chargedMove(12, 'Hydro Pump', 'water', 3_300, 130),
      ],
    });

    const [entry] = rankMaxBattlePokemon([grassAttacker], {
      role: 'damage',
      boss: waterBoss,
    });
    const benchmark = entry.bossBenchmark;
    const attackerAttack = (198 + 15) * MAX_MODEL_CONSTANTS.level50Cpm;
    const bossDefense = (207 + 15) * MAX_MODEL_CONSTANTS.level50Cpm;
    const expectedMaxHit =
      Math.floor(
        0.5 *
          MAX_MODEL_CONSTANTS.dynamaxMovePower *
          (attackerAttack / bossDefense) *
          MAX_MODEL_CONSTANTS.stabMultiplier *
          1.6,
      ) + 1;
    expect(benchmark).toBeDefined();
    expect(benchmark?.maxHitDamage).toBe(expectedMaxHit);
    expect(benchmark?.pressureSource).toBe('legal-movesets');
    expect(benchmark?.incomingType).toBe('mixed');
    expect(benchmark?.incomingDps).toBeGreaterThan(0);
    expect(benchmark?.incomingDamage).toBeGreaterThan(0);
    expect(benchmark?.meterCycleSeconds).toBe(12.5);
    expect(benchmark?.meterCycleDamage).toBe(
      Math.ceil((benchmark?.incomingDps ?? 0) * 12.5),
    );
    expect(benchmark?.hpAfterGuardedHit).toBe(
      Math.max(
        0,
        entry.hp +
          MAX_MODEL_CONSTANTS.maxGuardLevel3Hp -
          (benchmark?.incomingDamage ?? 0),
      ),
    );
    expect(benchmark?.guardedHitsToFaint).toBeGreaterThanOrEqual(
      benchmark?.hitsToFaint ?? 0,
    );
    expect(benchmark?.guardedMeterCyclesSurvived).toBeGreaterThan(
      benchmark?.meterCyclesSurvived ?? 0,
    );
  });

  it('falls back to a typed pressure benchmark when boss move data is unavailable', () => {
    const tank = maxVariant(3, 'Dynamax Venusaur', 'dynamax', {
      types: ['grass', 'poison'],
    });
    const waterBoss = maxVariant(9, 'Gigantamax Blastoise', 'gigantamax', {
      types: ['water'],
      moves: [],
    });

    const [entry] = rankMaxBattlePokemon([tank], {
      role: 'tank',
      boss: waterBoss,
    });

    expect(entry.bossBenchmark?.pressureSource).toBe('typed-benchmark');
    expect(entry.bossBenchmark?.incomingType).toBe('water');
    expect(entry.bossBenchmark?.meterCyclesSurvived).toBeGreaterThan(0);
  });
});
