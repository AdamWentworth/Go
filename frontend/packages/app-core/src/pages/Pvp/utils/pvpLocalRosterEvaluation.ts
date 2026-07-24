import type {
  PokemonPvPBattleFighter,
  PokemonPvPMoveBuff,
  PokemonPvPRankingMove,
  PokemonPvPRosterEvaluationOpponent,
  PokemonPvPRosterEvaluationResponse,
} from '@shared-contracts/pokemon';

import type {
  PvPRosterEvaluationCandidate,
  PvPRosterWorkerRequest,
} from './pvpRosterWorkerProtocol';

const ENERGY_CAP = 100;
const MAX_TURNS = 480;
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
    { hp: number; maxHp: number; shields: number; startShields: number },
    { hp: number; maxHp: number; shields: number; startShields: number },
  ];
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
): Combatant => ({
  model,
  hp: model.hp,
  energy: clamp(energy, 0, ENERGY_CAP),
  shields: Math.max(0, shields),
  startShields: Math.max(0, shields),
  attackStage: 0,
  defenseStage: 0,
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

const resolveFast = (attacker: Combatant, defender: Combatant): void => {
  const move = attacker.model.fastMove;
  defender.hp = Math.max(0, defender.hp - damage(attacker, defender, move));
  attacker.energy = Math.min(
    ENERGY_CAP,
    attacker.energy + Number(move.energyGain ?? 0),
  );
};

const resolveCharged = (
  attacker: Combatant,
  defender: Combatant,
  move: PokemonPvPRankingMove,
): void => {
  attacker.energy -= Number(move.energyCost ?? 0);
  const dealt = defender.shields > 0 ? 1 : damage(attacker, defender, move);
  if (defender.shields > 0) defender.shields -= 1;
  defender.hp = Math.max(0, defender.hp - dealt);
  applyBuff(attacker, defender, move);
};

const simulateBattle = (
  first: PokemonPvPBattleFighter,
  second: PokemonPvPBattleFighter,
  scenario: Scenario,
): BattleResult => {
  const fighters: [Combatant, Combatant] = [
    newCombatant(
      first,
      scenario.shields[0],
      fastEnergyAfterTurns(first.fastMove, scenario.energyTurns[0]),
    ),
    newCombatant(
      second,
      scenario.shields[1],
      fastEnergyAfterTurns(second.fastMove, scenario.energyTurns[1]),
    ),
  ];

  for (
    let turn = 0;
    turn < MAX_TURNS && fighters[0].hp > 0 && fighters[1].hp > 0;
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
        resolveFast(attacker, defender);
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
    for (const action of charged) {
      const attacker = fighters[action.actor];
      const defender = fighters[1 - action.actor];
      if (attacker.hp <= 0 || defender.hp <= 0) continue;
      if (attacker.energy < Number(action.move.energyCost ?? 0)) continue;
      resolveCharged(attacker, defender, action.move);
    }
    if (charged.length > 0) {
      fighters.forEach((fighter) => {
        fighter.cooldown = 0;
      });
      continue;
    }

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
        shields: fighters[0].shields,
        startShields: fighters[0].startShields,
      },
      {
        hp: fighters[1].hp,
        maxHp: fighters[1].model.hp,
        shields: fighters[1].shields,
        startShields: fighters[1].startShields,
      },
    ],
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

const evaluateScenario = (
  fighter: PokemonPvPBattleFighter,
  opponents: readonly PokemonPvPRosterEvaluationOpponent[],
  scenario: Scenario,
): number => {
  let weightedTotal = 0;
  let weightTotal = 0;
  for (const opponent of opponents) {
    const battle = simulateBattle(fighter, opponent.fighter, scenario);
    weightedTotal += ratingCurve(adjustedRating(battle, 0)) * opponent.weight;
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
