// calculateRaidBossDPS.js
import { calculateDamage } from './calculateDamage';

export function calculateRaidBossDPS(raidBoss, raidBossAttack, raidBossDefense, raidBossStamina, playerPokemons) {
    const fastMoves = raidBoss.moves.filter(move => move.is_fast === 1);
    const chargedMoves = raidBoss.moves.filter(move => move.is_fast === 0);

    let totalDPS = 0;

    playerPokemons.forEach(playerPokemon => {
        const playerDpsValues = fastMoves.flatMap(fastMove => 
            chargedMoves.map(chargedMove => {
                const FDmg = calculateDamage(fastMove.raid_power, raidBossAttack, playerPokemon.defense, fastMove.type_name, playerPokemon.type1, playerPokemon.type2);
                const CDmg = calculateDamage(chargedMove.raid_power, raidBossAttack, playerPokemon.defense, chargedMove.type_name, playerPokemon.type1, playerPokemon.type2);

                const fastCooldownSeconds = fastMove.raid_cooldown / 1000;
                const chargedCooldownSeconds = chargedMove.raid_cooldown / 1000;

                const FDPS = FDmg / fastCooldownSeconds;
                const CDPS = CDmg / chargedCooldownSeconds;

                return (FDPS + CDPS) / 2;  // Average DPS for this move combination
            })
        );

        const playerAverageDPS = playerDpsValues.reduce((sum, dps) => sum + dps, 0) / playerDpsValues.length;
        totalDPS += playerAverageDPS;
    });

    const averageDPS = totalDPS / playerPokemons.length;

    if (raidBoss.pokemon_id === 260) {
        playerPokemons.forEach(playerPokemon => {
        });
    }

    return averageDPS.toFixed(2);
}