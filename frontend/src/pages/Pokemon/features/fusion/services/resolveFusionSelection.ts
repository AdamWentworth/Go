// src/pages/Pokemon/services/fusionSelection/resolveFusionSelection.ts

import { InstancesData } from '@/types/instances';
import { Fusion } from '@/types/pokemonSubTypes'; // ✅ reuse the shared type

type ResolveFusionParams = {
  choice: string;
  leftInstanceId: string;
  rightInstanceId: string;
  fusionData: Fusion; // ✅ use shared Fusion type
  ownershipData: InstancesData;
  updateDetails: (updates: Record<string, any>) => Promise<void>;
  resolve?: (result: string) => void;
};

export async function resolveFusionSelection({
  choice,
  leftInstanceId,
  rightInstanceId,
  fusionData,
  ownershipData,
  updateDetails,
  resolve,
}: ResolveFusionParams) {
  if (choice === 'confirmFuse' && leftInstanceId && rightInstanceId) {
    try {
      const fusionName = fusionData.name;
      const fusionId = fusionData.fusion_id;

      if (fusionId == null) {
        throw new Error('Missing fusion ID');
      }

      const changes = {
        [leftInstanceId]: {
          is_fused: true,
          fused_with: rightInstanceId,
          fusion_form: fusionName,
          fusion: {
            ...(ownershipData[leftInstanceId]?.fusion || {}),
            [fusionId]: true,
          },
        },
        [rightInstanceId]: {
          is_fused: true,
          fused_with: leftInstanceId,
          fusion_form: fusionName,
          disabled: true,
        },
      };

      await updateDetails(changes);
      resolve?.('fuseThis');
    } catch (error) {
      console.error('[Fusion Handler] Error during fusion resolution:', error);
    }
  } else {
    resolve?.('cancel');
  }
}
