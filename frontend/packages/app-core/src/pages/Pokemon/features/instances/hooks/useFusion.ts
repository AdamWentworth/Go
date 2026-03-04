// useFusion.ts
import { useState } from 'react';
import { getValidCandidates } from '../../fusion/core/getValidCandidates';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('useFusion');

interface FusionEntry {
  fusion_id: number;
  base_pokemon_id2?: number;
  name?: string;
}

export interface FusionState {
  is_fused: boolean;
  fusion_form: string | null;
  fusedWith: string | null;
  fusedOtherInstanceKey: string | null;
  storedFusionObject: Record<number, boolean>;
  overlayCandidates: PokemonVariant[];
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

export function useFusion(
  pokemon: PokemonVariant,
  alert: (msg: string) => void | Promise<void>,
  activeInstanceIdHint: string | null = null,
) {
  const ownership = pokemon.instanceData as PokemonInstance | undefined;
  const initialFusedWith = typeof ownership?.fused_with === 'string' ? ownership.fused_with : null;

  const [fusion, setFusion] = useState<FusionState>({
    is_fused: ownership?.is_fused ?? false,
    fusion_form: ownership?.fusion_form ?? null,
    fusedWith: initialFusedWith,
    fusedOtherInstanceKey: initialFusedWith,
    storedFusionObject: arrayToRecord(ownership?.fusion as FusionEntry[] | Record<number, boolean>),
    overlayCandidates: [],
    overlayPokemon: null,
    pendingFusionId: null,
  });

  const handleFusionToggle = async (fusionId: number) => {
    log.debug('handleFusionToggle called with fusionId:', fusionId);

    if (!ownership?.is_caught) {
      alert('This Pokémon is not caught. You cannot fuse with a non-caught instance.');
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
      const preferredPartnerId = fusion.fusedOtherInstanceKey ?? fusion.fusedWith ?? null;
      const currentInstanceId =
        (typeof activeInstanceIdHint === 'string' && activeInstanceIdHint.length > 0
          ? activeInstanceIdHint
          : null) ??
        (typeof ownership?.instance_id === 'string' && ownership.instance_id.length > 0
          ? ownership.instance_id
          : null);
      try {
        const candidates = await getValidCandidates(
          padded,
          ownership?.shiny ?? false,
          true,
          preferredPartnerId ? [preferredPartnerId] : [],
          currentInstanceId,
        );
        if (candidates.length === 0) {
          alert(`No valid instance found for fusion with base_pokemon_id2 ${baseId2}.`);
          return;
        }
        const orderedCandidates =
          preferredPartnerId == null
            ? candidates
            : [...candidates].sort((a, b) => {
                const aId = a.instanceData?.instance_id;
                const bId = b.instanceData?.instance_id;
                if (aId === preferredPartnerId && bId !== preferredPartnerId) return -1;
                if (bId === preferredPartnerId && aId !== preferredPartnerId) return 1;
                return 0;
              });
        setFusion(prev => ({
          ...prev,
          overlayCandidates: orderedCandidates,
          overlayPokemon: orderedCandidates[0] ?? null,
        }));
      } catch (error) {
        log.error('Error retrieving data from indexedDB:', error);
      }
    }
  };

  const handleFuseProceed = () => {
    log.debug('handleFuseProceed called');
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
      updated.overlayCandidates = [];
      updated.overlayPokemon = null;
      log.debug('handleFuseProceed updated fusion state:', updated);
      return updated;
    });
  };

  const handleUndoFusion = () => {
    log.debug('handleUndoFusion called');
    setFusion(prev => ({
      ...prev,
      is_fused: false,
      fusion_form: null,
      fusedWith: null,
      fusedOtherInstanceKey: prev.fusedWith ?? prev.fusedOtherInstanceKey,
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
