// calculateDPS.js

export function calculateDPS(fastMove, chargedMove, pokemonHP, enemyDPS) {
    const FDPS = fastMove.raid_power / (fastMove.raid_cooldown / 1000);
    const CDPS = chargedMove.raid_power / (chargedMove.raid_cooldown / 1000);
    const FEPS = fastMove.raid_energy / (fastMove.raid_cooldown / 1000);
    const CEPS = Math.abs(chargedMove.raid_energy) / (chargedMove.raid_cooldown / 1000);

    const DPS0 = (FDPS * CEPS + CDPS * FEPS) / (CEPS + FEPS);
    const EE = (CDPS - FDPS) / (CEPS + FEPS);

    // Assuming average energy left x and using the provided HP and enemy DPS
    const x = 0.5 * Math.abs(chargedMove.raid_energy) + 0.5 * fastMove.raid_energy;
    const y = 900 / pokemonHP;

    const DPS = DPS0 + EE * (0.5 - x / pokemonHP) * enemyDPS;
    return DPS.toFixed(2);
}
