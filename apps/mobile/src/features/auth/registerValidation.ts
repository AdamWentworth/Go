export type RegisterFormInput = {
  username: string;
  email: string;
  password: string;
  pokemonGoName: string;
  trainerCode: string;
};

export const normalizeTrainerCode = (value: string): string => value.replace(/\D+/g, '');

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateRegisterForm = (input: RegisterFormInput): string | null => {
  if (input.username.trim().length < 3) return 'Username must be at least 3 characters.';
  if (!isValidEmail(input.email.trim())) return 'Please enter a valid email address.';
  if (input.password.trim().length < 6) return 'Password must be at least 6 characters.';
  if (input.pokemonGoName.trim().length === 0) return 'Pokemon GO name is required.';
  if (normalizeTrainerCode(input.trainerCode).length !== 12) {
    return 'Trainer code must contain 12 digits.';
  }
  return null;
};
