import {
  getAccountFieldStates,
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

  it('returns field-level account states', () => {
    const states = getAccountFieldStates({
      pokemonGoName: '',
      allowLocationInput: 'maybe',
    });
    expect(states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'pokemon_go_name', valid: false }),
        expect.objectContaining({ key: 'allow_location', valid: false }),
      ]),
    );
  });
});
