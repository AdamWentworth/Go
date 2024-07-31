// moveCombinations.js

import { calculateDPS } from './calculateDPS';

// Default stats for a generic raid boss
const DEFAULT_BOSS_DPS = 20
const DEFAULT_BOSS_ATTACK = 150;
const DEFAULT_BOSS_DEFENSE = 150;
const DEFAULT_BOSS_HP = 15000;

export function getMoveCombinations(variant, raidBossDPS = DEFAULT_BOSS_DPS, raidBossAttack = DEFAULT_BOSS_ATTACK, raidBossDefense = DEFAULT_BOSS_DEFENSE, raidBossStamina = DEFAULT_BOSS_HP) {
    const fastMoves = variant.moves.filter(move => move.is_fast === 1);
    const chargedMoves = variant.moves.filter(move => move.is_fast === 0);
    const playerAttackStat = variant.attack + 15; // Player Pokémon's attack stat
    const playerDefenseStat = variant.defense + 15; // Player Pokémon's defense stat
    const playerStaminaStat = variant.stamina + 15; // Player Pokémon's stamina stat
    const name = variant.name

    return fastMoves.flatMap(fastMove => 
        chargedMoves.map(chargedMove => {
            const dps = calculateDPS(name, variant, fastMove, chargedMove, playerAttackStat, playerDefenseStat, playerStaminaStat, 
                raidBossDPS, raidBossAttack, raidBossDefense, raidBossStamina);
            
            return {
                name: variant.name,
                fastMove: fastMove.name,
                chargedMove: chargedMove.name,
                dps: dps,
                tdo: '---',
                er: '---',
                cp: variant.cp || '---'
            };
        })
    );
}
