// utils/calculateBaseStats.ts

import type { BasePokemon } from '@/types/pokemonBase';
import type { MegaEvolution, Fusion } from '@/types/pokemonSubTypes';
import type { BaseStats, FusionState, MegaData } from '@/types/pokemonUtils';

export const calculateBaseStats = (
  pokemon: BasePokemon,
  megaData: MegaData,
  fusionState?: FusionState
): BaseStats => {
  if (fusionState && fusionState.is_fused && fusionState.fusion_form) {
    const fusionEntry = pokemon.fusion?.find(
      (f: Fusion) => f.name?.toLowerCase() === fusionState.fusion_form?.toLowerCase()
    );

    if (fusionEntry && fusionEntry.attack && fusionEntry.defense && fusionEntry.stamina) {
      return {
        attack: Number(fusionEntry.attack),
        defense: Number(fusionEntry.defense),
        stamina: Number(fusionEntry.stamina),
      };
    } else {
      console.warn(
        `Fusion "${fusionState.fusion_form}" not found or missing stats for Pokémon "${pokemon.name}". Falling back to Mega or normal stats.`
      );
    }
  }

  if (megaData.isMega) {
    if (megaData.megaForm) {
      const selectedMega = pokemon.megaEvolutions.find(
        (me: MegaEvolution) => me.form?.toLowerCase() === megaData.megaForm?.toLowerCase()
      );
      if (selectedMega) {
        return {
          attack: Number(selectedMega.attack),
          defense: Number(selectedMega.defense),
          stamina: Number(selectedMega.stamina),
        };
      } else {
        console.warn(
          `Mega form "${megaData.megaForm}" not found in megaEvolutions for Pokémon "${pokemon.name}". Falling back to normal stats.`
        );
      }
    } else {
      const selectedMega = pokemon.megaEvolutions.find((me: MegaEvolution) => !me.form);
      if (selectedMega) {
        return {
          attack: Number(selectedMega.attack),
          defense: Number(selectedMega.defense),
          stamina: Number(selectedMega.stamina),
        };
      } else {
        console.warn(
          `No Mega form with null form found in megaEvolutions for Pokémon "${pokemon.name}". Falling back to normal stats.`
        );
      }
    }
  }

  return {
    attack: Number(pokemon.attack),
    defense: Number(pokemon.defense),
    stamina: Number(pokemon.stamina),
  };
};
