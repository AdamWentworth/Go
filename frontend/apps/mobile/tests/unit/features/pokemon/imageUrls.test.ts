import { resolvePokemonImageUrl } from '../../../../src/features/pokemon/imageUrls';

describe('resolvePokemonImageUrl', () => {
  it('converts root-relative web paths to absolute URLs', () => {
    expect(resolvePokemonImageUrl('/images/pokemon/1.png')).toBe(
      'https://pokemongonexus.com/images/pokemon/1.png',
    );
  });

  it('keeps absolute http/https URLs unchanged', () => {
    expect(resolvePokemonImageUrl('https://cdn.example.com/pokemon/1.png')).toBe(
      'https://cdn.example.com/pokemon/1.png',
    );
    expect(resolvePokemonImageUrl('http://cdn.example.com/pokemon/1.png')).toBe(
      'http://cdn.example.com/pokemon/1.png',
    );
  });

  it('handles protocol-relative URLs', () => {
    expect(resolvePokemonImageUrl('//cdn.example.com/pokemon/1.png')).toBe(
      'https://cdn.example.com/pokemon/1.png',
    );
  });

  it('returns null for empty values', () => {
    expect(resolvePokemonImageUrl('')).toBeNull();
    expect(resolvePokemonImageUrl('   ')).toBeNull();
    expect(resolvePokemonImageUrl(null)).toBeNull();
    expect(resolvePokemonImageUrl(undefined)).toBeNull();
  });
});

