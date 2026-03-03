import { getTypeEffectivenessMultiplier } from './typeEffectiveness';

export function calculateDamage(
  power: number,
  attackStat: number,
  defenseStat: number,
  moveType?: string | null,
  attackerType1?: string | null,
  attackerType2?: string | null,
  defenderType1?: string | null,
  defenderType2?: string | null,
): number {
  const normalizedMoveType = moveType ? moveType.toLowerCase() : '';
  const normalizedAttackerType1 = attackerType1 ? attackerType1.toLowerCase() : '';
  const normalizedAttackerType2 = attackerType2 ? attackerType2.toLowerCase() : '';
  const normalizedDefenderType1 = defenderType1 ? defenderType1.toLowerCase() : '';
  const normalizedDefenderType2 = defenderType2 ? defenderType2.toLowerCase() : '';

  const STAB =
    normalizedMoveType === normalizedAttackerType1 ||
    normalizedMoveType === normalizedAttackerType2
      ? 1.2
      : 1.0;
  const effectiveness = getTypeEffectivenessMultiplier(normalizedMoveType, [
    normalizedDefenderType1,
    normalizedDefenderType2,
  ]);

  const baseDamage = power * (attackStat / defenseStat);
  const modifiedDamage = 0.5 * baseDamage * effectiveness * STAB;

  return Math.floor(modifiedDamage + 0.5);
}
