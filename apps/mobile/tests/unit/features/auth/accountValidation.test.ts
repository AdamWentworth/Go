import {
  parseAllowLocationInput,
  validateAccountForm,
} from '../../../../src/features/auth/accountValidation';

describe('accountValidation', () => {
  it('parses allowLocation true/false values', () => {
    expect(parseAllowLocationInput('true')).toEqual({ value: true, error: null });
    expect(parseAllowLocationInput(' FALSE ')).toEqual({ value: false, error: null });
  });

  it('rejects invalid allowLocation values', () => {
    expect(parseAllowLocationInput('maybe')).toEqual({
      value: null,
      error: 'Allow location must be either true or false.',
    });
  });

  it('validates pokemon go name and allowLocation input', () => {
    expect(
      validateAccountForm({
        pokemonGoName: '',
        allowLocationInput: 'true',
      }),
    ).toBe('Pokemon GO name is required.');

    expect(
      validateAccountForm({
        pokemonGoName: 'Ash',
        allowLocationInput: 'maybe',
      }),
    ).toBe('Allow location must be either true or false.');

    expect(
      validateAccountForm({
        pokemonGoName: 'Ash',
        allowLocationInput: 'false',
      }),
    ).toBeNull();
  });
});
