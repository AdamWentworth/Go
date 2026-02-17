// src/pages/Pokemon/services/fusionSelection/resolveFusionSelection.ts

import type { Instances } from '@/types/instances';
import { Fusion } from '@/types/pokemonSubTypes';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('resolveFusionSelection');

type ResolveFusionParams = {
  choice: string;
  leftInstanceId: string;
  rightInstanceId: string;
  fusionData: Fusion;
  instances: Instances;
  updateDetails: (updates: Record<string, any>) => Promise<void>;
  resolve?: (result: string) => void;
};

export async function resolveFusionSelection({
  choice,
  leftInstanceId,
  rightInstanceId,
  fusionData,
  instances,
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
            ...(instances[leftInstanceId]?.fusion || {}),
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
      log.error('Error during fusion resolution:', error);
    }
  } else {
    resolve?.('cancel');
  }
}
