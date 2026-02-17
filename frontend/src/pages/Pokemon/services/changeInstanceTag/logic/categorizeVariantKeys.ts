// categorizeVariantKeys.ts

import { ParsedVariantKey } from '@/types/keys';
import { parseVariantId } from '@/utils/PokemonIDUtils';

export interface CategorizedVariantKeys {
  regular: { key: string; parsed: ParsedVariantKey }[];
  mega: { key: string; baseKey: string; megaForm?: string }[];
  fusion: { key: string; baseKey: string }[];
}

export function categorizeVariantKeys(
  keys: Set<string>
): CategorizedVariantKeys {
  const regular: CategorizedVariantKeys['regular'] = [];
  const mega: CategorizedVariantKeys['mega'] = [];
  const fusion: CategorizedVariantKeys['fusion'] = [];

  for (const key of keys) {
    const parsed = parseVariantId(key);
    if (!parsed) {
      console.warn(`Invalid variant key format: ${key}`);
      continue;
    }

    const { baseKey } = parsed;

    if (
      baseKey.includes('_mega') ||
      baseKey.includes('-mega') ||
      baseKey.includes('_primal') ||
      baseKey.includes('-primal')
    ) {
      let megaForm;
      if (baseKey.includes('mega_x')) megaForm = 'X';
      else if (baseKey.includes('mega_y')) megaForm = 'Y';
      mega.push({ key, baseKey, megaForm });
    } else if (baseKey.includes('fusion')) {
      fusion.push({ key, baseKey });
    } else {
      regular.push({ key, parsed });
    }
  }

  return { regular, mega, fusion };
}
