export type RegisterFormInput = {
  username: string;
  email: string;
  password: string;
  pokemonGoName: string;
  trainerCode: string;
};

export type RegisterFieldState = {
  key: 'username' | 'email' | 'password' | 'pokemon_go_name' | 'trainer_code';
  label: string;
  valid: boolean;
};

export const normalizeTrainerCode = (value: string): string => value.replace(/\D+/g, '');

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const getRegisterFieldStates = (input: RegisterFormInput): RegisterFieldState[] => {
  const trainerCodeDigits = normalizeTrainerCode(input.trainerCode).length;
  return [
    {
      key: 'username',
      label: `Username (3+ chars): ${input.username.trim().length}/3`,
      valid: input.username.trim().length >= 3,
    },
    {
      key: 'email',
      label: 'Email format: name@example.com',
      valid: isValidEmail(input.email.trim()),
    },
    {
      key: 'password',
      label: `Password length (6+): ${input.password.trim().length}/6`,
      valid: input.password.trim().length >= 6,
    },
    {
      key: 'pokemon_go_name',
      label: 'Pokemon GO name is required',
      valid: input.pokemonGoName.trim().length > 0,
    },
    {
      key: 'trainer_code',
      label: `Trainer code digits: ${trainerCodeDigits}/12`,
      valid: trainerCodeDigits === 12,
    },
  ];
};

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
