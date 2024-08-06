// calculateDamage.js

import { getTypeEffectivenessMultiplier } from './typeEffectiveness';

export function calculateDamage(power, attackStat, defenseStat, moveType, attackerType1, attackerType2, defenderType1, defenderType2) {
    moveType = moveType ? moveType.toLowerCase() : '';
    attackerType1 = attackerType1 ? attackerType1.toLowerCase() : '';
    attackerType2 = attackerType2 ? attackerType2.toLowerCase() : '';
    defenderType1 = defenderType1 ? defenderType1.toLowerCase() : '';
    defenderType2 = defenderType2 ? defenderType2.toLowerCase() : '';

    const STAB = (moveType === attackerType1 || moveType === attackerType2) ? 1.2 : 1.0;
    const effectiveness = getTypeEffectivenessMultiplier(moveType, [defenderType1, defenderType2]);

    const baseDamage = 0.5 * power * (attackStat / defenseStat);
    const modifiedDamage = baseDamage * effectiveness * STAB;

    return Math.floor(modifiedDamage + 1);
}




