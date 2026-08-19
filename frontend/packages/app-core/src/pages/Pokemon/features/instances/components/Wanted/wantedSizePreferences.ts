import type { PokemonVariant } from '@/types/pokemonVariants';

export type WantedSizeMetric = 'weight' | 'height';
export type WantedSizePreference = 'XXS' | 'XS' | 'XL' | 'XXL' | null;

type SizeThresholds = PokemonVariant['sizes'];

const getThresholds = (sizes: SizeThresholds, metric: WantedSizeMetric) => ({
  xxs: sizes[`${metric}_xxs_threshold`],
  xs: sizes[`${metric}_xs_threshold`],
  xl: sizes[`${metric}_xl_threshold`],
  xxl: sizes[`${metric}_xxl_threshold`],
});

export const getWantedSizePreference = (
  value: number | null | undefined,
  sizes: SizeThresholds | null | undefined,
  metric: WantedSizeMetric,
): WantedSizePreference => {
  if (value == null || !Number.isFinite(value) || !sizes) return null;

  const { xxs, xs, xl, xxl } = getThresholds(sizes, metric);
  if (value < xxs) return 'XXS';
  if (value < xs) return 'XS';
  if (value > xxl) return 'XXL';
  if (value > xl) return 'XL';
  return null;
};

export const getWantedSizeValue = (
  preference: WantedSizePreference,
  sizes: SizeThresholds | null | undefined,
  metric: WantedSizeMetric,
): number | null => {
  if (preference == null || !sizes) return null;

  const { xxs, xs, xl, xxl } = getThresholds(sizes, metric);
  switch (preference) {
    case 'XXS':
      return Math.max(Number.EPSILON, xxs - Math.max((xs - xxs) / 2, xxs * 0.1));
    case 'XS':
      return (xxs + xs) / 2;
    case 'XL':
      return (xl + xxl) / 2;
    case 'XXL':
      return xxl + Math.max((xxl - xl) / 2, xxl * 0.1, 0.001);
  }
};
