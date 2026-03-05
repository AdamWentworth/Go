// utils/calculateBaseStats.ts

import type { BasePokemon } from '@/types/pokemonBase';
import type { MegaEvolution, Fusion, CrownForm } from '@/types/pokemonSubTypes';
import type { BaseStats, CrownState, FusionState, MegaData } from '@/types/pokemonUtils';
import { createScopedLogger } from '@/utils/logger';
import { resolveActiveCrownForm } from '@/utils/crownHelpers';

const log = createScopedLogger('calculateBaseStats');

type StatsPokemon = Pick<
  BasePokemon,
  'attack' | 'defense' | 'stamina' | 'name' | 'fusion' | 'megaEvolutions' | 'crownForms'
>;

export const calculateBaseStats = (
  pokemon: StatsPokemon,
  megaData: MegaData,
  fusionState?: FusionState,
  crownState?: CrownState,
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
      log.warn(
        `Fusion "${fusionState.fusion_form}" not found or missing stats for Pokémon "${pokemon.name}". Falling back to Mega or normal stats.`
      );
    }
  }

  if (crownState?.is_crown) {
    const selectedCrownForm = resolveActiveCrownForm(
      pokemon.crownForms as CrownForm[] | undefined,
      crownState.crown_form,
    );
    if (
      selectedCrownForm &&
      selectedCrownForm.attack != null &&
      selectedCrownForm.defense != null &&
      selectedCrownForm.stamina != null
    ) {
      return {
        attack: Number(selectedCrownForm.attack),
        defense: Number(selectedCrownForm.defense),
        stamina: Number(selectedCrownForm.stamina),
      };
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
        log.warn(
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
        log.warn(
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

