// formMatcher.ts

type RaidVariantMatchOptions = {
  raidBossName?: string | null;
  raidBossTier?: string | null;
  raidBossCostumeId?: number | null;
  variantName?: string | null;
};

const normalizeForm = (form: string | null | undefined): string | null => {
  if (!form || form.toLowerCase() === 'default' || form.toLowerCase() === 'normal') {
    return null;
  }
  if (form.toLowerCase() === 'alola') {
    return 'alolan';
  }
  if (form.toLowerCase() === 'galar') {
    return 'galarian';
  }
  return form.toLowerCase();
};

const normalizeName = (value: string | null | undefined): string =>
  value?.trim().toLowerCase() ?? '';

const getVariantCostumeId = (variantType: string): number | null => {
  const match = variantType.toLowerCase().match(/(?:^|_)costume_(\d+)/);
  if (!match) return null;
  const costumeId = Number(match[1]);
  return Number.isFinite(costumeId) ? costumeId : null;
};

/**
 * Matches raid metadata to the Pokémon variant that should retain it.
 */
export const matchFormsAndVariantType = (
  pokemonForm: string | null | undefined,
  raidBossForm: string | null | undefined,
  variantType: string,
  options: RaidVariantMatchOptions = {},
): boolean => {
  const normalizedForm = normalizeForm(pokemonForm);
  const normalizedRaidBossForm = normalizeForm(raidBossForm);
  const formsMatch = normalizedForm === normalizedRaidBossForm;
  const normalizedVariantType = variantType.toLowerCase();
  const raidBossTier = normalizeName(options.raidBossTier);
  const raidBossCostumeId = options.raidBossCostumeId ?? null;
  const variantCostumeId = getVariantCostumeId(normalizedVariantType);

  if (normalizedVariantType.includes('shiny')) {
    return false;
  }

  if (raidBossCostumeId !== null) {
    if (raidBossTier.startsWith('shadow_')) {
      return (
        normalizedVariantType === `shadow_costume_${raidBossCostumeId}` &&
        formsMatch
      );
    }
    return normalizedVariantType === `costume_${raidBossCostumeId}` && formsMatch;
  }

  if (variantCostumeId !== null) {
    return false;
  }

  if (raidBossTier.startsWith('shadow_')) {
    return normalizedVariantType === 'shadow' && formsMatch;
  }

  if (raidBossTier.startsWith('fusion_')) {
    const raidBossName = normalizeName(options.raidBossName);
    const variantName = normalizeName(options.variantName);
    return normalizedVariantType.startsWith('fusion_') && raidBossName === variantName;
  }

  if (raidBossTier === 'mega' || raidBossTier === 'mega_legendary' || raidBossTier === 'super_mega') {
    return (
      (normalizedVariantType.startsWith('mega') || normalizedVariantType === 'primal') &&
      formsMatch
    );
  }

  return formsMatch && normalizedVariantType === 'default';
};
