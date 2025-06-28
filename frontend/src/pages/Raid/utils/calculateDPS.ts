// calculateDPS.ts

import { calculateDamage } from './calculateDamage';

export interface Variant {
  variantType?: string;
  type1_name: string;
  type2_name: string;
}

export interface Move {
  raid_power: number;
  raid_cooldown: number;
  raid_energy: number;
  type_name: string;
}

export interface SelectedRaidBoss {
  type1_name: string;
  type2_name: string;
}

/**
 * Calculates the DPS (damage per second) for a given move combination.
 *
 * @param variant The player's Pokémon data.
 * @param fastMove The fast move data.
 * @param chargedMove The charged move data.
 * @param playerAttackStat Player's attack stat.
 * @param playerDefenseStat Player's defense stat.
 * @param playerStaminaStat Player's stamina stat.
 * @param raidBossDPS The raid boss DPS value.
 * @param raidBossAttack The raid boss attack stat.
 * @param raidBossDefense The raid boss defense stat.
 * @param raidBossStamina The raid boss stamina stat.
 * @param selectedRaidBoss Optional raid boss information (for type adjustments).
 * @returns The DPS value formatted to two decimal places.
 */
export function calculateDPS(
  variant: Variant,
  fastMove: Move,
  chargedMove: Move,
  playerAttackStat: number,
  playerDefenseStat: number,
  playerStaminaStat: number,
  raidBossDPS: number,
  raidBossAttack: number,
  raidBossDefense: number,
  raidBossStamina: number,
  selectedRaidBoss: SelectedRaidBoss | null
): string {
  // Check if the variant is a Shadow Pokémon.
  const isShadow =
    variant.variantType && variant.variantType.toLowerCase().includes('shadow');

  // Determine the raid boss types.
  const raidBossType1 = selectedRaidBoss && selectedRaidBoss.type1_name
    ? selectedRaidBoss.type1_name.toLowerCase()
    : null;
  const raidBossType2 = selectedRaidBoss && selectedRaidBoss.type2_name
    ? selectedRaidBoss.type2_name.toLowerCase()
    : null;

  // Calculate damage dealt by the player's Pokémon.
  let FDmg = calculateDamage(
    fastMove.raid_power,
    playerAttackStat,
    raidBossDefense,
    fastMove.type_name,
    variant.type1_name,
    variant.type2_name,
    raidBossType1,
    raidBossType2
  );
  let CDmg = calculateDamage(
    chargedMove.raid_power,
    playerAttackStat,
    raidBossDefense,
    chargedMove.type_name,
    variant.type1_name,
    variant.type2_name,
    raidBossType1,
    raidBossType2
  );

  // Apply Shadow Pokémon attack boost.
  if (isShadow) {
    FDmg *= 1.2;
    CDmg *= 1.2;
  }

  const fastCooldownSeconds = fastMove.raid_cooldown / 1000;
  const chargedCooldownSeconds = chargedMove.raid_cooldown / 1000;

  // Fast Move DPS.
  const FDPS = FDmg / fastCooldownSeconds;
  // Charged Move DPS.
  const CDPS = CDmg / chargedCooldownSeconds;

  // Energy Per Second.
  const FEPS = fastMove.raid_energy / fastCooldownSeconds;
  const CEPS = Math.abs(chargedMove.raid_energy) / chargedCooldownSeconds;

  if (isShadow) {
    raidBossDPS *= 1.2;
  }

  const energyGainedPerDamage = 0.5;
  const energyFromDamageTaken = raidBossDPS * energyGainedPerDamage;

  // Adjusted Energy Per Second - considering incoming damage.
  const adjustedFEPS = FEPS + energyFromDamageTaken;
  const adjustedCEPS = CEPS + energyFromDamageTaken;

  // Calculate a base DPS using a weighted average.
  const DPS0 =
    ((FDPS * adjustedCEPS) + (CDPS * adjustedFEPS)) /
    (adjustedCEPS + adjustedFEPS);

  const EE = (CDPS - FDPS) / (adjustedCEPS + adjustedFEPS);

  // Removed unused variable 'x'.
  const y = raidBossDPS;

  const DPS = DPS0 + EE * 0.5 * y;

  return DPS.toFixed(2);
}
