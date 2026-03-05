import type { CrownForm } from '@/types/pokemonSubTypes';

const normalizeToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

export const getCrownFormLabel = (form?: CrownForm | null): string | null => {
  if (!form) return null;
  const display = typeof form.display_form === 'string' ? form.display_form.trim() : '';
  if (display.length > 0) return display;
  const fallback = typeof form.form === 'string' ? form.form.trim() : '';
  return fallback.length > 0 ? fallback : null;
};

export const resolveActiveCrownForm = (
  crownForms: CrownForm[] | null | undefined,
  crownFormLabel: string | null | undefined,
): CrownForm | undefined => {
  if (!Array.isArray(crownForms) || crownForms.length === 0) return undefined;
  const normalizedLabel = normalizeToken(crownFormLabel);
  if (normalizedLabel.length === 0) return crownForms[0];

  const byLabel = crownForms.find((entry) => {
    const label = getCrownFormLabel(entry);
    return normalizeToken(label) === normalizedLabel;
  });
  if (byLabel) return byLabel;

  return crownForms[0];
};
