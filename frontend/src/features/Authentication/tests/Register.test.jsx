// src/features/Authentication/tests/Register.test.jsx
import React from 'react';
import { render, screen } from '../../../test-utils';
import Register from '../Register';
import userEvent from '@testing-library/user-event';

describe('Register Component', () => {
  test('renders all input fields and buttons', async () => {
    render(<Register />);

    // Check for username input
    expect(await screen.getByPlaceholderText(/username/i)).toBeInTheDocument();

    // Check for email input
    expect(await screen.getByPlaceholderText(/email/i)).toBeInTheDocument();

    // Check for password input
    expect(await screen.getByPlaceholderText(/password/i)).toBeInTheDocument();

    // Check for trainer code input
    expect(await screen.getByPlaceholderText(/trainer code/i)).toBeInTheDocument();

    // Check for Pokémon GO name input
    expect(await screen.getByPlaceholderText(/pokémon go name/i)).toBeInTheDocument();

    // Check for allow location checkbox
    expect(await screen.getByLabelText(/enable collection of your device's gps location data/i)).toBeInTheDocument();

    // Check for submit button
    expect(await screen.findByRole('button', { name: /^register$/i, selector: '.submit-button' })).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: /register with google/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /register with facebook/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /register with twitter/i })).toBeInTheDocument();
  });
});
