// calculateRaidBossDPS.js
import { calculateDamage } from './calculateDamage';
import { TYPE_MAPPING } from './constants';

export function calculateRaidBossDPS(raidBoss, raidBossAttack, playerPokemons, selectedFastMove, selectedChargedMove) {
    // Use selected moves if available, otherwise, default to all moves of that type
    const fastMoves = selectedFastMove ? [selectedFastMove] : raidBoss.moves.filter(move => move.is_fast === 1);
    const chargedMoves = selectedChargedMove ? [selectedChargedMove] : raidBoss.moves.filter(move => move.is_fast === 0);

    let dpsResults = [];
    
    let RaidBossType1= TYPE_MAPPING[raidBoss.type_1_id]?.name;
    let RaidBossType2= TYPE_MAPPING[raidBoss.type_2_id]?.name || 'none';

    playerPokemons.forEach(playerPokemon => {
        const raidBossDpsValues = fastMoves.flatMap(fastMove =>
            chargedMoves.map(chargedMove => {
                const FDmg = calculateDamage(fastMove.raid_power, raidBossAttack, playerPokemon.defense, fastMove.type_name, RaidBossType1, RaidBossType2, playerPokemon.type1, playerPokemon.type2);
                const CDmg = calculateDamage(chargedMove.raid_power, raidBossAttack, playerPokemon.defense, chargedMove.type_name, RaidBossType1, RaidBossType2, playerPokemon.type1, playerPokemon.type2);

                const fastCooldownSeconds = fastMove.raid_cooldown / 1000;
                const chargedCooldownSeconds = chargedMove.raid_cooldown / 1000;

                const FDPS = FDmg / fastCooldownSeconds;
                const CDPS = CDmg / chargedCooldownSeconds;

                return (FDPS + CDPS) / 2;  // Average DPS for this move combination
            })
        );

        const RaidBossAverageDPS = raidBossDpsValues.reduce((sum, dps) => sum + dps, 0) / raidBossDpsValues.length;
        dpsResults.push(RaidBossAverageDPS.toFixed(2));  // Store the average DPS for this specific Pokémon
    });
    console.log(dpsResults)
    console.log(playerPokemons)
    return dpsResults;  // Return an array of DPS values for each player's Pokémon
}
