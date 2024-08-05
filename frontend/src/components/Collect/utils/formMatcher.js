// formMatcher.js

export const matchFormsAndVariantType = (variant, pokemonForm, raidBossForm, variantType, pokemon_id) => {
  
  
    const normalizeForm = (form) => {
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
  
  
    const matchResult = (normalizedForm === normalizedRaidBossForm) && (variantType === 'default');
  
    return matchResult;
  };
  