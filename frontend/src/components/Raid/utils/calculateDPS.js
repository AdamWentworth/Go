// calculateDPS.js

export function calculateDPS(name, variant, fastMove, chargedMove, playerAttackStat, playerDefenseStat, playerStaminaStat, 
    raidBossDPS, raidBossAttack, raidBossDefense, raidBossStamina) {

    // Check if the variant is a Shadow Pokémon
    const isShadow = variant.variantType && variant.variantType.toLowerCase().includes("shadow");

    // Calculate damage dealt by the player's Pokémon
    let FDmg = calculateDamage(fastMove.raid_power, playerAttackStat, raidBossDefense, fastMove.type_name, variant.type1_name, variant.type2_name);
    let CDmg = calculateDamage(chargedMove.raid_power, playerAttackStat, raidBossDefense, chargedMove.type_name, variant.type1_name, variant.type2_name);

    // Apply Shadow Pokémon attack boost
    if (isShadow) {
        FDmg *= 1.2;
        CDmg *= 1.2;
    }

    const fastCooldownSeconds = fastMove.raid_cooldown / 1000;
    const chargedCooldownSeconds = chargedMove.raid_cooldown / 1000;

    const FDPS = FDmg / fastCooldownSeconds;
    const CDPS = CDmg / chargedCooldownSeconds;

    const FEPS = fastMove.raid_energy / fastCooldownSeconds;
    const CEPS = Math.abs(chargedMove.raid_energy) / chargedCooldownSeconds;

    // Calculate damage taken per second (DTPS) by the player
    let DTPS = calculateDamage(raidBossDPS, raidBossAttack, playerDefenseStat, '', '', '');

    // Apply Shadow Pokémon defense reduction
    if (isShadow) {
        DTPS *= 1.2;
    }

    // Assume a specific amount of energy gained per damage taken (this value can be adjusted based on actual game mechanics)
    const energyGainedPerDamage = 0.5; // Example value, this can be adjusted
    const energyFromDamageTaken = DTPS * energyGainedPerDamage;

    // Adjusted EPS values
    const adjustedFEPS = FEPS + energyFromDamageTaken;
    const adjustedCEPS = CEPS + energyFromDamageTaken;

    const DPS0 = (FDPS * adjustedCEPS + CDPS * adjustedFEPS) / (adjustedCEPS + adjustedFEPS);
    const EE = (CDPS - FDPS) / (adjustedCEPS + adjustedFEPS);

    const x = 0.5 * Math.abs(chargedMove.raid_energy) + 0.5 * fastMove.raid_energy;
    const y = 900 / raidBossStamina;

    const DPS = DPS0 + EE * (0.5 - x / playerStaminaStat) * y;

    if (variant.pokemon_id === 3 && variant.variantType === "default" && fastMove.move_id === 15 && chargedMove.move_id === 204) {
        console.log(`Detailed Calculation Logs for ${name} (Pokemon ID 3, default variant):`);
        console.log(`Moves:`, fastMove.name, chargedMove.name);
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
        console.log(`Damage Taken Per Second (DTPS): ${DTPS}`);
        console.log(`Energy Gained from Damage Taken: ${energyFromDamageTaken}`);
        console.log(`Adjusted Fast Energy Per Second (adjustedFEPS): ${adjustedFEPS}`);
        console.log(`Adjusted Charged Energy Per Second (adjustedCEPS): ${adjustedCEPS}`);
        console.log(`Final DPS: ${DPS}`);
    }

    return DPS.toFixed(2);
}

function calculateDamage(power, attackStat, defenseStat, moveType, pokemonType1, pokemonType2) {
    moveType = moveType ? moveType.toLowerCase() : '';
    pokemonType1 = pokemonType1 ? pokemonType1.toLowerCase() : '';
    pokemonType2 = pokemonType2 ? pokemonType2.toLowerCase() : '';

    const STAB = (moveType === pokemonType1 || moveType === pokemonType2) ? 1.2 : 1.0;
    const effectiveness = 1; // Placeholder for actual effectiveness based on type matchups

    return Math.floor((0.5 * power * (attackStat / defenseStat) * effectiveness * STAB) + 1);
}
