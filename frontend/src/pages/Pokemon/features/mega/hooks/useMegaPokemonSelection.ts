// useMegaPokemonSelection.ts

import { useState, useCallback } from 'react';
import { megaEvolveExisting, createNewMega } from '../services/megaPokemonService';

export function useMegaPokemonSelection(
  variantKey: string | undefined,
  megaForm  : string | undefined,
  onAssignExisting: (id: string) => void,
  onCreateNew    : () => void,
) {
  const [error, setError] = useState<string | null>(null);

  const assignExisting = useCallback(
    async (instanceId: string) => {
      try {
        await megaEvolveExisting(instanceId, megaForm);
        onAssignExisting(instanceId);
      } catch (e) {
        console.error(e);
        setError(`Failed to mega-evolve ${instanceId}.`);
      }
    },
    [megaForm, onAssignExisting],
  );

  const createNew = useCallback(async () => {
    try {
        if (!variantKey) throw new Error('No variantKey');
        //  !  tells TS we have already narrowed the value.
        await createNewMega(variantKey!, megaForm);
      onCreateNew();
    } catch (e) {
      console.error(e);
      setError('Failed to create a new Mega Pokémon.');
    }
  }, [variantKey, megaForm, onCreateNew]);

  return { error, assignExisting, createNew };
}
