import type { PokemonInstance } from '@/types/pokemonInstance';

export type InstanceFormMoves = {
  fastMove: number | null;
  chargedMove1: number | null;
  chargedMove2: number | null;
};

export type InstanceFormIvValue = number | '' | null;

export type InstanceFormIvs = {
  Attack: number | '';
  Defense: number | '';
  Stamina: number | '';
};

export type InstanceFormIvsInput = {
  Attack: InstanceFormIvValue;
  Defense: InstanceFormIvValue;
  Stamina: InstanceFormIvValue;
};

export const getInitialGenderState = (
  instanceData: Partial<PokemonInstance>,
): { gender: string | null; isFemale: boolean } => {
  const gender = instanceData.gender ?? null;
  return {
    gender,
    isFemale: gender === 'Female',
  };
};

export const getInitialCpText = (
  instanceData: Partial<PokemonInstance>,
): string => (instanceData.cp != null ? String(instanceData.cp) : '');

export const getInitialLevel = (
  instanceData: Partial<PokemonInstance>,
): number | null =>
  instanceData.level != null ? Number(instanceData.level) : null;

export const getInitialCaughtNumericValue = (value: unknown): number =>
  Number(value ?? 0);

export const getInitialOptionalNumericValue = (value: unknown): number | '' => {
  const parsed = Number(value);
  return parsed || '';
};

export const getInitialMoves = (
  instanceData: Partial<PokemonInstance>,
): InstanceFormMoves => ({
  fastMove: instanceData.fast_move_id ?? null,
  chargedMove1: instanceData.charged_move1_id ?? null,
  chargedMove2: instanceData.charged_move2_id ?? null,
});

const normalizeIvValue = (value: unknown): number | '' =>
  value != null ? Number(value) : '';

export const getInitialIvs = (
  instanceData: Partial<PokemonInstance>,
): InstanceFormIvs => ({
  Attack: normalizeIvValue(instanceData.attack_iv),
  Defense: normalizeIvValue(instanceData.defense_iv),
  Stamina: normalizeIvValue(instanceData.stamina_iv),
});

export const normalizeIvsForState = (
  ivs: InstanceFormIvsInput,
): InstanceFormIvs => ({
  Attack: ivs.Attack ?? '',
  Defense: ivs.Defense ?? '',
  Stamina: ivs.Stamina ?? '',
});

export const areInstanceIvsEmpty = (
  ivs: Partial<Record<keyof InstanceFormIvs, InstanceFormIvValue | undefined>>,
): boolean =>
  (ivs.Attack === '' || ivs.Attack === null || ivs.Attack === undefined) &&
  (ivs.Defense === '' || ivs.Defense === null || ivs.Defense === undefined) &&
  (ivs.Stamina === '' || ivs.Stamina === null || ivs.Stamina === undefined);

export const getInitialMaxMoveValue = (value: unknown): string =>
  String(value ?? '');

export const parseEditableLevel = (value: string): number | null =>
  value !== '' ? Number(value) : null;
