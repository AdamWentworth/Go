import { describe, expect, it, vi } from 'vitest';

import { normalizeAssetUrlsDeep, resolveAssetUrl } from '@/utils/assetUrl';

describe('assetUrl', () => {
  it('returns relative paths unchanged when VITE_ASSET_ORIGIN is not set', () => {
    vi.unstubAllEnvs();
    expect(resolveAssetUrl('/images/default/pokemon_1.png')).toBe('/images/default/pokemon_1.png');
  });

  it('resolves relative paths against VITE_ASSET_ORIGIN', () => {
    vi.stubEnv('VITE_ASSET_ORIGIN', 'https://pokemongonexus.com');
    expect(resolveAssetUrl('/images/default/pokemon_1.png')).toBe(
      'https://pokemongonexus.com/images/default/pokemon_1.png',
    );
    expect(resolveAssetUrl('images/default/pokemon_1.png')).toBe(
      'https://pokemongonexus.com/images/default/pokemon_1.png',
    );
    vi.unstubAllEnvs();
  });

  it('normalizes nested image/icon fields while leaving unrelated fields unchanged', () => {
    vi.stubEnv('VITE_ASSET_ORIGIN', 'https://pokemongonexus.com');
    const payload = {
      name: 'Bulbasaur',
      image_url: '/images/default/pokemon_1.png',
      type_1_icon: '/images/types/grass.png',
      nested: {
        sprite_url: '/images/sprites/pokemon_1.png',
        ignored: '/not-an-asset-field.png',
      },
    };

    const normalized = normalizeAssetUrlsDeep(payload);

    expect(normalized.image_url).toBe('https://pokemongonexus.com/images/default/pokemon_1.png');
    expect(normalized.type_1_icon).toBe('https://pokemongonexus.com/images/types/grass.png');
    expect(normalized.nested.sprite_url).toBe('https://pokemongonexus.com/images/sprites/pokemon_1.png');
    expect(normalized.nested.ignored).toBe('/not-an-asset-field.png');
    vi.unstubAllEnvs();
  });
});

