// src/utils/PokemonIDUtils.ts

import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import type { PokemonVariant } from '../types/pokemonVariants';
import type { ParsedKeyParts } from '../types/keys';

export function generateUUID(): string {
  return uuidv4();
}

export function validateUUID(uuid: string): boolean {
  return uuidValidate(uuid);
}

export function getKeyParts(key: string): ParsedKeyParts {
  const [idPart, variantPart] = key.split('-');
  const pokemonId = parseInt(idPart, 10);

  const parts: ParsedKeyParts = {
    pokemonId,
    costumeName: null,
    isShiny: key.includes('_shiny') || key.includes('-shiny'),
    isDefault: key.includes('_default') || key.includes('-default'),
    isShadow: key.includes('_shadow') || key.includes('-shadow')
  };

  if (variantPart) {
    let name = variantPart;
    if (parts.isShiny) name = name.split('_shiny')[0];
    else if (parts.isDefault) name = name.split('_default')[0];
    else if (parts.isShadow) name = name.split('_shadow')[0];
    parts.costumeName = name;
  }

  return parts;
}

export function parsePokemonKey(pokemonKey: string): {
  baseKey: string;
  hasUUID: boolean;
} {
  const keyParts = pokemonKey.split('_');
  const lastPart = keyParts[keyParts.length - 1];
  const hasUUID = validateUUID(lastPart);

  if (hasUUID) keyParts.pop();

  return {
    baseKey: keyParts.join('_'),
    hasUUID
  };
}

export function determinePokemonKey(pokemon: PokemonVariant): string {
  const paddedId = pokemon.pokemon_id.toString().padStart(4, '0');
  const vt = pokemon.variantType;

  // Quick match for costume-related images
  if (pokemon.costumes) {
    for (const costume of pokemon.costumes) {
      const { name, image_url, image_url_shiny, shadow_costume } = costume;

      if (pokemon.currentImage === image_url) {
        return `${paddedId}-${name}_default`;
      }

      if (pokemon.currentImage === image_url_shiny) {
        return `${paddedId}-${name}_shiny`;
      }

      if (shadow_costume) {
        if (pokemon.currentImage === shadow_costume.image_url_shadow_costume) {
          return `${paddedId}-shadow_${name}_default`;
        }

        if (pokemon.currentImage === shadow_costume.image_url_shiny_shadow_costume) {
          return `${paddedId}-shadow_${name}_shiny`;
        }
      }
    }
  }

  // Check variantType suffix matches
  const explicitSuffixTypes = new Set([
    'gigantamax', 'shiny_gigantamax',
    'dynamax', 'shiny_dynamax',
    'primal', 'shiny_primal'
  ]);

  if (vt) {
    if (
      vt.startsWith('mega') ||
      vt.startsWith('shiny_mega') ||
      vt.startsWith('fusion_') ||
      vt.startsWith('shiny_fusion_') ||
      explicitSuffixTypes.has(vt)
    ) {
      return `${paddedId}-${vt}`;
    }
  }

  // Check standard image match fallback
  if (pokemon.currentImage === pokemon.image_url) {
    return `${paddedId}-default`;
  } else if (pokemon.currentImage === pokemon.image_url_shadow) {
    return `${paddedId}-shadow`;
  } else if (pokemon.currentImage === pokemon.image_url_shiny) {
    return `${paddedId}-shiny`;
  } else if (pokemon.currentImage === pokemon.image_url_shiny_shadow) {
    return `${paddedId}-shiny_shadow`;
  }

  // Final fallback: just use the ID if no image match
  return paddedId;
}
