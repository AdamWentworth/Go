// validateMoveToFilter.ts

import { PokemonInstance } from '@/types/pokemonInstance';
import { InstanceStatus } from '@/types/instances';
import { getDisplayName } from './getDisplayName';
import { PokemonVariant } from '@/types/pokemonVariants';

type ValidationResult = {
  success: boolean;
  message?: string;
};

export function validateBlockedMoves({
  filter,
  fusionKeys,
  megaKeys,
  instances,
  displayFilterText,
  variants,
}: {
  filter: InstanceStatus;
  fusionKeys: { key: string; baseKey: string }[];
  megaKeys: { key: string; baseKey: string; megaForm?: string }[];
  instances: Record<string, PokemonInstance>;
  displayFilterText: string;
  variants: PokemonVariant[];
}): ValidationResult {
  const isTradeOrWanted = filter === 'Trade' || filter === 'Wanted';

  if (isTradeOrWanted && megaKeys.length > 0) {
    const msg = megaKeys
      .map(({ key }) => {
        const instance = instances[key];
        return `• ${
          instance?.nickname ||
          getDisplayName(key, variants)
        } (Mega) cannot be moved to ${displayFilterText}.`;
      })
      .join('\n');

    return { success: false, message: msg };
  }

  if (isTradeOrWanted && fusionKeys.length > 0) {
    const msg = fusionKeys
      .map(({ key }) => {
        const instance = instances[key];
        return `• ${
          instance?.nickname ||
          getDisplayName(key, variants)
        } (Fusion) cannot be moved to ${displayFilterText}.`;
      })
      .join('\n');

    return { success: false, message: msg };
  }

  return { success: true };
}
