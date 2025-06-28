// useFusion.ts
import { useState } from 'react';
import { getValidCandidates } from '../../fusion/core/getValidCandidates';
import { PokemonVariant } from '@/types/pokemonVariants';
import { PokemonInstance } from '@/types/pokemonInstance';

interface FusionEntry {
  fusion_id: number;
  base_pokemon_id2?: number;
  name?: string;
}

interface FusionState {
  is_fused: boolean;
  fusion_form: string | null;
  fusedWith: string | null;
  fusedOtherInstanceKey: string | null;
  storedFusionObject: Record<number, boolean>;
  overlayPokemon: PokemonVariant | null;
  pendingFusionId: number | null;
}

// Helper to normalize old array format into record format
function arrayToRecord(arr?: FusionEntry[] | Record<number, boolean>): Record<number, boolean> {
  if (!arr) return {};
  if (!Array.isArray(arr)) return { ...arr };
  return arr.reduce<Record<number, boolean>>((rec, entry) => {
    if (entry && typeof entry.fusion_id === 'number') {
      rec[entry.fusion_id] = true;
    }
    return rec;
  }, {});
}

export function useFusion(pokemon: PokemonVariant, alert: (msg: string) => void) {
  const ownership = pokemon.instanceData as PokemonInstance | undefined;

  const [fusion, setFusion] = useState<FusionState>({
    is_fused: ownership?.is_fused ?? false,
    fusion_form: ownership?.fusion_form ?? null,
    fusedWith: typeof ownership?.fused_with === 'string' ? ownership.fused_with : null,
    fusedOtherInstanceKey: null,
    storedFusionObject: arrayToRecord(ownership?.fusion as FusionEntry[] | Record<number, boolean>),
    overlayPokemon: null,
    pendingFusionId: null,
  });

  const handleFusionToggle = async (fusionId: number) => {
    console.log('handleFusionToggle called with fusionId:', fusionId);

    if (!ownership?.is_owned) {
      alert('This Pokémon is not owned. You cannot fuse with a non-owned instance.');
      return;
    }
    if (ownership.is_for_trade) {
      alert('This instance is listed "for trade". Remove it from trade listings before fusing.');
      return;
    }

    setFusion(prev => ({ ...prev, pendingFusionId: fusionId }));

    const fusionArray = pokemon.fusion ?? [];
    const selectedFusion = fusionArray.find(f => f.fusion_id === fusionId);
    if (selectedFusion?.base_pokemon_id2 != null) {
      const baseId2 = selectedFusion.base_pokemon_id2;
      const padded = baseId2.toString().padStart(4, '0');

      try {
        const candidates = await getValidCandidates(padded, ownership?.shiny ?? false, false);
        if (candidates.length === 0) {
          alert(`No valid instance found for fusion with base_pokemon_id2 ${baseId2}.`);
          return;
        }
        setFusion(prev => ({ ...prev, overlayPokemon: candidates[0] }));
      } catch (error) {
        console.error('Error retrieving data from indexedDB:', error);
      }
    }
  };

  const handleFuseProceed = () => {
    console.log('handleFuseProceed called');
    setFusion(prev => {
      const updated = { ...prev };
      if (prev.pendingFusionId != null) {
        const fusionArray = pokemon.fusion ?? [];
        const foundFusion = fusionArray.find(f => f.fusion_id === prev.pendingFusionId);
        const fusionName = foundFusion?.name || `Fusion ${prev.pendingFusionId}`;

        updated.is_fused = true;
        updated.fusion_form = fusionName;

        const otherId = prev.overlayPokemon?.instanceData?.instance_id;
        if (otherId) {
          updated.fusedWith = otherId;
          updated.fusedOtherInstanceKey = otherId;
        }

        updated.storedFusionObject = {
          ...prev.storedFusionObject,
          [prev.pendingFusionId]: true,
        };
        updated.pendingFusionId = null;
      }
      updated.overlayPokemon = null;
      console.log('handleFuseProceed updated fusion state:', updated);
      return updated;
    });
  };

  const handleUndoFusion = () => {
    console.log('handleUndoFusion called');
    setFusion(prev => ({
      ...prev,
      is_fused: false,
      fusion_form: null,
      fusedWith: null,
      fusedOtherInstanceKey: null,
    }));
  };

  return {
    fusion,
    setFusion,
    handleFusionToggle,
    handleFuseProceed,
    handleUndoFusion,
  };
}
