// useFusionPokemonHandler.ts

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { resolveFusionSelection } from '../services/resolveFusionSelection';
import { createLeftFusionInstance, createRightFusionInstance } from './useFusionInstanceCreation';
import { useFusionSelectionState } from './useFusionSelectionState';

function useFusionPokemonHandler() {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const instances = useInstancesStore((s) => s.instances);

  const {
    isFusionSelectionOpen,
    fusionSelectionData,
    setFusionSelectionData,
    promptFusionPokemonSelection,
    rejectSelection,
    closeSelection,
  } = useFusionSelectionState();

  async function handleCreateNewLeft() {
    await createLeftFusionInstance({
      fusionSelectionData,
      updateDetails,
      setFusionSelectionData,
    });
  }

  async function handleCreateNewRight() {
    await createRightFusionInstance({
      fusionSelectionData,
      updateDetails,
      setFusionSelectionData,
    });
  }

  async function handleFusionSelectionResolve(choice: string, leftInstanceId: string, rightInstanceId: string) {
    if (!fusionSelectionData?.fusionData) return; // ✅ prevent undefined
  
    await resolveFusionSelection({
      choice,
      leftInstanceId,
      rightInstanceId,
      fusionData: fusionSelectionData.fusionData, // ✅ now it's guaranteed
      instances,
      updateDetails,
      resolve: fusionSelectionData.resolve,
    });
  
    setFusionSelectionData(null);
    closeSelection();
  }  

  function handleFusionSelectionReject(error: unknown) {
    rejectSelection(error);
  }

  return {
    promptFusionPokemonSelection,
    isFusionSelectionOpen,
    fusionSelectionData,
    handleFusionSelectionResolve,
    handleFusionSelectionReject,
    closeFusionSelection: closeSelection,
    handleCreateNewLeft,
    handleCreateNewRight,
  };
}

export default useFusionPokemonHandler;
