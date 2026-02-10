import { parseVariantId } from '@/utils/PokemonIDUtils';
import type { PokemonVariant } from '@/types/pokemonVariants';

type MaybeInstance = {
  variant_id?: string | null;
  pokemon_id?: number | null;
  shiny?: boolean | null;
  shadow?: boolean | null;
  dynamax?: boolean | null;
  gigantamax?: boolean | null;
  is_mega?: boolean | null;
  is_fused?: boolean | null;
  costume_id?: number | null;
};

function hasToken(v: PokemonVariant, token: string): boolean {
  const vt = String((v as any).variantType ?? '').toLowerCase();
  const id = String((v as any).variant_id ?? (v as any).pokemonKey ?? '').toLowerCase();
  return vt.includes(token) || id.includes(token);
}

function scoreVariant(v: PokemonVariant, inst: MaybeInstance): number {
  let score = 0;

  const wantShiny = !!inst.shiny;
  const wantShadow = !!inst.shadow;
  const wantDynamax = !!inst.dynamax;
  const wantGigantamax = !!inst.gigantamax;
  const wantMega = !!inst.is_mega;
  const wantFused = !!inst.is_fused;
  const hasCostume = inst.costume_id !== null && inst.costume_id !== undefined;

  if (wantShiny === hasToken(v, 'shiny')) score += 3;
  if (wantShadow === hasToken(v, 'shadow')) score += 3;
  if (wantDynamax === hasToken(v, 'dynamax')) score += 4;
  if (wantGigantamax === hasToken(v, 'gigantamax')) score += 4;
  if (wantMega === hasToken(v, 'mega')) score += 2;
  if (wantFused === hasToken(v, 'fusion')) score += 2;

  if (hasCostume) {
    const costumes = Array.isArray((v as any).costumes) ? (v as any).costumes : [];
    if (costumes.some((c: any) => Number(c?.costume_id) === Number(inst.costume_id))) {
      score += 5;
    }
  } else if ((v as any).variantType === 'default') {
    score += 1;
  }

  return score;
}

export function findVariantForInstance(
  variants: PokemonVariant[],
  keyOrInstanceId?: string | null,
  inst?: MaybeInstance | null,
): PokemonVariant | null {
  if (!Array.isArray(variants) || variants.length === 0) return null;

  const variantByKey = new Map<string, PokemonVariant>();
  const variantsByPokemonId = new Map<number, PokemonVariant[]>();

  for (const variant of variants) {
    const variantId = String((variant as any).variant_id ?? '');
    if (variantId) variantByKey.set(variantId, variant);

    // Legacy lookup during pokemonKey -> variant_id migration.
    const legacyKey = String((variant as any).pokemonKey ?? '');
    if (legacyKey && !variantByKey.has(legacyKey)) {
      variantByKey.set(legacyKey, variant);
    }

    const pokemonId = Number((variant as any).pokemon_id);
    if (Number.isFinite(pokemonId)) {
      const arr = variantsByPokemonId.get(pokemonId);
      if (arr) arr.push(variant);
      else variantsByPokemonId.set(pokemonId, [variant]);
    }
  }

  // Source of truth for display image mapping is instance.variant_id when present.
  if (inst?.variant_id) {
    const byVariantID = variantByKey.get(inst.variant_id);
    if (byVariantID) return byVariantID;
  }

  const keyCandidates = new Set<string>();

  if (typeof keyOrInstanceId === 'string' && keyOrInstanceId) {
    keyCandidates.add(keyOrInstanceId);
    const parsed = parseVariantId(keyOrInstanceId);
    if (parsed.baseKey) keyCandidates.add(parsed.baseKey);
  }

  for (const key of keyCandidates) {
    const hit = variantByKey.get(key);
    if (hit) return hit;
  }

  const pokemonID = Number(inst?.pokemon_id);
  if (!Number.isFinite(pokemonID)) return null;

  const candidates = variantsByPokemonId.get(pokemonID) ?? [];
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const sorted = [...candidates].sort((a, b) => scoreVariant(b, inst ?? {}) - scoreVariant(a, inst ?? {}));
  return sorted[0] ?? null;
}
