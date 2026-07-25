import type {
  PokemonPvPBattleEvent,
  PokemonPvPBattleFighter,
  PokemonPvPBattleRequest,
  PokemonPvPBattleResponse,
  PokemonPvPMoveBuff,
  PokemonPvPRankingMove,
  PokemonPvPRosterEvaluationOpponent,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import type {
  PvPRosterEvaluationCandidate,
  PvPRosterWorkerRequest,
  PvPTeamBattleRequest,
  PvPTeamBattleResponse,
  PvPTeamGauntletRequest,
  PvPTeamGauntletResponse,
  PvPTeamEvaluationResponse,
  PvPTeamRole,
  PvPTeamSwitchPolicy,
  PvPTeamWorkerRequest,
} from './pvpWorkerProtocol';

const ENERGY_CAP = 100;
const MAX_TURNS = 480;
const TEAM_BATTLE_LIMIT_MS = 270_000;
export const PVP_SWITCH_CLOCK_MS = 45_000;
const SWITCH_REEVALUATION_MS = 10_000;
const ADAPTIVE_SWITCH_MAX_RATING = 450;
const ADAPTIVE_SWITCH_MIN_IMPROVEMENT = 80;
const MAX_STAGE = 4;
const DAMAGE_BONUS = 1.2999999523162841796875;
const SUPER_EFFECTIVE = 1.60000002384185791015625;
const RESISTED = 0.625;
const DOUBLE_RESISTED = 0.390625;
const STAB = 1.2000000476837158203125;
const SHADOW_ATTACK = 1.2;
const SHADOW_DEFENSE = 0.83333331;

type Scenario = {
  shields: [number, number];
  energyTurns: [number, number];
};

const STANDARD_SCENARIOS: readonly Scenario[] = [
  { shields: [1, 1], energyTurns: [0, 0] },
  { shields: [0, 0], energyTurns: [0, 0] },
  { shields: [1, 1], energyTurns: [4, 0] },
  { shields: [1, 1], energyTurns: [6, 0] },
  { shields: [0, 1], energyTurns: [0, 0] },
];

const TEAM_ROLE_SCENARIOS: Record<PvPTeamRole, Scenario> = {
  lead: STANDARD_SCENARIOS[0],
  switch: STANDARD_SCENARIOS[2],
  closer: STANDARD_SCENARIOS[1],
};

type TypeTraits = {
  weaknesses: readonly string[];
  resistances: readonly string[];
  immunities: readonly string[];
};

const TYPE_TRAITS: Record<string, TypeTraits> = {
  normal: { weaknesses: ['fighting'], resistances: [], immunities: ['ghost'] },
  fighting: {
    weaknesses: ['flying', 'psychic', 'fairy'],
    resistances: ['rock', 'bug', 'dark'],
    immunities: [],
  },
  flying: {
    weaknesses: ['rock', 'electric', 'ice'],
    resistances: ['fighting', 'bug', 'grass'],
    immunities: ['ground'],
  },
  poison: {
    weaknesses: ['ground', 'psychic'],
    resistances: ['fighting', 'poison', 'bug', 'fairy', 'grass'],
    immunities: [],
  },
  ground: {
    weaknesses: ['water', 'grass', 'ice'],
    resistances: ['poison', 'rock'],
    immunities: ['electric'],
  },
  rock: {
    weaknesses: ['fighting', 'ground', 'steel', 'water', 'grass'],
    resistances: ['normal', 'flying', 'poison', 'fire'],
    immunities: [],
  },
  bug: {
    weaknesses: ['flying', 'rock', 'fire'],
    resistances: ['fighting', 'ground', 'grass'],
    immunities: [],
  },
  ghost: {
    weaknesses: ['ghost', 'dark'],
    resistances: ['poison', 'bug'],
    immunities: ['normal', 'fighting'],
  },
  steel: {
    weaknesses: ['fighting', 'ground', 'fire'],
    resistances: [
      'normal', 'flying', 'rock', 'bug', 'steel', 'grass',
      'psychic', 'ice', 'dragon', 'fairy',
    ],
    immunities: ['poison'],
  },
  fire: {
    weaknesses: ['ground', 'rock', 'water'],
    resistances: ['bug', 'steel', 'fire', 'grass', 'ice', 'fairy'],
    immunities: [],
  },
  water: {
    weaknesses: ['grass', 'electric'],
    resistances: ['steel', 'fire', 'water', 'ice'],
    immunities: [],
  },
  grass: {
    weaknesses: ['flying', 'poison', 'bug', 'fire', 'ice'],
    resistances: ['ground', 'water', 'grass', 'electric'],
    immunities: [],
  },
  electric: {
    weaknesses: ['ground'],
    resistances: ['flying', 'steel', 'electric'],
    immunities: [],
  },
  psychic: {
    weaknesses: ['bug', 'ghost', 'dark'],
    resistances: ['fighting', 'psychic'],
    immunities: [],
  },
  ice: {
    weaknesses: ['fighting', 'fire', 'steel', 'rock'],
    resistances: ['ice'],
    immunities: [],
  },
  dragon: {
    weaknesses: ['dragon', 'ice', 'fairy'],
    resistances: ['fire', 'water', 'grass', 'electric'],
    immunities: [],
  },
  dark: {
    weaknesses: ['fighting', 'fairy', 'bug'],
    resistances: ['ghost', 'dark'],
    immunities: ['psychic'],
  },
  fairy: {
    weaknesses: ['poison', 'steel'],
    resistances: ['fighting', 'bug', 'dark'],
    immunities: ['dragon'],
  },
};

type Combatant = {
  model: PokemonPvPBattleFighter;
  hp: number;
  energy: number;
  shields: number;
  startShields: number;
  attackStage: number;
  defenseStage: number;
  cooldown: number;
  pendingFast: boolean;
  buffMeters: Map<string, number>;
};

type BattleResult = {
  fighters: [
    {
      hp: number;
      maxHp: number;
      energy: number;
      shields: number;
      startShields: number;
      attackStage: number;
      defenseStage: number;
    },
    {
      hp: number;
      maxHp: number;
      energy: number;
      shields: number;
      startShields: number;
      attackStage: number;
      defenseStage: number;
    },
  ];
  turns: number;
  timeMs: number;
  timeline: PokemonPvPBattleEvent[];
};

type BattleConditions = {
  shields: [number, number];
  startingEnergy: [number, number];
  startingHp?: [number, number];
  startingStages?: [[number, number], [number, number]];
  maxTimeMs?: number;
  recordTimeline?: boolean;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.max(minimum, Math.min(maximum, value));

const hasType = (types: readonly string[], type: string): boolean =>
  types.some((candidate) => candidate.toLowerCase() === type.toLowerCase());

const effectiveness = (
  moveType: string,
  targetTypes: readonly string[],
): number => {
  const normalizedMove = moveType.toLowerCase();
  return targetTypes.reduce((multiplier, targetType) => {
    const traits = TYPE_TRAITS[targetType.toLowerCase()];
    if (!traits) return multiplier;
    if (traits.weaknesses.includes(normalizedMove)) {
      return multiplier * SUPER_EFFECTIVE;
    }
    if (traits.resistances.includes(normalizedMove)) {
      return multiplier * RESISTED;
    }
    if (traits.immunities.includes(normalizedMove)) {
      return multiplier * DOUBLE_RESISTED;
    }
    return multiplier;
  }, 1);
};

const stageMultiplier = (stage: number): number => {
  const clamped = clamp(stage, -MAX_STAGE, MAX_STAGE);
  return clamped >= 0 ? (4 + clamped) / 4 : 4 / (4 - clamped);
};

const damage = (
  attacker: Combatant,
  defender: Combatant,
  move: PokemonPvPRankingMove,
): number => {
  let attack = attacker.model.attack * stageMultiplier(attacker.attackStage);
  let defense = defender.model.defense * stageMultiplier(defender.defenseStage);
  if (attacker.model.shadow) attack *= SHADOW_ATTACK;
  if (defender.model.shadow) defense *= SHADOW_DEFENSE;
  const value =
    Number(move.power ?? 0) *
    (hasType(attacker.model.types, move.type) ? STAB : 1) *
    (attack / defense) *
    effectiveness(move.type, defender.model.types) *
    0.5 *
    DAMAGE_BONUS;
  return Math.floor(value) + 1;
};

const fastEnergyAfterTurns = (
  move: PokemonPvPRankingMove,
  turns: number,
): number => {
  if (turns <= 0) return 0;
  const moveTurns = Math.max(1, Number(move.turns ?? 1));
  const count = Math.max(1, Math.floor(turns / moveTurns));
  return Math.min(ENERGY_CAP, Number(move.energyGain ?? 0) * count);
};

const newCombatant = (
  model: PokemonPvPBattleFighter,
  shields: number,
  energy: number,
  hp = model.hp,
  stages: [number, number] = [0, 0],
): Combatant => ({
  model,
  hp: clamp(hp, 0, model.hp),
  energy: clamp(energy, 0, ENERGY_CAP),
  shields: Math.max(0, shields),
  startShields: Math.max(0, shields),
  attackStage: clamp(stages[0], -MAX_STAGE, MAX_STAGE),
  defenseStage: clamp(stages[1], -MAX_STAGE, MAX_STAGE),
  cooldown: 0,
  pendingFast: false,
  buffMeters: new Map(),
});

const buffEmpty = (buff: PokemonPvPMoveBuff | undefined): boolean =>
  !buff ||
  (
    buff.attackerAttack === 0 &&
    buff.attackerDefense === 0 &&
    buff.targetAttack === 0 &&
    buff.targetDefense === 0
  );

const applyBuff = (
  attacker: Combatant,
  defender: Combatant,
  move: PokemonPvPRankingMove,
): void => {
  const buff = move.buff;
  if (!buff || buffEmpty(buff) || buff.chance <= 0) return;
  let applies = buff.chance >= 1;
  if (!applies) {
    const current = attacker.buffMeters.get(move.id) ?? (
      buff.chance === 0.5 ? 0 : buff.chance
    );
    const next = current + buff.chance;
    attacker.buffMeters.set(move.id, next);
    applies = Math.floor(current) < Math.floor(next);
  }
  if (!applies) return;
  attacker.attackStage = clamp(
    attacker.attackStage + buff.attackerAttack,
    -MAX_STAGE,
    MAX_STAGE,
  );
  attacker.defenseStage = clamp(
    attacker.defenseStage + buff.attackerDefense,
    -MAX_STAGE,
    MAX_STAGE,
  );
  defender.attackStage = clamp(
    defender.attackStage + buff.targetAttack,
    -MAX_STAGE,
    MAX_STAGE,
  );
  defender.defenseStage = clamp(
    defender.defenseStage + buff.targetDefense,
    -MAX_STAGE,
    MAX_STAGE,
  );
};

const chargedMoveValue = (
  attacker: Combatant,
  defender: Combatant,
  move: PokemonPvPRankingMove,
): number => {
  const energy = Math.max(1, Number(move.energyCost ?? 1));
  let value = damage(attacker, defender, move) / energy;
  const buff = move.buff;
  if (buff?.chance) {
    const stageValue =
      buff.attackerAttack -
      buff.attackerDefense -
      buff.targetAttack -
      buff.targetDefense;
    value *= 1 + stageValue * buff.chance * 0.04;
  }
  return value;
};

const chooseChargedMove = (
  attacker: Combatant,
  defender: Combatant,
): PokemonPvPRankingMove | null => {
  const available = attacker.model.chargedMoves.filter(
    (move) => attacker.energy >= Number(move.energyCost ?? Number.POSITIVE_INFINITY),
  );
  if (available.length === 0) return null;

  const lethal = available
    .filter((move) => defender.shields === 0 && damage(attacker, defender, move) >= defender.hp)
    .sort((left, right) => Number(left.energyCost) - Number(right.energyCost))[0];
  if (lethal) return lethal;

  const ordered = [...available].sort(
    (left, right) =>
      chargedMoveValue(attacker, defender, right) -
        chargedMoveValue(attacker, defender, left) ||
      Number(left.energyCost) - Number(right.energyCost),
  );
  if (defender.shields > 0 && ordered.length > 1) {
    const cheapest = [...ordered].sort(
      (left, right) => Number(left.energyCost) - Number(right.energyCost),
    )[0];
    const best = ordered[0];
    if (
      Number(cheapest.energyCost) <= Number(best.energyCost) - 10 &&
      chargedMoveValue(attacker, defender, cheapest) >=
        chargedMoveValue(attacker, defender, best) * 0.68
    ) {
      return cheapest;
    }
  }
  return ordered[0];
};

const resolveFast = (attacker: Combatant, defender: Combatant): number => {
  const move = attacker.model.fastMove;
  const dealt = damage(attacker, defender, move);
  defender.hp = Math.max(0, defender.hp - dealt);
  attacker.energy = Math.min(
    ENERGY_CAP,
    attacker.energy + Number(move.energyGain ?? 0),
  );
  return dealt;
};

const resolveCharged = (
  attacker: Combatant,
  defender: Combatant,
  move: PokemonPvPRankingMove,
): { damage: number; shielded: boolean; buffed: boolean } => {
  attacker.energy -= Number(move.energyCost ?? 0);
  const shielded = defender.shields > 0;
  const dealt = shielded ? 1 : damage(attacker, defender, move);
  if (shielded) defender.shields -= 1;
  defender.hp = Math.max(0, defender.hp - dealt);
  const stagesBefore = [
    attacker.attackStage,
    attacker.defenseStage,
    defender.attackStage,
    defender.defenseStage,
  ];
  applyBuff(attacker, defender, move);
  return {
    damage: dealt,
    shielded,
    buffed:
      stagesBefore[0] !== attacker.attackStage ||
      stagesBefore[1] !== attacker.defenseStage ||
      stagesBefore[2] !== defender.attackStage ||
      stagesBefore[3] !== defender.defenseStage,
  };
};

const simulateBattle = (
  first: PokemonPvPBattleFighter,
  second: PokemonPvPBattleFighter,
  conditions: BattleConditions,
): BattleResult => {
  const fighters: [Combatant, Combatant] = [
    newCombatant(
      first,
      conditions.shields[0],
      conditions.startingEnergy[0],
      conditions.startingHp?.[0],
      conditions.startingStages?.[0],
    ),
    newCombatant(
      second,
      conditions.shields[1],
      conditions.startingEnergy[1],
      conditions.startingHp?.[1],
      conditions.startingStages?.[1],
    ),
  ];
  const timeline: PokemonPvPBattleEvent[] = [];
  let turns = 0;
  let timeMs = 0;

  for (
    let turn = 0;
    turn < MAX_TURNS &&
      fighters[0].hp > 0 &&
      fighters[1].hp > 0 &&
      (conditions.maxTimeMs == null || timeMs < conditions.maxTimeMs);
    turn += 1
  ) {
    for (const fighter of fighters) {
      fighter.cooldown = Math.max(0, fighter.cooldown - 1);
    }
    for (let actor = 0; actor < 2; actor += 1) {
      const attacker = fighters[actor];
      const defender = fighters[1 - actor];
      if (
        attacker.pendingFast &&
        attacker.cooldown === 0 &&
        attacker.hp > 0 &&
        defender.hp > 0
      ) {
        attacker.pendingFast = false;
        const dealt = resolveFast(attacker, defender);
        if (conditions.recordTimeline) {
          timeline.push({
            turn: turn + 1,
            actor,
            kind: 'fast',
            moveId: attacker.model.fastMove.id,
            damage: dealt,
            shielded: false,
            buffed: false,
          });
        }
      }
    }
    if (fighters[0].hp <= 0 || fighters[1].hp <= 0) break;

    const charged = ([0, 1] as const)
      .filter((actor) => fighters[actor].cooldown === 0)
      .map((actor) => ({
        actor,
        move: chooseChargedMove(fighters[actor], fighters[1 - actor]),
      }))
      .filter(
        (
          action,
        ): action is { actor: 0 | 1; move: PokemonPvPRankingMove } =>
          action.move != null,
      )
      .sort(
        (left, right) =>
          fighters[right.actor].model.attack -
            fighters[left.actor].model.attack ||
          left.actor - right.actor,
      );
    let chargedCount = 0;
    for (const action of charged) {
      const attacker = fighters[action.actor];
      const defender = fighters[1 - action.actor];
      if (attacker.hp <= 0 || defender.hp <= 0) continue;
      if (attacker.energy < Number(action.move.energyCost ?? 0)) continue;
      const outcome = resolveCharged(attacker, defender, action.move);
      chargedCount += 1;
      if (conditions.recordTimeline) {
        timeline.push({
          turn: turn + 1,
          actor: action.actor,
          kind: 'charged',
          moveId: action.move.id,
          damage: outcome.damage,
          shielded: outcome.shielded,
          buffed: outcome.buffed,
        });
      }
    }
    turns = turn + 1;
    if (chargedCount > 0) {
      timeMs += chargedCount * 10_000;
      fighters.forEach((fighter) => {
        fighter.cooldown = 0;
      });
      continue;
    }
    timeMs += 500;

    fighters.forEach((fighter) => {
      if (fighter.hp <= 0 || fighter.cooldown !== 0) return;
      fighter.pendingFast = true;
      fighter.cooldown = Math.max(1, Number(fighter.model.fastMove.turns ?? 1));
    });
  }

  return {
    fighters: [
      {
        hp: fighters[0].hp,
        maxHp: fighters[0].model.hp,
        energy: fighters[0].energy,
        shields: fighters[0].shields,
        startShields: fighters[0].startShields,
        attackStage: fighters[0].attackStage,
        defenseStage: fighters[0].defenseStage,
      },
      {
        hp: fighters[1].hp,
        maxHp: fighters[1].model.hp,
        energy: fighters[1].energy,
        shields: fighters[1].shields,
        startShields: fighters[1].startShields,
        attackStage: fighters[1].attackStage,
        defenseStage: fighters[1].defenseStage,
      },
    ],
    turns,
    timeMs,
    timeline,
  };
};

const rating = (battle: BattleResult, index: 0 | 1): number => {
  const self = battle.fighters[index];
  const other = battle.fighters[index === 0 ? 1 : 0];
  return Math.trunc(
    (
      self.hp / self.maxHp +
      (other.maxHp - other.hp) / other.maxHp
    ) * 500,
  );
};

const adjustedRating = (battle: BattleResult, index: 0 | 1): number => {
  const base = rating(battle, index);
  const opponentRating = rating(battle, index === 0 ? 1 : 0);
  if (base <= opponentRating || base === 500) return base;
  const self = battle.fighters[index];
  const opponent = battle.fighters[index === 0 ? 1 : 0];
  const burned = opponent.startShields - opponent.shields;
  return base + 100 * burned + 100 * self.shields;
};

const ratingCurve = (input: number): number => {
  let value = input;
  if (value > 700) value = 700 + Math.sqrt(value - 700);
  if (value < 300) value = 300 ** ((300 + value) / 600);
  return value;
};

const chargedMoveStrategies = (
  fighter: PokemonPvPBattleFighter,
): PokemonPvPBattleFighter[] => {
  if (fighter.chargedMoves.length < 2) return [fighter];

  return [
    fighter,
    ...fighter.chargedMoves.map((move) => ({
      ...fighter,
      chargedMoves: [move],
    })),
  ];
};

const evaluateMatchup = (
  fighter: PokemonPvPBattleFighter,
  opponent: PokemonPvPBattleFighter,
  scenario: Scenario,
): number => {
  const startingEnergy: [number, number] = [
    fastEnergyAfterTurns(fighter.fastMove, scenario.energyTurns[0]),
    fastEnergyAfterTurns(opponent.fastMove, scenario.energyTurns[1]),
  ];

  return Math.max(
    ...chargedMoveStrategies(fighter).map((strategy) => {
      const battle = simulateBattle(strategy, opponent, {
        shields: scenario.shields,
        startingEnergy,
      });
      return ratingCurve(adjustedRating(battle, 0));
    }),
  );
};

const evaluateScenario = (
  fighter: PokemonPvPBattleFighter,
  opponents: readonly PokemonPvPRosterEvaluationOpponent[],
  scenario: Scenario,
): number => {
  let weightedTotal = 0;
  let weightTotal = 0;
  for (const opponent of opponents) {
    weightedTotal +=
      evaluateMatchup(fighter, opponent.fighter, scenario) * opponent.weight;
    weightTotal += opponent.weight;
  }
  return weightTotal > 0 ? weightedTotal / weightTotal : 0;
};

const adjustedCategoryScores = (
  candidate: PvPRosterEvaluationCandidate,
  opponents: readonly PokemonPvPRosterEvaluationOpponent[],
): [number, number, number, number, number, number] => {
  const scores = STANDARD_SCENARIOS.map((scenario, index) => {
    const personal = evaluateScenario(candidate.fighter, opponents, scenario);
    const reference = evaluateScenario(
      candidate.referenceFighter,
      opponents,
      scenario,
    );
    const source = candidate.sourceCategoryScores[index] ?? candidate.sourceScore;
    if (reference <= 0) return source;
    return clamp(Math.floor(source * (personal / reference) * 10) / 10, 0, 100);
  });
  scores.push(candidate.sourceCategoryScores[5] ?? candidate.sourceScore);
  return scores as [number, number, number, number, number, number];
};

const overallScore = (
  scores: [number, number, number, number, number, number],
): number => {
  const core = [
    scores[0],
    scores[1],
    Math.max(scores[2], scores[3]),
    scores[4],
  ].sort((left, right) => right - left);
  let value = (
    core[0] ** 12 *
    core[1] ** 6 *
    core[2] ** 4 *
    core[3] ** 2 *
    scores[5] ** 2
  ) ** (1 / 26);
  if (scores[4] <= 75 && scores[5] <= 75) {
    value = (value ** 14 * scores[4] * scores[5]) ** (1 / 16);
  }
  return Math.floor(value * 10) / 10;
};

const assertBattleRequest = (request: PokemonPvPBattleRequest): void => {
  if (request.mechanics !== 'pvpoke-legacy') {
    throw new Error('Battle Lab supports the pinned PvPoke mechanics only.');
  }
  request.fighters.forEach((fighter, index) => {
    if (
      !Number.isFinite(fighter.attack) ||
      fighter.attack <= 0 ||
      !Number.isFinite(fighter.defense) ||
      fighter.defense <= 0 ||
      !Number.isFinite(fighter.hp) ||
      fighter.hp <= 0
    ) {
      throw new Error(`Side ${index === 0 ? 'A' : 'B'} has invalid battle stats.`);
    }
    if (
      !Number.isFinite(fighter.fastMove.power) ||
      !Number.isFinite(fighter.fastMove.energyGain) ||
      !Number.isFinite(fighter.fastMove.turns) ||
      fighter.chargedMoves.length < 1 ||
      fighter.chargedMoves.length > 2 ||
      fighter.chargedMoves.some(
        (move) =>
          !Number.isFinite(move.power) ||
          !Number.isFinite(move.energyCost) ||
          Number(move.energyCost) <= 0,
      )
    ) {
      throw new Error(`Side ${index === 0 ? 'A' : 'B'} has incomplete move data.`);
    }
  });
  request.shields.forEach((shields) => {
    if (!Number.isInteger(shields) || shields < 0 || shields > 2) {
      throw new Error('Battle Lab shields must be between 0 and 2.');
    }
  });
  request.startingEnergy.forEach((energy) => {
    if (!Number.isFinite(energy) || energy < 0 || energy > ENERGY_CAP) {
      throw new Error('Battle Lab starting energy must be between 0 and 100.');
    }
  });
};

const assertTeamBattleRequest = (request: PvPTeamBattleRequest): void => {
  if (request.mechanics !== 'pvpoke-legacy') {
    throw new Error('Team Battle Lab supports the pinned PvPoke mechanics only.');
  }
  request.teams.forEach((team, side) => {
    if (team.length !== 3) {
      throw new Error(`Side ${side === 0 ? 'A' : 'B'} needs exactly three Pokémon.`);
    }
    if (new Set(team.map((fighter) => fighter.id)).size !== team.length) {
      throw new Error(`Side ${side === 0 ? 'A' : 'B'} cannot repeat a Pokémon.`);
    }
    team.forEach((fighter) => {
      assertBattleRequest({
        mechanics: request.mechanics,
        fighters: [fighter, fighter],
        shields: [0, 0],
        startingEnergy: [0, 0],
      });
    });
  });
  request.shields.forEach((shields) => {
    if (!Number.isInteger(shields) || shields < 0 || shields > 2) {
      throw new Error('Team Battle Lab shields must be between 0 and 2.');
    }
  });
  request.startingEnergy.forEach((energy) => {
    if (!Number.isFinite(energy) || energy < 0 || energy > ENERGY_CAP) {
      throw new Error('Team Battle Lab starting energy must be between 0 and 100.');
    }
  });
};

export const simulatePvPBattleLocally = (
  request: PokemonPvPBattleRequest,
): PokemonPvPBattleResponse => {
  assertBattleRequest(request);
  const battle = simulateBattle(request.fighters[0], request.fighters[1], {
    shields: request.shields,
    startingEnergy: request.startingEnergy,
    recordTimeline: request.recordTimeline,
  });
  const ratings: [number, number] = [
    rating(battle, 0),
    rating(battle, 1),
  ];
  const adjustedRatings: [number, number] = [
    adjustedRating(battle, 0),
    adjustedRating(battle, 1),
  ];
  return {
    mechanics: 'pvpoke-legacy',
    winner:
      ratings[0] > ratings[1]
        ? 0
        : ratings[1] > ratings[0]
          ? 1
          : -1,
    turns: battle.turns,
    timeMs: battle.timeMs,
    ratings,
    adjustedRatings,
    fighters: battle.fighters,
    timeline: battle.timeline,
  };
};

type TeamBattleMemberState = {
  fighter: PokemonPvPBattleFighter;
  hp: number;
  energy: number;
  attackStage: number;
  defenseStage: number;
  knockouts: number;
  switches: number;
};

const teamMatchupRating = (
  member: TeamBattleMemberState,
  opponent: TeamBattleMemberState,
  shields: [number, number],
): number => {
  const projection = simulateBattle(member.fighter, opponent.fighter, {
    shields,
    startingEnergy: [member.energy, opponent.energy],
    startingHp: [member.hp, opponent.hp],
    startingStages: [
      [member.attackStage, member.defenseStage],
      [opponent.attackStage, opponent.defenseStage],
    ],
  });
  return rating(projection, 0);
};

const chooseAdaptiveSwitch = (
  team: TeamBattleMemberState[],
  activeIndex: number,
  opponent: TeamBattleMemberState,
  shields: [number, number],
): { index: number; currentRating: number; nextRating: number } | null => {
  const activeMember = team[activeIndex];
  const currentRating = teamMatchupRating(activeMember, opponent, shields);
  if (currentRating > ADAPTIVE_SWITCH_MAX_RATING) return null;

  const alternatives = team
    .map((member, index) => ({
      index,
      rating: index === activeIndex || member.hp <= 0
        ? Number.NEGATIVE_INFINITY
        : teamMatchupRating(member, opponent, shields),
    }))
    .sort((left, right) => right.rating - left.rating || left.index - right.index);
  const best = alternatives[0];
  if (
    !best ||
    !Number.isFinite(best.rating) ||
    best.rating < 500 ||
    best.rating - currentRating < ADAPTIVE_SWITCH_MIN_IMPROVEMENT
  ) {
    return null;
  }

  return {
    index: best.index,
    currentRating,
    nextRating: best.rating,
  };
};

const nextAliveMember = (
  team: TeamBattleMemberState[],
  activeIndex: number,
): number =>
  team.findIndex((member, index) => index !== activeIndex && member.hp > 0);

const teamTimeoutScore = (team: TeamBattleMemberState[]): number => {
  const standing = team.filter((member) => member.hp > 0).length;
  const hpShare = team.reduce(
    (total, member) => total + member.hp / member.fighter.hp,
    0,
  );
  return standing * 10 + hpShare;
};

export const simulatePvPTeamBattleLocally = (
  request: PvPTeamBattleRequest,
): PvPTeamBattleResponse => {
  assertTeamBattleRequest(request);
  const switchPolicy: PvPTeamSwitchPolicy = request.switchPolicy ?? 'adaptive';

  const teamState = request.teams.map((team, side) =>
    team.map((fighter, index) => ({
      fighter,
      hp: fighter.hp,
      energy: index === 0 ? request.startingEnergy[side] : 0,
      attackStage: 0,
      defenseStage: 0,
      knockouts: 0,
      switches: 0,
    }))) as [
    TeamBattleMemberState[],
    TeamBattleMemberState[],
  ];

  const active: [number, number] = [0, 0];
  const shields: [number, number] = [...request.shields];
  const matchups: PvPTeamBattleResponse['matchups'] = [];
  const switches: PvPTeamBattleResponse['switches'] = [];
  const switchReadyAtMs: [number, number] = [0, 0];
  let switchedAtCurrentTime: [boolean, boolean] = [false, false];
  let turns = 0;
  let timeMs = 0;
  let stalled = false;

  const recordSwitch = (
    side: 0 | 1,
    toIndex: number,
    reason: 'adaptive' | 'forced',
  ) => {
    const fromIndex = active[side];
    const from = teamState[side][fromIndex];
    const to = teamState[side][toIndex];
    if (reason === 'adaptive') {
      from.attackStage = 0;
      from.defenseStage = 0;
      to.attackStage = 0;
      to.defenseStage = 0;
      to.switches += 1;
      switchReadyAtMs[side] = timeMs + PVP_SWITCH_CLOCK_MS;
      switchedAtCurrentTime[side] = true;
    }
    active[side] = toIndex;
    switches.push({
      index: switches.length,
      side,
      atMs: timeMs,
      fromFighterId: from.fighter.id,
      toFighterId: to.fighter.id,
      reason,
      switchReadyAtMs: switchReadyAtMs[side],
    });
  };

  const hasLivingTeam = (side: 0 | 1) =>
    teamState[side].some((member) => member.hp > 0);

  while (
    hasLivingTeam(0) &&
    hasLivingTeam(1) &&
    timeMs < TEAM_BATTLE_LIMIT_MS
  ) {
    if (teamState[0][active[0]].hp <= 0) {
      const replacement = nextAliveMember(teamState[0], active[0]);
      if (replacement >= 0) recordSwitch(0, replacement, 'forced');
    }
    if (teamState[1][active[1]].hp <= 0) {
      const replacement = nextAliveMember(teamState[1], active[1]);
      if (replacement >= 0) recordSwitch(1, replacement, 'forced');
    }
    if (!hasLivingTeam(0) || !hasLivingTeam(1)) break;

    if (switchPolicy === 'adaptive') {
      const proposals = ([0, 1] as const)
        .filter(
          (side) =>
            !switchedAtCurrentTime[side] &&
            switchReadyAtMs[side] <= timeMs,
        )
        .map((side) => {
          const opponentSide = side === 0 ? 1 : 0;
          const proposal = chooseAdaptiveSwitch(
            teamState[side],
            active[side],
            teamState[opponentSide][active[opponentSide]],
            [shields[side], shields[opponentSide]],
          );
          return proposal ? { side, ...proposal } : null;
        })
        .filter(
          (
            proposal,
          ): proposal is {
            side: 0 | 1;
            index: number;
            currentRating: number;
            nextRating: number;
          } => proposal != null,
        )
        .sort(
          (left, right) =>
            left.currentRating - right.currentRating ||
            right.nextRating - left.nextRating ||
            left.side - right.side,
        );
      if (proposals[0]) {
        recordSwitch(proposals[0].side, proposals[0].index, 'adaptive');
        continue;
      }
    }

    const first = teamState[0][active[0]];
    const second = teamState[1][active[1]];
    const startedAtMs = timeMs;
    const remainingBattleMs = TEAM_BATTLE_LIMIT_MS - timeMs;
    let segmentLimitMs = remainingBattleMs;
    if (switchPolicy === 'adaptive') {
      segmentLimitMs = Math.min(segmentLimitMs, SWITCH_REEVALUATION_MS);
      for (const readyAt of switchReadyAtMs) {
        if (readyAt > timeMs) {
          segmentLimitMs = Math.min(segmentLimitMs, readyAt - timeMs);
        }
      }
    }
    const battle = simulateBattle(first.fighter, second.fighter, {
      shields: [...shields],
      startingEnergy: [first.energy, second.energy],
      startingHp: [first.hp, second.hp],
      startingStages: [
        [first.attackStage, first.defenseStage],
        [second.attackStage, second.defenseStage],
      ],
      maxTimeMs: segmentLimitMs,
    });
    const ratings: [number, number] = [
      rating(battle, 0),
      rating(battle, 1),
    ];
    const matchupWinner =
      battle.fighters[0].hp > 0 && battle.fighters[1].hp <= 0
        ? 0
        : battle.fighters[1].hp > 0 && battle.fighters[0].hp <= 0
          ? 1
          : -1;

    first.hp = battle.fighters[0].hp;
    first.energy = battle.fighters[0].energy;
    first.attackStage = battle.fighters[0].attackStage;
    first.defenseStage = battle.fighters[0].defenseStage;
    second.hp = battle.fighters[1].hp;
    second.energy = battle.fighters[1].energy;
    second.attackStage = battle.fighters[1].attackStage;
    second.defenseStage = battle.fighters[1].defenseStage;
    shields[0] = battle.fighters[0].shields;
    shields[1] = battle.fighters[1].shields;
    if (matchupWinner === 0) first.knockouts += 1;
    if (matchupWinner === 1) second.knockouts += 1;
    turns += battle.turns;
    timeMs += battle.timeMs;
    const endedBy =
      matchupWinner >= 0
        ? 'knockout'
        : timeMs >= TEAM_BATTLE_LIMIT_MS
          ? 'timeout'
          : battle.timeMs <= 0
            ? 'stall'
            : 'switch';
    const previous = matchups[matchups.length - 1];
    if (
      previous &&
      previous.fighterIds[0] === first.fighter.id &&
      previous.fighterIds[1] === second.fighter.id
    ) {
      previous.winner = matchupWinner;
      previous.turns += battle.turns;
      previous.timeMs += battle.timeMs;
      previous.ratings = ratings;
      previous.hpAfter = [first.hp, second.hp];
      previous.energyAfter = [first.energy, second.energy];
      previous.shieldsAfter = [...shields];
      previous.endedAtMs = timeMs;
      previous.endedBy = endedBy;
    } else {
      matchups.push({
        index: matchups.length,
        fighterIds: [first.fighter.id, second.fighter.id],
        winner: matchupWinner,
        turns: battle.turns,
        timeMs: battle.timeMs,
        ratings,
        hpAfter: [first.hp, second.hp],
        energyAfter: [first.energy, second.energy],
        shieldsAfter: [...shields],
        startedAtMs,
        endedAtMs: timeMs,
        endedBy,
      });
    }
    switchedAtCurrentTime = [false, false];

    if (first.hp > 0 && second.hp > 0 && battle.timeMs <= 0) {
      stalled = true;
      break;
    }
  }

  const firstAlive = hasLivingTeam(0);
  const secondAlive = hasLivingTeam(1);
  const timeout = timeMs >= TEAM_BATTLE_LIMIT_MS && firstAlive && secondAlive;
  const timeoutScores: [number, number] = [
    teamTimeoutScore(teamState[0]),
    teamTimeoutScore(teamState[1]),
  ];
  const winner =
    stalled || (!firstAlive && !secondAlive)
      ? -1
      : !secondAlive
        ? 0
        : !firstAlive
          ? 1
          : timeoutScores[0] > timeoutScores[1]
            ? 0
            : timeoutScores[1] > timeoutScores[0]
              ? 1
              : -1;
  const resultTeams = teamState.map((team) =>
    team.map((member) => ({
      fighterId: member.fighter.id,
      hp: member.hp,
      maxHp: member.fighter.hp,
      energy: member.energy,
      fainted: member.hp <= 0,
      knockouts: member.knockouts,
      switches: member.switches,
    }))) as PvPTeamBattleResponse['teams'];

  return {
    mechanics: 'pvpoke-legacy',
    switchPolicy,
    switchClockMs: PVP_SWITCH_CLOCK_MS,
    winner,
    turns,
    timeMs,
    endReason: stalled ? 'stall' : timeout ? 'timeout' : 'knockout',
    shields,
    teams: resultTeams,
    matchups,
    switches,
  };
};

export const simulatePvPTeamGauntletLocally = (
  request: PvPTeamGauntletRequest,
): PvPTeamGauntletResponse => {
  if (request.opponents.length < 1) {
    throw new Error('Meta gauntlet needs at least one representative team.');
  }
  const results = request.opponents.map((opponent) => ({
    opponentId: opponent.id,
    opponentLabel: opponent.label,
    result: simulatePvPTeamBattleLocally({
      kind: 'team-battle',
      mechanics: request.mechanics,
      teams: [request.team, opponent.team],
      shields: [request.shields, request.shields],
      startingEnergy: [0, 0],
      switchPolicy: request.switchPolicy,
    }),
  }));
  return {
    mechanics: 'pvpoke-legacy',
    switchPolicy: request.switchPolicy,
    wins: results.filter(({ result }) => result.winner === 0).length,
    draws: results.filter(({ result }) => result.winner < 0).length,
    losses: results.filter(({ result }) => result.winner === 1).length,
    results,
  };
};

export const evaluatePvPRosterLocally = (
  request: PvPRosterWorkerRequest,
): PokemonPvPRosterEvaluationResponse => {
  if (request.opponents.length === 0) {
    throw new Error('Personal PvP evaluation needs a battle-ready meta field.');
  }
  return {
    mechanics: 'pvpoke-legacy',
    fieldSize: request.opponents.length,
    results: request.candidates.map((candidate) => {
      const categoryScores = adjustedCategoryScores(
        candidate,
        request.opponents,
      );
      const sourceCategories = [
        ...candidate.sourceCategoryScores.slice(0, 6),
      ];
      while (sourceCategories.length < 6) {
        sourceCategories.push(candidate.sourceScore);
      }
      const sourceOverall = overallScore(
        sourceCategories as [
          number,
          number,
          number,
          number,
          number,
          number,
        ],
      );
      const adjustedOverall = overallScore(categoryScores);
      const score = sourceOverall > 0
        ? clamp(
          Math.floor(
            candidate.sourceScore *
              (adjustedOverall / sourceOverall) *
              10,
          ) / 10,
          0,
          100,
        )
        : adjustedOverall;
      return {
        fighterId: candidate.fighter.id,
        score,
        categoryScores,
      };
    }),
  };
};

export const evaluatePvPTeamLocally = (
  request: PvPTeamWorkerRequest,
): PvPTeamEvaluationResponse => {
  if (request.members.length === 0) {
    throw new Error('Team evaluation needs at least one battle-ready member.');
  }
  if (request.opponents.length === 0) {
    throw new Error('Team evaluation needs a battle-ready meta field.');
  }

  const opponentResults = request.opponents.map((opponent) => {
    const memberRatings = request.members.map((member) =>
      evaluateMatchup(
        member.fighter,
        opponent.fighter,
        TEAM_ROLE_SCENARIOS[member.role],
      ));
    const bestRating = Math.max(...memberRatings);
    const bestMemberIndex = memberRatings.indexOf(bestRating);

    return {
      fighterId: opponent.fighter.id,
      memberRatings,
      bestMemberId: request.members[bestMemberIndex].fighter.id,
      bestRating: Math.floor(bestRating),
      covered: bestRating >= 500,
    };
  });

  const members = request.members.map((member, memberIndex) => {
    let weightedTotal = 0;
    let weightTotal = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    request.opponents.forEach((opponent, opponentIndex) => {
      const matchupRating =
        opponentResults[opponentIndex].memberRatings[memberIndex];
      weightedTotal += matchupRating * opponent.weight;
      weightTotal += opponent.weight;
      if (matchupRating > 500) wins += 1;
      else if (matchupRating < 500) losses += 1;
      else draws += 1;
    });

    return {
      fighterId: member.fighter.id,
      role: member.role,
      averageRating: weightTotal > 0
        ? Math.floor((weightedTotal / weightTotal) * 10) / 10
        : 0,
      wins,
      draws,
      losses,
    };
  });

  return {
    mechanics: 'pvpoke-legacy',
    fieldSize: request.opponents.length,
    coverageCount: opponentResults.filter((opponent) => opponent.covered).length,
    members,
    opponents: opponentResults,
  };
};
