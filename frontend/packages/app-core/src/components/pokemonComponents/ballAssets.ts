import { resolveAssetUrl } from '@/utils/assetUrl';

export const BALL_OPTIONS = [
  { value: 'poke_ball', label: 'POKE BALL' },
  { value: 'great_ball', label: 'GREAT BALL' },
  { value: 'ultra_ball', label: 'ULTRA BALL' },
  { value: 'premier_ball', label: 'PREMIER BALL' },
  { value: 'master_ball', label: 'MASTER BALL' },
  { value: 'safari_ball', label: 'SAFARI BALL' },
  { value: 'beast_ball', label: 'BEAST BALL' },
] as const;

export type BallValue = (typeof BALL_OPTIONS)[number]['value'];

const BALL_FILE_BY_VALUE: Record<BallValue, string> = {
  poke_ball: 'pokeball.png',
  great_ball: 'greatball.png',
  ultra_ball: 'ultraball.png',
  premier_ball: 'premierball.png',
  master_ball: 'masterball.png',
  safari_ball: 'safariball.png',
  beast_ball: 'beastball.png',
};

const toBallFileName = (value: string): string => {
  const known = BALL_FILE_BY_VALUE[value as BallValue];
  if (known) return known;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/_ball$/, '')
    .replace(/[^a-z0-9]/g, '');
  return `${normalized || 'poke'}ball.png`;
};

export const getBallLabel = (value: string | null): string => {
  if (!value) return 'UNKNOWN';
  const found = BALL_OPTIONS.find((option) => option.value === value);
  if (found) return found.label;
  return value.replace(/_/g, ' ').toUpperCase();
};

export const getBallImageUrl = (value: string | null): string => {
  const fileName = toBallFileName(value ?? 'poke_ball');
  return resolveAssetUrl(`/images/balls/${fileName}`);
};
