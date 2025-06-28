// calculateRaidBossDPS.ts

import { calculateDamage } from './calculateDamage';
import { TYPE_MAPPING } from './constants';

export interface RaidMove {
  is_fast: number;
  raid_power: number;
  raid_cooldown: number;
  type_name: string;
}

export interface RaidBoss {
  moves: RaidMove[];
  type_1_id: number;
  type_2_id: number;
}

export interface PlayerPokemon {
  defense: number;
  type1: string;
  type2: string;
}

/**
 * Calculates an array of DPS values for each player's Pokémon by averaging
 * the DPS for each move combination (fast and charged moves) against the raid boss.
 *
 * @param raidBoss The raid boss object containing moves and type IDs.
 * @param raidBossAttack The raid boss' attack stat.
 * @param playerPokemons An array of the player's Pokémon.
 * @param selectedFastMove Optional fast move to use.
 * @param selectedChargedMove Optional charged move to use.
 * @returns An array of DPS values (as strings formatted to two decimal places).
 */
export function calculateRaidBossDPS(
  raidBoss: RaidBoss,
  raidBossAttack: number,
  playerPokemons: PlayerPokemon[],
  selectedFastMove?: RaidMove,
  selectedChargedMove?: RaidMove
): string[] {
  // Use selected moves if available, otherwise default to all moves of that type.
  const fastMoves: RaidMove[] = selectedFastMove 
    ? [selectedFastMove] 
    : raidBoss.moves.filter(move => move.is_fast === 1);
  const chargedMoves: RaidMove[] = selectedChargedMove 
    ? [selectedChargedMove] 
    : raidBoss.moves.filter(move => move.is_fast === 0);

  const dpsResults: string[] = [];

  // Assert that TYPE_MAPPING can be indexed by numbers.
  const typedTypeMapping = TYPE_MAPPING as Record<number, { name: string }>;
  const RaidBossType1: string | undefined = typedTypeMapping[raidBoss.type_1_id]?.name;
  const RaidBossType2: string = typedTypeMapping[raidBoss.type_2_id]?.name || 'none';

  playerPokemons.forEach(playerPokemon => {
    const raidBossDpsValues: number[] = fastMoves.flatMap(fastMove =>
      chargedMoves.map(chargedMove => {
        const FDmg = calculateDamage(
          fastMove.raid_power,
          raidBossAttack,
          playerPokemon.defense,
          fastMove.type_name,
          RaidBossType1,
          RaidBossType2,
          playerPokemon.type1,
          playerPokemon.type2
        );
        const CDmg = calculateDamage(
          chargedMove.raid_power,
          raidBossAttack,
          playerPokemon.defense,
          chargedMove.type_name,
          RaidBossType1,
          RaidBossType2,
          playerPokemon.type1,
          playerPokemon.type2
        );

        const fastCooldownSeconds = fastMove.raid_cooldown / 1000;
        const chargedCooldownSeconds = chargedMove.raid_cooldown / 1000;

        const FDPS = FDmg / fastCooldownSeconds;
        const CDPS = CDmg / chargedCooldownSeconds;

        return (FDPS + CDPS) / 2; // Average DPS for this move combination.
      })
    );

    const RaidBossAverageDPS: number = raidBossDpsValues.reduce((sum, dps) => sum + dps, 0) / raidBossDpsValues.length;
    dpsResults.push(RaidBossAverageDPS.toFixed(2));  // Format to two decimal places.
  });

  console.log(dpsResults);
  console.log(playerPokemons);
  return dpsResults;
}
