// moveCombinations.js
import { calculateDPS } from './calculateDPS';
import { cpMultipliers } from './constants';

const LEVEL_40_CP_MULTIPLIER = cpMultipliers["40.0"];
const LEVEL_50_CP_MULTIPLIER = cpMultipliers["50.0"];

export function getMoveCombinations(variant, raidBossDPS, raidBossAttack, raidBossDefense, raidBossStamina, selectedRaidBoss) {
    if (!variant || !variant.moves) {
        return []; // Return an empty array if variant or moves are undefined
    }

    const fastMoves = variant.moves.filter(move => move.is_fast === 1);
    const chargedMoves = variant.moves.filter(move => move.is_fast === 0);

    const playerAttackStat = Math.floor((variant.attack + 15) * LEVEL_50_CP_MULTIPLIER);
    const playerDefenseStat = Math.floor((variant.defense + 15) * LEVEL_50_CP_MULTIPLIER);
    const playerStaminaStat = Math.floor((variant.stamina + 15) * LEVEL_50_CP_MULTIPLIER);
    const name = variant.name;

    const cp = calculateCP(variant.attack + 15, variant.defense + 15, variant.stamina + 15, LEVEL_50_CP_MULTIPLIER);

    return fastMoves.flatMap(fastMove => 
        chargedMoves.map(chargedMove => {
            const dps = calculateDPS(variant, fastMove, chargedMove, playerAttackStat, playerDefenseStat, playerStaminaStat, 
                raidBossDPS, raidBossAttack, raidBossDefense, raidBossStamina, selectedRaidBoss);
            
            return {
                name: variant.name,
                fastMove: fastMove.name,
                chargedMove: chargedMove.name,
                dps: dps,
                tdo: '---',
                er: '---',
                cp: cp.toString()
            };
        })
    );
}

function calculateCP(attack, defense, stamina, cpMultiplier) {
    return Math.floor((attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplier ** 2) / 10);
}
