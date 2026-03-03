// src/pages/Pokemon/hooks/useInstanceIdProcessor.ts
//--------------------------------------------------
// Handles deep‑links like “…?instanceId=xxx” by opening
// the overlay for that instance once all data is ready.
//--------------------------------------------------

import { useEffect, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import { useUserSearchStore } from '@/stores/useUserSearchStore';
import { getEntityKeyFrom } from '@/utils/PokemonIDUtils';

import type { PokemonVariant  } from '@/types/pokemonVariants';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LocationState {
  instanceId?: string | null;
  [key: string]: unknown;
}
interface AppLocation {
  state?: LocationState;
  pathname: string;
}

export type PokemonOverlaySelection =
  | PokemonVariant
  | { pokemon: PokemonVariant; overlayType: 'instance' }
  | null;

export interface UseInstanceIdProcessorProps {
  /** Are the base variants still loading? */
  variantsLoading: boolean;

  /** List already filtered/search‑sorted by the parent */
  filteredVariants: PokemonVariant[];

  /* router bits */
  location: AppLocation;
  navigate: NavigateFunction;

  /* UI state setters */
  selectedPokemon: PokemonOverlaySelection;
  setSelectedPokemon: (p: PokemonOverlaySelection) => void;
  hasProcessedInstanceId: boolean;
  setHasProcessedInstanceId: (b: boolean) => void;

  /* misc */
  isOwnCollection: boolean;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */
export default function useInstanceIdProcessor({
  variantsLoading,
  filteredVariants,
  location,
  navigate,
  selectedPokemon,
  setSelectedPokemon,
  hasProcessedInstanceId,
  setHasProcessedInstanceId,
  isOwnCollection,
}: UseInstanceIdProcessorProps): void {
  const [retryCounter, setRetryCounter] = useState(0);

  // 🔎  Pull loader state straight from the stores (no prop‑drilling)
  const { foreignInstancesLoading, viewedInstances } = useUserSearchStore.getState();
  const searchInstances = viewedInstances;

  useEffect(() => {
    if (variantsLoading || foreignInstancesLoading) return;
    if (!searchInstances || filteredVariants.length === 0) return;
    if (isOwnCollection || hasProcessedInstanceId) return;

    const instanceId = location.state?.instanceId;
    if (!instanceId || selectedPokemon) return;

    /* -------------------------------------------------------------- */
    /* 1) Try to find it in the already‑filtered list                 */
    /* -------------------------------------------------------------- */
    let combined: PokemonVariant | null =
      filteredVariants.find(
        (p) => getEntityKeyFrom(p) === instanceId || p.variant_id === instanceId,
      ) ?? null;

    /* -------------------------------------------------------------- */
    /* 2) Fallback: enrich base variant with raw instance data        */
    /* -------------------------------------------------------------- */
    if (!combined) {
      const raw = searchInstances[instanceId];
      if (raw) {
        const variant = filteredVariants.find(
          (p) => p.pokemon_id === raw.pokemon_id,
        );
        if (variant) {
          combined = {
            ...variant,
            variant_id: variant.variant_id,
            instanceData: raw,
          };
        }
      }
    }

    /* -------------------------------------------------------------- */
    /* 3) Open overlay if we found something                          */
    /* -------------------------------------------------------------- */
    if (combined) {
      setSelectedPokemon({ pokemon: combined, overlayType: 'instance' });
      setHasProcessedInstanceId(true);

      // Clean the param to avoid reopening on navigation/back‑button
      setTimeout(() => {
        void navigate(location.pathname, {
          replace: true,
          state: { ...location.state, instanceId: null },
        });
      }, 100);
    } else {
      // Still missing — try again shortly (rare race condition)
      setTimeout(() => setRetryCounter(c => c + 1), 500);
    }
  }, [
    variantsLoading,
    foreignInstancesLoading,
    searchInstances,
    filteredVariants,
    location,
    selectedPokemon,
    isOwnCollection,
    hasProcessedInstanceId,
    navigate,
    setSelectedPokemon,
    setHasProcessedInstanceId,
    retryCounter,
  ]);
}
