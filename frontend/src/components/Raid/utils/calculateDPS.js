// calculateDPS.js

export function calculateDPS(name, variant, fastMove, chargedMove, playerAttackStat, playerDefenseStat, playerStaminaStat, 
    raidBossDPS, raidBossAttack, raidBossDefense, raidBossStamina) {
    const FDmg = calculateDamage(fastMove.raid_power, playerAttackStat, raidBossDefense);
    const CDmg = calculateDamage(chargedMove.raid_power, playerAttackStat, raidBossDefense);

    // Convert cooldown from milliseconds to seconds
    const fastCooldownSeconds = fastMove.raid_cooldown / 1000;
    const chargedCooldownSeconds = chargedMove.raid_cooldown / 1000;

    // Calculate DPS using the converted cooldown times
    const FDPS = FDmg / fastCooldownSeconds;
    const CDPS = CDmg / chargedCooldownSeconds;

    // Calculate energy per second using the converted cooldown times
    const FEPS = fastMove.raid_energy / fastCooldownSeconds;
    const CEPS = Math.abs(chargedMove.raid_energy) / chargedCooldownSeconds;

    const DPS0 = (FDPS * CEPS + CDPS * FEPS) / (CEPS + FEPS);
    const EE = (CDPS - FDPS) / (CEPS + FEPS);

    const x = 0.5 * Math.abs(chargedMove.raid_energy) + 0.5 * fastMove.raid_energy;
    const y = 900 / raidBossStamina;

    const DPS = DPS0 + EE * (0.5 - x / raidBossStamina) * y;

    // Conditional verbose output if Pokemon ID is 3 and variantType is "default"
    if (variant.pokemon_id === 3 && variant.variantType === "default") {
        console.log(`Detailed Calculation Logs for ${name} (Pokemon ID 3, default variant):`);
        console.log(`Moves:`, fastMove.name, chargedMove.name)
        console.log(`Fast Move Damage (FDmg): ${FDmg}`);
        console.log(`Charged Move Damage (CDmg): ${CDmg}`);
        console.log(`Fast DPS (FDPS): ${FDPS}`);
        console.log(`Charged DPS (CDPS): ${CDPS}`);
        console.log(`Fast Energy Per Second (FEPS): ${FEPS}`);
        console.log(`Charged Energy Per Second (CEPS): ${CEPS}`);
        console.log(`Combined DPS (DPS0): ${DPS0}`);
        console.log(`Energy Efficiency (EE): ${EE}`);
        console.log(`Energy balance factor (x): ${x}`);
        console.log(`Boss stamina scaling factor (y): ${y}`);
        console.log(`Final DPS: ${DPS}`);
    }

    return DPS.toFixed(2);
}

function calculateDamage(power, attackStat, defenseStat) {
    const effectiveness = 1; // Placeholder for actual effectiveness based on type matchups
    const STAB = 1; // Placeholder for Same Type Attack Bonus, adjust if move type matches Pokémon type
    return (0.5 * power * (attackStat / defenseStat) * effectiveness * STAB) + 1;
}
