import type { PokemonVariant } from '@/types/pokemonVariants';

export type SpecialMaxAttacker = {
  displayName: string;
  form: string | null;
  moveName: string;
  moveType: string;
  movePower: number;
};

const SPECIAL_MAX_ATTACKERS: Readonly<Record<number, SpecialMaxAttacker>> = {
  888: {
    displayName: 'Crowned Sword Zacian',
    form: 'crowned_sword',
    moveName: 'Behemoth Blade',
    moveType: 'steel',
    movePower: 350,
  },
  889: {
    displayName: 'Crowned Shield Zamazenta',
    form: 'crowned_shield',
    moveName: 'Behemoth Bash',
    moveType: 'steel',
    movePower: 350,
  },
  890: {
    displayName: 'Eternatus',
    form: null,
    moveName: 'Dynamax Cannon',
    moveType: 'dragon',
    movePower: 450,
  },
};

const LEGACY_CROWNED_IDS: Readonly<Record<number, number>> = {
  2290: 888,
  2292: 889,
};

const normalizeForm = (value?: string | null): string =>
  value?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? '';

export const getSpecialMaxAttacker = (
  variant: PokemonVariant,
): SpecialMaxAttacker | null => {
  const variantType = variant.variantType.toLowerCase();
  if (variantType !== 'default' && variantType !== 'shiny') return null;

  const catalogId =
    LEGACY_CROWNED_IDS[variant.pokemon_id] ?? variant.pokemon_id;
  const special = SPECIAL_MAX_ATTACKERS[catalogId];
  if (!special) return null;

  return special.form === null || normalizeForm(variant.form) === special.form
    ? special
    : null;
};

export const isSpecialMaxAttacker = (variant: PokemonVariant): boolean =>
  getSpecialMaxAttacker(variant) !== null;
