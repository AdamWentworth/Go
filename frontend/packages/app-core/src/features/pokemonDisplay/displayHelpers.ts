import type { Fusion, MegaEvolution } from '@/types/pokemonSubTypes';

export const normalizeFormToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const buildTypeIcon = (typeName?: string | null): string | undefined => {
  const normalized = typeof typeName === 'string' ? typeName.trim().toLowerCase() : '';
  return normalized ? `/images/types/${normalized}.png` : undefined;
};

export const normalizeTypeName = (value: string | null | undefined): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const parseFusionId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const resolvePokemonDisplayActiveMegaEvolution = ({
  isMega,
  megaForm,
  megaEvolutions,
}: {
  isMega: boolean;
  megaForm?: string | null;
  megaEvolutions?: MegaEvolution[] | null;
}): MegaEvolution | undefined => {
  if (!isMega || !Array.isArray(megaEvolutions) || megaEvolutions.length === 0) {
    return undefined;
  }

  const normalizedForm = normalizeFormToken(megaForm);
  if (normalizedForm.length === 0) {
    return (
      megaEvolutions.find((entry) => normalizeFormToken(entry.form) === '') ??
      megaEvolutions[0]
    );
  }

  return (
    megaEvolutions.find((entry) => normalizeFormToken(entry.form) === normalizedForm) ??
    megaEvolutions[0]
  );
};

export const resolvePokemonDisplayActiveFusionEntry = ({
  isFused,
  fusionForm,
  fusionEntries,
  storedFusion,
}: {
  isFused?: boolean;
  fusionForm?: string | null;
  fusionEntries?: Fusion[] | null;
  storedFusion?: Record<string, unknown> | null;
}): Fusion | undefined => {
  if (!isFused || !Array.isArray(fusionEntries) || fusionEntries.length === 0) {
    return undefined;
  }

  const normalizedFusionForm = normalizeFormToken(fusionForm);
  if (normalizedFusionForm.length > 0) {
    return (
      fusionEntries.find((entry) => normalizeFormToken(entry.name) === normalizedFusionForm) ??
      fusionEntries[0]
    );
  }

  const storedFusionId = parseFusionId(storedFusion?.fusion_id) ?? parseFusionId(storedFusion?.id);
  if (storedFusionId != null) {
    return fusionEntries.find((entry) => entry.fusion_id === storedFusionId) ?? fusionEntries[0];
  }

  return fusionEntries[0];
};
