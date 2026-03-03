// formMatcher.ts

/**
 * Matches forms and variantType for a Pokémon variant
 *
 * @param pokemonForm - the Pokémon's form
 * @param raidBossForm - the raid boss form
 * @param variantType - the variant type string
 * @returns true if the forms match and it's a default variant
 */
export const matchFormsAndVariantType = (
  pokemonForm: string | null | undefined,
  raidBossForm: string | null | undefined,
  variantType: string
): boolean => {
  const normalizeForm = (form: string | null | undefined): string | null => {
    if (!form || form.toLowerCase() === 'default' || form.toLowerCase() === 'normal') {
      return null;
    }
    if (form.toLowerCase() === 'alola') {
      return 'Alolan';
    }
    return form;
  };

  const normalizedForm = normalizeForm(pokemonForm);
  const normalizedRaidBossForm = normalizeForm(raidBossForm);

  return normalizedForm === normalizedRaidBossForm && variantType === 'default';
};
