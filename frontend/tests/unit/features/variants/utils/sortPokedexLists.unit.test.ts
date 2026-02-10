import { describe, expect, it } from 'vitest';

import sortPokedexLists from '@/features/variants/utils/sortPokedexLists';
import type { PokemonVariant } from '@/types/pokemonVariants';
import variantsFixture from '@/../tests/__helpers__/fixtures/variants.json';

function expectedListFor(variantType: string): string {
  const vt = variantType.toLowerCase();
  if (vt === 'default') return 'default';
  if (vt === 'shiny') return 'shiny';
  if (vt.includes('fusion')) return vt.includes('shiny') ? 'shiny fusion' : 'fusion';
  if (vt.includes('gigantamax')) return vt.includes('shiny') ? 'shiny gigantamax' : 'gigantamax';
  if (vt.includes('dynamax')) return vt.includes('shiny') ? 'shiny dynamax' : 'dynamax';
  if (vt.includes('mega') || vt.includes('primal')) return vt.includes('shiny') ? 'shiny mega' : 'mega';
  if (vt.includes('shiny') && vt.includes('costume')) return 'shiny costume';
  if (vt.includes('shiny') && vt.includes('shadow')) return 'shiny shadow';
  if (vt.includes('shadow') && vt.includes('costume')) return 'shadow costume';
  if (vt.includes('costume')) return 'costume';
  if (vt.includes('shadow')) return 'shadow';
  return 'default';
}

describe('sortPokedexLists (unit)', () => {
  const variants = (variantsFixture as PokemonVariant[]).map((variant, idx) => ({
    ...variant,
    variant_id:
      (variant as any).variant_id ??
      (variant as any).pokemonKey ??
      `${String(variant.pokemon_id).padStart(4, '0')}-${variant.variantType}-${idx}`,
  }));

  it('preserves total count and does not drop variants', () => {
    const lists = sortPokedexLists(variants);
    const flattened = Object.values(lists).flat();

    expect(flattened.length).toBe(variants.length);
    expect(new Set(flattened.map((v) => v.variant_id)).size).toBe(variants.length);
  });

  it('routes each variant to expected list bucket by variantType', () => {
    const lists = sortPokedexLists(variants);
    const byId = new Map<string, string>();
    for (const [key, arr] of Object.entries(lists)) {
      for (const v of arr) byId.set(v.variant_id, key);
    }

    for (const v of variants) {
      expect(byId.get(v.variant_id)).toBe(expectedListFor(v.variantType));
    }
  });

  it('returns empty arrays for all categories on empty input', () => {
    const lists = sortPokedexLists([]);
    for (const arr of Object.values(lists)) {
      expect(arr).toEqual([]);
    }
  });

  it('returns memoized result for the same array reference', () => {
    const first = sortPokedexLists(variants);
    const second = sortPokedexLists(variants);

    expect(second).toBe(first);
  });
});
