import type { PokemonInstance } from '@/types/pokemonInstance';
import type { OverlayPokemon } from './overlayTypes';

export const withInstanceData = (
  value: OverlayPokemon,
): OverlayPokemon & { instanceData: Partial<PokemonInstance> } => ({
  ...value,
  instanceData: value.instanceData ?? {},
});

export const getOverlayIdentityKey = (
  value: OverlayPokemon | null | undefined,
): string | null => {
  if (!value) return null;

  const instanceId = value.instanceData?.instance_id;
  if (typeof instanceId === 'string' && instanceId.trim().length > 0) {
    return `instance:${instanceId}`;
  }

  const variantId = value.variant_id;
  if (typeof variantId === 'string' && variantId.trim().length > 0) {
    return `variant:${variantId}`;
  }

  const pokemonId = value.pokemon_id;
  if (typeof pokemonId === 'number' && Number.isFinite(pokemonId)) {
    return `pokemon:${pokemonId}:${String(value.variantType ?? '')}`;
  }

  return null;
};
