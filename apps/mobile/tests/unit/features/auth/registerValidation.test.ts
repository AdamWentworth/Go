import {
  normalizeTrainerCode,
  validateRegisterForm,
} from '../../../../src/features/auth/registerValidation';

describe('registerValidation', () => {
  it('normalizes trainer code digits', () => {
    expect(normalizeTrainerCode('1234 5678-9012')).toBe('123456789012');
  });

  it('validates a correct register payload', () => {
    expect(
      validateRegisterForm({
        username: 'ash',
        email: 'ash@example.com',
        password: 'pikachu123',
        pokemonGoName: 'Ash K',
        trainerCode: '1234 5678 9012',
      }),
    ).toBeNull();
  });

  it('rejects invalid field combinations', () => {
    expect(
      validateRegisterForm({
        username: 'ab',
        email: 'ash@example.com',
        password: 'pikachu123',
        pokemonGoName: 'Ash K',
        trainerCode: '123456789012',
      }),
    ).toBe('Username must be at least 3 characters.');

    expect(
      validateRegisterForm({
        username: 'ash',
        email: 'bad-email',
        password: 'pikachu123',
        pokemonGoName: 'Ash K',
        trainerCode: '123456789012',
      }),
    ).toBe('Please enter a valid email address.');

    expect(
      validateRegisterForm({
        username: 'ash',
        email: 'ash@example.com',
        password: '12345',
        pokemonGoName: 'Ash K',
        trainerCode: '123456789012',
      }),
    ).toBe('Password must be at least 6 characters.');

    expect(
      validateRegisterForm({
        username: 'ash',
        email: 'ash@example.com',
        password: 'pikachu123',
        pokemonGoName: '',
        trainerCode: '123456789012',
      }),
    ).toBe('Pokemon GO name is required.');

    expect(
      validateRegisterForm({
        username: 'ash',
        email: 'ash@example.com',
        password: 'pikachu123',
        pokemonGoName: 'Ash K',
        trainerCode: '123',
      }),
    ).toBe('Trainer code must contain 12 digits.');
  });
});
