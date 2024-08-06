// calculateDPS.js

import { calculateDamage } from './calculateDamage';

export function calculateDPS(name, variant, fastMove, chargedMove, playerAttackStat, playerDefenseStat, playerStaminaStat, 
    raidBossDPS, raidBossAttack, raidBossDefense, raidBossStamina, selectedRaidBoss) {

    // Check if the variant is a Shadow Pokémon
    const isShadow = variant.variantType && variant.variantType.toLowerCase().includes("shadow");

    // Determine the raid boss types
    const raidBossType1 = selectedRaidBoss && selectedRaidBoss.type1_name ? selectedRaidBoss.type1_name.toLowerCase() : null;
    const raidBossType2 = selectedRaidBoss && selectedRaidBoss.type2_name ? selectedRaidBoss.type2_name.toLowerCase() : null;

    // Calculate damage dealt by the player's Pokémon
    let FDmg = calculateDamage(fastMove.raid_power, playerAttackStat, raidBossDefense, fastMove.type_name, variant.type1_name, variant.type2_name, raidBossType1, raidBossType2);
    let CDmg = calculateDamage(chargedMove.raid_power, playerAttackStat, raidBossDefense, chargedMove.type_name, variant.type1_name, variant.type2_name, raidBossType1, raidBossType2);

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

    let DTPS = calculateDamage(
        raidBossDPS, 
        raidBossAttack, 
        playerDefenseStat, 
        selectedRaidBoss && selectedRaidBoss.type1_name ? selectedRaidBoss.type1_name.toLowerCase() : '', 
        selectedRaidBoss && selectedRaidBoss.type1_name ? selectedRaidBoss.type1_name.toLowerCase() : '', 
        selectedRaidBoss && selectedRaidBoss.type2_name ? selectedRaidBoss.type2_name.toLowerCase() : '', 
        variant.type1_name, 
        variant.type2_name
    );    

    if (isShadow) {
        DTPS *= 1.2;
    }

    const energyGainedPerDamage = 0.5;
    const energyFromDamageTaken = DTPS * energyGainedPerDamage;

    const adjustedFEPS = FEPS + energyFromDamageTaken;
    const adjustedCEPS = CEPS + energyFromDamageTaken;

    const DPS0 = (FDPS * adjustedCEPS + CDPS * adjustedFEPS) / (adjustedCEPS + adjustedFEPS);
    const EE = (CDPS - FDPS) / (adjustedCEPS + adjustedFEPS);

    const x = 0.5 * Math.abs(chargedMove.raid_energy) + 0.5 * fastMove.raid_energy;
    const y = 900 / raidBossStamina;

    const DPS = DPS0 + EE * (0.5 - x / playerStaminaStat) * y;

    if (variant.pokemon_id === 3 && variant.variantType === "default" && fastMove.move_id === 16 && chargedMove.move_id === 204) {
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