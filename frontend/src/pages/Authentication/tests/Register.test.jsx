// Register.test.jsx

import React from 'react';
import { render as renderWithAuth, screen, waitFor } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import Register from '../Register';

describe('Register Form Validations', () => {

  const getFormInputs = () => ({
    usernameInput: screen.getByPlaceholderText(/username/i),
    emailInput: screen.getByPlaceholderText(/email/i),
    passwordInput: screen.getByPlaceholderText(/password/i),
    pokemonGoNameInput: screen.getByPlaceholderText(/pokémon go name/i),
    trainerCodeInput: screen.getByPlaceholderText(/trainer code/i),
    locationInput: screen.getByPlaceholderText(/city/i),
    pokemonGoNameCheckbox: screen.getByLabelText(/username matches my pokémon go account name/i),
    locationCheckbox: screen.getByLabelText(/enable collection of your device's gps location data/i)
  });

  beforeEach(() => {
    renderWithAuth(<Register />);
  });

  describe('Username Validations', () => {
    test('validates username with spaces', async () => {
      const { usernameInput } = getFormInputs();
      
      await userEvent.type(usernameInput, 'user name with spaces');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(usernameInput).toHaveValue('user name with spaces');

      const errorMessage = await screen.findByText(/username cannot contain spaces/i);
      expect(errorMessage).toBeInTheDocument();
    });
    
    test('validates username with special characters', async () => {
      const { usernameInput } = getFormInputs();
      
      await userEvent.type(usernameInput, 'user@#$%');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(usernameInput).toHaveValue('user@#$%');

      const errorMessage = await screen.findByText(/username can only contain letters, numbers, and underscores/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Email Validations', () => {
    test('validates email without domain', async () => {
      const { emailInput } = getFormInputs();
      
      // Type 'test@' into the email input
      await userEvent.type(emailInput, 'test@');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(emailInput).toHaveValue('test@');

      // Wait for the error message to appear
      const errorMessage = await screen.findByText(/email is not valid/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates email with invalid characters', async () => {
      const { emailInput } = getFormInputs();
      
      // Type 'test@domain#.com' into the email input
      await userEvent.type(emailInput, 'test@domain#.com');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(emailInput).toHaveValue('test@domain#.com');

      // Wait for the error message to appear
      const errorMessage = await screen.findByText(/email is not valid/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Password Validations', () => {
    test('validates password length requirement', async () => {
      const { passwordInput } = getFormInputs();
      
      await userEvent.type(passwordInput, 'Short1!');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(passwordInput).toHaveValue('Short1!');

      const errorMessage = await screen.findByText(/password must be at least 8 characters long/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates password uppercase requirement', async () => {
      const { passwordInput } = getFormInputs();
      
      await userEvent.type(passwordInput, 'lowercase1!');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(passwordInput).toHaveValue('lowercase1!');

      const errorMessage = await screen.findByText(/password must include at least one uppercase letter/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates password lowercase requirement', async () => {
      const { passwordInput } = getFormInputs();
      
      await userEvent.type(passwordInput, 'UPPERCASE1!');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(passwordInput).toHaveValue('UPPERCASE1!');

      const errorMessage = await screen.findByText(/password must include at least one lowercase letter/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates password number requirement', async () => {
      const { passwordInput } = getFormInputs();
      
      await userEvent.type(passwordInput, 'Password!!');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(passwordInput).toHaveValue('Password!!');

      const errorMessage = await screen.findByText(/password must include at least one number/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates password special character requirement', async () => {
      const { passwordInput } = getFormInputs();
      
      await userEvent.type(passwordInput, 'Password123');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(passwordInput).toHaveValue('Password123');

      const errorMessage = await screen.findByText(/password must include at least one special character/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('does not show error message for valid password', async () => {
      const { passwordInput } = getFormInputs();
      
      await userEvent.type(passwordInput, 'ValidPass1!');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(passwordInput).toHaveValue('ValidPass1!');

      // Wait to ensure no error message appears
      await waitFor(() => {
        expect(screen.queryByText(/password must/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Pokémon GO Name Validations', () => {
    test('does not show error when Pokémon GO Name is empty', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      // Ensure Pokémon GO Name is empty
      await userEvent.clear(pokemonGoNameInput);
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(pokemonGoNameInput).toHaveValue('');

      // Wait to ensure no error message appears
      await waitFor(() => {
        expect(screen.queryByText(/pokémon go name/i)).not.toBeInTheDocument();
      });
    });

    test('passes when Pokémon GO Name matches Username', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput, pokemonGoNameCheckbox } = getFormInputs();
      
      // Enter a valid username
      await userEvent.type(usernameInput, 'ValidUser123');
      // Fill other required fields
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      // Check the Pokémon GO Name Disabled checkbox
      await userEvent.click(pokemonGoNameCheckbox);
      
      // Pokémon GO Name should automatically match Username
      expect(pokemonGoNameInput).toHaveValue('ValidUser123');
      expect(pokemonGoNameInput).toBeDisabled();

      await userEvent.click(screen.getByTestId('register-button'));

      // Wait to ensure no error message appears
      await waitFor(() => {
        expect(screen.queryByText(/pokémon go name/i)).not.toBeInTheDocument();
      });
    });

    test('updates Pokémon GO name when username changes and checkbox is checked', async () => {
      const { usernameInput, pokemonGoNameInput, pokemonGoNameCheckbox } = getFormInputs();
      
      // Enter initial username
      await userEvent.type(usernameInput, 'InitialUser');
      
      // Check the synchronization checkbox
      await userEvent.click(pokemonGoNameCheckbox);
      
      // Verify synchronization
      expect(pokemonGoNameInput).toHaveValue('InitialUser');
      expect(pokemonGoNameInput).toBeDisabled();
      
      // Change the username
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'UpdatedUser');
      
      // Verify that Pokémon GO Name updates accordingly
      expect(pokemonGoNameInput).toHaveValue('UpdatedUser');
    });

    test('clears and enables Pokémon GO name input when checkbox is unchecked', async () => {
      const { usernameInput, pokemonGoNameInput, pokemonGoNameCheckbox } = getFormInputs();
      
      // Enter initial username
      await userEvent.type(usernameInput, 'TestTrainer');
      
      // Check the synchronization checkbox
      await userEvent.click(pokemonGoNameCheckbox);
      
      // Verify synchronization
      expect(pokemonGoNameInput).toHaveValue('TestTrainer');
      expect(pokemonGoNameInput).toBeDisabled();
      
      // Uncheck the synchronization checkbox
      await userEvent.click(pokemonGoNameCheckbox);
      
      // Verify that Pokémon GO Name is cleared and input is enabled
      expect(pokemonGoNameInput).toHaveValue('');
      expect(pokemonGoNameInput).not.toBeDisabled();
    });    

    test('validates Pokémon GO Name with spaces', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      await userEvent.type(pokemonGoNameInput, 'Pokemon Go Name'); // 15 characters with spaces
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(pokemonGoNameInput).toHaveValue('Pokemon Go Name');

      const errorMessage = await screen.findByText(/pokémon go name cannot contain spaces/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates Pokémon GO Name with special characters', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      await userEvent.type(pokemonGoNameInput, 'Pokemon@#'); // Contains '@' and '#'
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(pokemonGoNameInput).toHaveValue('Pokemon@#');

      const errorMessage = await screen.findByText(/pokémon go name can only contain letters, numbers, and underscores/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates Pokémon GO Name with insufficient length', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      await userEvent.type(pokemonGoNameInput, 'abc'); // 3 characters (insufficient)
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(pokemonGoNameInput).toHaveValue('abc');

      const errorMessage = await screen.findByText(/pokémon go name must be at least 4 characters long/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('validates Pokémon GO Name with excessive length', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      await userEvent.type(pokemonGoNameInput, 'thisisaverylongpokemongoname'); // 26 characters (excessive)
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(pokemonGoNameInput).toHaveValue('thisisaverylongpokemongoname');

      const errorMessage = await screen.findByText(/pokémon go name must be at most 15 characters long/i);
      expect(errorMessage).toBeInTheDocument();
    });

    test('does not show error message for valid Pokémon GO Name', async () => {
      const { usernameInput, emailInput, passwordInput, pokemonGoNameInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');

      await userEvent.type(pokemonGoNameInput, 'Valid_Pokemon12'); // 15 characters, valid
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input value is correctly set
      expect(pokemonGoNameInput).toHaveValue('Valid_Pokemon12');

      // Wait to ensure no error message appears
      await waitFor(() => {
        expect(screen.queryByText(/pokémon go name/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Trainer Code Validations', () => {
    test('validates trainer code length', async () => {
      const { usernameInput, emailInput, passwordInput, trainerCodeInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');
      
      // Type a 9-digit code (insufficient length)
      await userEvent.type(trainerCodeInput, '123456789');
      await userEvent.click(screen.getByTestId('register-button'));

      // Assert the length error message appears
      const lengthError = await screen.findByText(/trainer code must be exactly 12 digits/i);
      expect(lengthError).toBeInTheDocument();
    });

    test('validates trainer code numeric only', async () => {
      const { usernameInput, emailInput, passwordInput, trainerCodeInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');
      
      // Type a 12-character code with non-numeric characters
      await userEvent.type(trainerCodeInput, '12345abc6789');
      await userEvent.click(screen.getByTestId('register-button'));

      // Assert the numeric error message appears
      const numericError = await screen.findByText(/trainer code must contain only numbers/i);
      expect(numericError).toBeInTheDocument();
    });

    test('does not show error when trainer code is empty', async () => {
      const { usernameInput, emailInput, passwordInput, trainerCodeInput } = getFormInputs();
      
      // Fill required fields with valid data
      await userEvent.type(usernameInput, 'ValidUser123');
      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.type(passwordInput, 'ValidPass1!');
      
      // Ensure Trainer Code is empty
      await userEvent.clear(trainerCodeInput);
      await userEvent.click(screen.getByTestId('register-button'));

      // Assert that no Trainer Code error message is present
      await waitFor(() => {
        expect(screen.queryByText(/trainer code must be exactly 12 digits/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/trainer code must contain only numbers/i)).not.toBeInTheDocument();
      });
    });
  });

  // Additional Proposed Test Suites
  describe('Form State Management', () => {
    test('maintains field values after failed validation', async () => {
      const { usernameInput, emailInput, passwordInput } = getFormInputs();
      
      await userEvent.type(usernameInput, 'TestUser');
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.type(passwordInput, 'weak');
      await userEvent.click(screen.getByTestId('register-button'));

      // Verify that the input values are retained
      expect(usernameInput).toHaveValue('TestUser');
      expect(emailInput).toHaveValue('invalid-email');
      expect(passwordInput).toHaveValue('weak');
    });

    test('validates all fields simultaneously', async () => {
      // Submit the form without filling any fields
      await userEvent.click(screen.getByTestId('register-button'));
  
      // Assert that all relevant error messages appear
      const usernameError = await screen.findByText(/username is required/i);
      const emailError = await screen.findByText(/email is not valid/i);
      const passwordError = await screen.findByText(/password is required/i); // Updated expectation
  
      expect(usernameError).toBeInTheDocument();
      expect(emailError).toBeInTheDocument();
      expect(passwordError).toBeInTheDocument();
    });
  });
});