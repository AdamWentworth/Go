export const parseAllowLocationInput = (
  value: string,
): { value: boolean | null; error: string | null } => {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return { value: true, error: null };
  if (normalized === 'false') return { value: false, error: null };
  return { value: null, error: 'Allow location must be either true or false.' };
};

export const validateAccountForm = (input: {
  pokemonGoName: string;
  allowLocationInput: string;
}): string | null => {
  if (input.pokemonGoName.trim().length === 0) return 'Pokemon GO name is required.';
  return parseAllowLocationInput(input.allowLocationInput).error;
};
