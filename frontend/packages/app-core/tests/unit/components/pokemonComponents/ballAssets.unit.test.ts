import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBallImageClassName, getBallImageUrl } from '@/components/pokemonComponents/ballAssets';

describe('ballAssets', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves known and legacy ultra-ball values to the same media asset', () => {
    vi.stubEnv('VITE_ASSET_ORIGIN', 'https://pokemongonexus.com');

    expect(getBallImageUrl('ultra_ball')).toBe(
      'https://pokemongonexus.com/media/images/balls/ultraball.png',
    );
    expect(getBallImageUrl('ultraball')).toBe(
      'https://pokemongonexus.com/media/images/balls/ultraball.png',
    );
  });

  it('returns beast/safari css classes used for per-ball sizing overrides', () => {
    expect(getBallImageClassName('beast_ball')).toBe('meta-ball-beastball');
    expect(getBallImageClassName('safari_ball')).toBe('meta-ball-safariball');
  });
});
