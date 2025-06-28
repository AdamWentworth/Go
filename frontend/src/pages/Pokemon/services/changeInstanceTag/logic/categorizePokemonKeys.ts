// categorizePokemonKeys.ts

import { ParsedPokemonKey } from '@/types/keys';
import { parsePokemonKey } from '@/utils/PokemonIDUtils';

export interface CategorizedPokemonKeys {
  regular: { key: string; parsed: ParsedPokemonKey }[];
  mega: { key: string; baseKey: string; megaForm?: string }[];
  fusion: { key: string; baseKey: string }[];
}

export function categorizePokemonKeys(
  keys: Set<string>
): CategorizedPokemonKeys {
  const regular: CategorizedPokemonKeys['regular'] = [];
  const mega: CategorizedPokemonKeys['mega'] = [];
  const fusion: CategorizedPokemonKeys['fusion'] = [];

  for (const key of keys) {
    const parsed = parsePokemonKey(key);
    if (!parsed) {
      console.warn(`Invalid pokemonKey format: ${key}`);
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
