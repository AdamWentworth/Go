// useFusionSelectionState.ts
import { useState } from 'react';
import { resolveFusionDetails } from '../services/resolveFusionDetails';
import type { FusionSelectionData } from '@/types/fusion';

export function useFusionSelectionState() {
  const [isFusionSelectionOpen, setIsFusionSelectionOpen] = useState(false);
  const [fusionSelectionData, setFusionSelectionData] = useState<FusionSelectionData | null>(null);

  async function promptFusionPokemonSelection(baseKey: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const fusionDetails = await resolveFusionDetails(baseKey);
        setFusionSelectionData({
          baseKey,
          resolve,
          reject,
          ...fusionDetails,
        });
        setIsFusionSelectionOpen(true);
      } catch (err) {
        console.error('[Fusion Handler] Error in promptFusionPokemonSelection:', err);
        reject(err);
      }
    });
  }

  function rejectSelection(error: any) {
    fusionSelectionData?.reject?.(error);
    setFusionSelectionData(null);
    setIsFusionSelectionOpen(false);
  }

  function closeSelection() {
    rejectSelection('User canceled');
  }

  return {
    isFusionSelectionOpen,
    fusionSelectionData,
    setFusionSelectionData,
    promptFusionPokemonSelection,
    rejectSelection,
    closeSelection,
  };
}
