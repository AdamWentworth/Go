import type {
  MaxBattleSimulationOutcome,
  MaxBattleTier,
} from '@/pages/Max/utils/maxBattleSimulation';

export type MaxBattleCalibrationFixture = {
  id: string;
  boss: 'starter' | 'gigantamax';
  tier: MaxBattleTier;
  trainers: number;
  team: 'starter-solo' | 'reference';
  expectedOutcomes: MaxBattleSimulationOutcome[];
};

// These are qualitative reference checks, not fabricated win probabilities.
// They pin the model to broadly observable gameplay boundaries: an ordinary
// one-star starter is a practical solo, promoted tiers are harder, and a
// Gigantamax encounter needs a coordinated lobby.
export const MAX_BATTLE_CALIBRATION_FIXTURES: MaxBattleCalibrationFixture[] = [
  {
    id: 'one-star-starter-solo',
    boss: 'starter',
    tier: 'one-star',
    trainers: 1,
    team: 'starter-solo',
    expectedOutcomes: ['likely-clear'],
  },
  {
    id: 'promoted-starter-solo',
    boss: 'starter',
    tier: 'three-star',
    trainers: 1,
    team: 'reference',
    expectedOutcomes: ['close-call', 'unlikely'],
  },
  {
    id: 'gigantamax-solo',
    boss: 'gigantamax',
    tier: 'gigantamax',
    trainers: 1,
    team: 'reference',
    expectedOutcomes: ['unlikely'],
  },
  {
    id: 'gigantamax-reference-lobby',
    boss: 'gigantamax',
    tier: 'gigantamax',
    trainers: 12,
    team: 'reference',
    expectedOutcomes: ['likely-clear'],
  },
];
