import type { OverlayPokemon, OverlayType } from './overlayTypes';

const toCanonicalKey = (value: unknown): string =>
  (value ?? '').toString().trim().toLowerCase();

export const deriveInitialOverlay = (
  tagFilter: unknown,
  pokemon: OverlayPokemon | null,
): OverlayType => {
  const fromTag = toCanonicalKey(tagFilter);
  if (['caught', 'missing', 'trade', 'wanted'].includes(fromTag)) {
    return fromTag as OverlayType;
  }

  const status = toCanonicalKey(pokemon?.instanceData?.status || pokemon?.status);
  if (['caught', 'missing', 'trade', 'wanted'].includes(status)) {
    return status as OverlayType;
  }

  return 'caught';
};
