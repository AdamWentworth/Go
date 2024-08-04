// moveCombinations.js

import { calculateDPS } from './calculateDPS';
import cpMultipliers from './constants';

// Default stats for a generic raid boss
const DEFAULT_BOSS_DPS = 20;
const DEFAULT_BOSS_ATTACK = 200;
const DEFAULT_BOSS_DEFENSE = 160;
const DEFAULT_BOSS_HP = 15000;

// Level 40 CP multiplier
const LEVEL_40_CP_MULTIPLIER = cpMultipliers["40.0"];

export function getMoveCombinations(variant, raidBossDPS = DEFAULT_BOSS_DPS, raidBossAttack = DEFAULT_BOSS_ATTACK, raidBossDefense = DEFAULT_BOSS_DEFENSE, raidBossStamina = DEFAULT_BOSS_HP) {
    const fastMoves = variant.moves.filter(move => move.is_fast === 1);
    const chargedMoves = variant.moves.filter(move => move.is_fast === 0);

    // Apply the level 40 CP multiplier to the player stats and floor them
    const playerAttackStat = Math.floor((variant.attack + 15) * LEVEL_40_CP_MULTIPLIER); // Player Pokémon's attack stat
    const playerDefenseStat = Math.floor((variant.defense + 15) * LEVEL_40_CP_MULTIPLIER); // Player Pokémon's defense stat
    const playerStaminaStat = Math.floor((variant.stamina + 15) * LEVEL_40_CP_MULTIPLIER); // Player Pokémon's stamina stat
    const name = variant.name;

    // Calculate CP for logging
    const cp = calculateCP(variant.attack + 15, variant.defense + 15, variant.stamina + 15, LEVEL_40_CP_MULTIPLIER);

    // Conditional logging for specific Pokémon ID
    if (variant.pokemon_id === 3 && variant.variantType === "default") {
        console.log(`Calculating move combinations for ${name} (Pokémon ID 3)`);
        console.log(`Attack stat (with multiplier): ${playerAttackStat}`);
        console.log(`Defense stat (with multiplier): ${playerDefenseStat}`);
        console.log(`Stamina stat (with multiplier): ${playerStaminaStat}`);
        console.log(`CP: ${cp}`);
    }

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

function calculateCP(attack, defense, stamina, cpMultiplier) {
    return Math.floor((attack * Math.sqrt(defense) * Math.sqrt(stamina) * cpMultiplier ** 2) / 10);
}
