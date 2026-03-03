export const parseAllowLocationInput = (
  value: string,
): { value: boolean | null; error: string | null } => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return { value: true, error: null };
  if (normalized === 'false') return { value: false, error: null };
  return { value: null, error: 'Allow location must be either true or false.' };
};

export type AccountFieldState = {
  key: 'pokemon_go_name' | 'allow_location';
  label: string;
  valid: boolean;
};

export const getAccountFieldStates = (input: {
  pokemonGoName: string;
  allowLocationInput: string;
}): AccountFieldState[] => {
  const parsed = parseAllowLocationInput(input.allowLocationInput);
  return [
    {
      key: 'pokemon_go_name',
      label: 'Pokemon GO name is required',
      valid: input.pokemonGoName.trim().length > 0,
    },
    {
      key: 'allow_location',
      label: 'Allow location must be true or false',
      valid: parsed.value !== null,
    },
  ];
};

export const validateAccountForm = (input: {
  pokemonGoName: string;
  allowLocationInput: string;
}): string | null => {
  if (input.pokemonGoName.trim().length === 0) return 'Pokemon GO name is required.';
  return parseAllowLocationInput(input.allowLocationInput).error;
};
