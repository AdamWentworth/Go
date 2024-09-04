// calculateDPS.js

import { calculateDamage } from './calculateDamage';

export function calculateDPS(variant, fastMove, chargedMove, playerAttackStat, playerDefenseStat, playerStaminaStat, 
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

    // Fast Move DPS
    const FDPS = FDmg / fastCooldownSeconds;
    // Charged Move DPS
    const CDPS = CDmg / chargedCooldownSeconds;

    // Energy Per Second
    const FEPS = fastMove.raid_energy / fastCooldownSeconds;
    const CEPS = Math.abs(chargedMove.raid_energy) / chargedCooldownSeconds;

    if (isShadow) {
        raidBossDPS *= 1.2;
    }

    const energyGainedPerDamage = 0.5;
    const energyFromDamageTaken = raidBossDPS * energyGainedPerDamage;

    // Adjusted Energy Per Second - considering Incoming Damage
    const adjustedFEPS = FEPS + energyFromDamageTaken;
    const adjustedCEPS = CEPS + energyFromDamageTaken;

    const DPS0 = ((FDPS * adjustedCEPS) + (CDPS * adjustedFEPS)) / (adjustedCEPS + adjustedFEPS);

    const EE = (CDPS - FDPS) / (adjustedCEPS + adjustedFEPS);

    const x = 0.5 * Math.abs(chargedMove.raid_energy) + 0.5 * fastMove.raid_energy;
    const y = raidBossDPS;

    const DPS = DPS0 + EE * 0.5 * y;

    return DPS.toFixed(2);
}