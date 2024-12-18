import React from 'react';
import { render as renderWithAuth, screen, waitFor, act } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import Register from '../Register';
import { registerUser } from '../../../services/authService'; // Import the mocked function

describe('Register Component', () => {
  test('renders all input fields and buttons', async () => {
    await act(async () => {
      renderWithAuth(<Register />);
    });

    expect(await screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(await screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(await screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(await screen.getByPlaceholderText(/trainer code/i)).toBeInTheDocument();
    expect(await screen.getByPlaceholderText(/pokémon go name/i)).toBeInTheDocument();
    expect(
      await screen.getByLabelText(/enable collection of your device's gps location data/i)
    ).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^register$/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /register with google/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /register with facebook/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /register with twitter/i })).toBeInTheDocument();
  });
});

describe('Register Form Validations', () => {
  test('shows validation errors when submitting empty form', async () => {
    await act(async () => {
      renderWithAuth(<Register />);
    });

    await act(async () => {
      userEvent.click(screen.getByTestId('register-button'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Email is not valid/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Password must be 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character./i)
      ).toBeInTheDocument();      
      expect(
        screen.getByText(/Trainer code must be exactly 12 digits/i)
      ).toBeInTheDocument();
    });    
  });
  test('clears validation errors after correcting input', async () => {
    renderWithAuth(<Register />);
  
    // Trigger validation errors
    await act(async () => {
      userEvent.click(screen.getByTestId('register-button'));
    });
  
    // Assert validation error for username
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  
    // Correct the username field
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/username/i), 'ValidUsername');
    });
  
    // Assert that the error disappears
    await waitFor(() => {
      expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
    });
  });
  test('shows error for invalid email and clears after correction', async () => {
    renderWithAuth(<Register />);
    
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/email/i), 'invalid-email');
      userEvent.click(screen.getByTestId('register-button'));
    });
  
    await waitFor(() => {
      expect(screen.getByText(/email is not valid/i)).toBeInTheDocument();
    });
  
    await act(async () => {
      userEvent.clear(screen.getByPlaceholderText(/email/i));
      userEvent.type(screen.getByPlaceholderText(/email/i), 'valid@example.com');
    });
  
    await waitFor(() => {
      expect(screen.queryByText(/email is not valid/i)).not.toBeInTheDocument();
    });
  });
  test('shows error for weak password and clears after correction', async () => {
    renderWithAuth(<Register />);
  
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/password/i), 'weakpass');
      userEvent.click(screen.getByTestId('register-button'));
    });
  
    await waitFor(() => {
      expect(
        screen.getByText(/password must be 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character./i)
      ).toBeInTheDocument();
    });
  
    await act(async () => {
      userEvent.clear(screen.getByPlaceholderText(/password/i));
      userEvent.type(screen.getByPlaceholderText(/password/i), 'StrongPass1!');
    });
  
    await waitFor(() => {
      expect(
        screen.queryByText(/password must be 8 characters/i)
      ).not.toBeInTheDocument();
    });
  });
  test('shows email format error', async () => {
    renderWithAuth(<Register />);

    // Input an invalid email
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/email/i), 'invalid-email');
      userEvent.click(screen.getByTestId('register-button'));
    });

    // Assert the error message
    await waitFor(() => {
      expect(screen.getByText(/email is not valid/i)).toBeInTheDocument();
    });
  });

  test('shows password strength error', async () => {
    renderWithAuth(<Register />);

    // Input a weak password
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/password/i), 'weakpass');
      userEvent.click(screen.getByTestId('register-button'));
    });

    // Assert the error message
    await waitFor(() => {
      expect(
        screen.getByText(/password must be 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special character./i)
      ).toBeInTheDocument();
    });
  });

  test('shows trainer code format error', async () => {
    renderWithAuth(<Register />);

    // Input an invalid trainer code
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/trainer code/i), '1234');
      userEvent.click(screen.getByTestId('register-button'));
    });

    // Assert the error message
    await waitFor(() => {
      expect(screen.getByText(/trainer code must be exactly 12 digits/i)).toBeInTheDocument();
    });
  });
  test('clears email format error after correction', async () => {
    renderWithAuth(<Register />);
  
    // Trigger email format error
    await act(async () => {
      userEvent.type(screen.getByPlaceholderText(/email/i), 'invalid-email');
      userEvent.click(screen.getByTestId('register-button'));
    });
  
    // Assert error message is shown
    await waitFor(() => {
      expect(screen.getByText(/email is not valid/i)).toBeInTheDocument();
    });
  
    // Correct the email
    await act(async () => {
      userEvent.clear(screen.getByPlaceholderText(/email/i));
      userEvent.type(screen.getByPlaceholderText(/email/i), 'valid@example.com');
    });
  
    // Assert error message is cleared
    await waitFor(() => {
      expect(screen.queryByText(/email is not valid/i)).not.toBeInTheDocument();
    });
  });
});

