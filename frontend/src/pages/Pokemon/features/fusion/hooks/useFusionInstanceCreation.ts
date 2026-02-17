// useFusionInstanceCreation.ts

import { createFusionInstance } from '../services/createFusionInstance';
import { FusionSelectionData } from '@/types/fusion';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useFusionInstanceCreation');

interface CreateInstanceProps {
    fusionSelectionData: FusionSelectionData | null;
    updateDetails: (
      keyOrKeysOrMap: string | string[] | Record<string, Partial<PokemonInstance>>,
      maybePatch?: Partial<PokemonInstance>,
    ) => Promise<void>;
    setFusionSelectionData: React.Dispatch<React.SetStateAction<FusionSelectionData | null>>;
  }
  
export async function createLeftFusionInstance({
  fusionSelectionData,
  updateDetails,
  setFusionSelectionData,
}: CreateInstanceProps): Promise<void> {
  if (!fusionSelectionData) return;
  const { baseNumber, isShiny } = fusionSelectionData;
  const variantKey = isShiny ? `${baseNumber}-shiny` : `${baseNumber}-default`;

  try {
    const enrichedCandidate = await createFusionInstance({
      variantKey,
      isShiny,
      updateDetails,
    });

    setFusionSelectionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        leftCandidatesList: [...prev.leftCandidatesList, enrichedCandidate],
      };
    });
  } catch (err) {
    log.error('Failed to create left instance:', err);
    setFusionSelectionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        error: 'Failed to create a new fused Pokémon for the left parent.',
      };
    });
  }
}

export async function createRightFusionInstance({
  fusionSelectionData,
  updateDetails,
  setFusionSelectionData,
}: CreateInstanceProps): Promise<void> {
  if (!fusionSelectionData) return;
  const { fusionData } = fusionSelectionData;
  const variantKey = `${fusionData.base_pokemon_id2}`.padStart(4, '0') + '-default';

  try {
    const enrichedCandidate = await createFusionInstance({
      variantKey,
      isShiny: false,
      updateDetails,
    });

    setFusionSelectionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rightCandidatesList: [...prev.rightCandidatesList, enrichedCandidate],
      };
    });
  } catch (err) {
    log.error('Failed to create right instance:', err);
    setFusionSelectionData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        error: 'Failed to create a new fused Pokémon for the right parent.',
      };
    });
  }
}
