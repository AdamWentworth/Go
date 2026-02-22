import { runtimeConfig } from '../../config/runtimeConfig';

const DEFAULT_WEB_ASSET_ORIGIN = 'https://pokemongonexus.com';

const toOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const assetOrigin = toOrigin(runtimeConfig.api.pokemonApiUrl) ?? DEFAULT_WEB_ASSET_ORIGIN;

export const resolvePokemonImageUrl = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('data:')
  ) {
    return normalized;
  }
  if (normalized.startsWith('//')) return `https:${normalized}`;
  if (normalized.startsWith('/')) return `${assetOrigin}${normalized}`;

  const normalizedPath = normalized.replace(/^\.?\//, '');
  return `${assetOrigin}/${normalizedPath}`;
};