jest.mock('../../../services/authService', () => ({
  registerUser: jest.fn(() =>
    new Promise((resolve) => setTimeout(() => resolve({ success: true }), 2000))
  ),
  loginUser: jest.fn(() =>
    Promise.resolve({
      user_id: 1,
      email: 'test@example.com',
      username: 'TestUser',
    })
  ),
}));

// In your Register.test.jsx
test('shows loading spinner during registration and handles success', async () => {
  jest.setTimeout(10000); // Extend Jest timeout for async operations

  // Render the component
  renderWithAuth(<Register />);

  // Debug: log all placeholders to verify rendering
  const inputs = screen.getAllByRole('textbox');
  console.log('Available inputs:', inputs.map(input => input.placeholder));

  // Fill out the form completely
  await userEvent.type(screen.getByPlaceholderText('Username (must be unique)'), 'TestUser');
  await userEvent.type(screen.getByPlaceholderText('Email (must be unique)'), 'test@example.com');
  
  // Password is typically not a textbox, so use a different selector
  await userEvent.type(screen.getByPlaceholderText('Password'), 'StrongPass1!');
  
  await userEvent.type(screen.getByPlaceholderText('Trainer Code (optional)'), '123456789012');

  // Submit the form
  await act(async () => {
    userEvent.click(screen.getByTestId('register-button'));
  });

  // Assert spinner appears
  const loadingElement = await screen.findByText(/Loading\./);
  expect(loadingElement).toBeInTheDocument();
});

// test('shows loading spinner during registration and handles failure', async () => {
//   jest.setTimeout(10000); // Extend Jest timeout for async operations

//   // Mock registerUser to simulate delay and failure
//   registerUser.mockImplementation(
//     () =>
//       new Promise((_, reject) =>
//         setTimeout(() => reject(new Error('Registration failed')), 2000)
//       )
//   );

//   renderWithAuth(<Register />);

//   // Ensure spinner is not initially rendered
//   expect(screen.queryByRole('status', { name: /Loading/i })).not.toBeInTheDocument();

//   // Fill out the form
//   userEvent.type(screen.getByPlaceholderText(/username/i), 'TestUser');
//   userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
//   userEvent.type(screen.getByPlaceholderText(/password/i), 'StrongPass1!');
//   userEvent.type(screen.getByPlaceholderText(/trainer code/i), '123456789012');

//   // Submit the form
//   await act(async () => {
//     userEvent.click(screen.getByTestId('register-button'));
//   });

//   // Assert spinner appears
//   expect(await screen.findByRole('status', { name: /Loading/i })).toBeInTheDocument();

//   // Wait for spinner to disappear after failure
//   await waitFor(() => {
//     expect(screen.queryByRole('status', { name: /Loading/i })).not.toBeInTheDocument();
//   });

//   // Check for return to registration page (RegisterForm should be visible)
//   expect(screen.getByTestId('register-button')).toBeInTheDocument();
// });

// test('shows success message on successful registration', async () => {
//   renderWithAuth(<Register />);

//   // Simulate input values
//   userEvent.type(screen.getByPlaceholderText(/username/i), 'ValidUser');
//   userEvent.type(screen.getByPlaceholderText(/email/i), 'valid@example.com');
//   userEvent.type(screen.getByPlaceholderText(/password/i), 'StrongPass1!');
//   userEvent.type(screen.getByPlaceholderText(/trainer code/i), '123456789012');

//   // Submit the form
//   userEvent.click(screen.getByTestId('register-button'));

//   // Assert success message is displayed
//   expect(await screen.findByText(/Successfully Registered and Logged in/i)).toBeInTheDocument();
// });

// test('shows error when username is already taken', async () => {
//   renderWithAuth(<Register />);

//   // Mock API response to return a conflict error
//   jest.spyOn(authService, 'registerUser').mockRejectedValueOnce({
//     response: {
//       status: 409,
//       data: { message: 'This username is already taken.' },
//     },
//   });

//   // Simulate input values
//   userEvent.type(screen.getByPlaceholderText(/username/i), 'DuplicateUser');
//   userEvent.type(screen.getByPlaceholderText(/email/i), 'duplicate@example.com');
//   userEvent.type(screen.getByPlaceholderText(/password/i), 'StrongPass1!');
//   userEvent.type(screen.getByPlaceholderText(/trainer code/i), '123456789012');

//   // Submit the form
//   userEvent.click(screen.getByTestId('register-button'));

//   // Assert error message is displayed
//   expect(await screen.findByText(/This username is already taken./i)).toBeInTheDocument();
// });

// test('disables location input when GPS location is enabled', async () => {
//   renderWithAuth(<Register />);

//   // Enable GPS location
//   userEvent.click(screen.getByLabelText(/Enable collection of your device's GPS location data/i));

//   // Assert location input is disabled
//   expect(screen.getByPlaceholderText(/City \/ Place/i)).toBeDisabled();
// });

// test('shows location suggestions based on user input', async () => {
//   renderWithAuth(<Register />);

//   // Mock location suggestions
//   jest.spyOn(locationServices, 'fetchSuggestions').mockResolvedValueOnce([
//     { displayName: 'New York, NY, USA' },
//     { displayName: 'Newark, NJ, USA' },
//   ]);

//   // Type into location input
//   userEvent.type(screen.getByPlaceholderText(/City \/ Place/i), 'New');

//   // Assert suggestions are displayed
//   expect(await screen.findByText(/New York, NY, USA/i)).toBeInTheDocument();
//   expect(await screen.findByText(/Newark, NJ, USA/i)).toBeInTheDocument();
// });

// test('syncs Pokémon GO name with username when checkbox is checked', async () => {
//   renderWithAuth(<Register />);

//   // Enter username and enable synchronization
//   userEvent.type(screen.getByPlaceholderText(/username/i), 'User123');
//   userEvent.click(screen.getByLabelText(/Username matches my Pokémon GO account name/i));

//   // Assert Pokémon GO name matches username
//   expect(screen.getByPlaceholderText(/Pokémon GO name/i)).toHaveValue('User123');
// });

// test('triggers Google login on button click', async () => {
//   renderWithAuth(<Register />);

//   // Mock Google login handler
//   const mockGoogleLogin = jest.fn();
//   jest.spyOn(authService, 'googleLogin').mockImplementation(mockGoogleLogin);

//   // Click Google login button
//   userEvent.click(screen.getByRole('button', { name: /register with google/i }));

//   // Assert Google login function is called
//   expect(mockGoogleLogin).toHaveBeenCalled();
// });

// test('shows error for short username', async () => {
//   renderWithAuth(<Register />);

//   // Input a too-short username
//   userEvent.type(screen.getByPlaceholderText(/username/i), 'Us');
//   userEvent.click(screen.getByTestId('register-button'));

//   // Assert validation error
//   expect(await screen.findByText(/Username is too short/i)).toBeInTheDocument();
// });
