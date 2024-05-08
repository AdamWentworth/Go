// authService.js

import axios from 'axios';

/**
 * Registers a new user with the provided user data.
 * @param {Object} userData - Data containing user information for registration.
 * @returns {Promise<AxiosResponse<any>>} - The response from the registration API.
 */
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_AUTH_API_URL}/auth/register`, userData);
    return response.data; // Assuming the API returns the user data on successful registration
  } catch (error) {
    console.error('Error registering user:', error.response || error);
    throw error; // Rethrow the error to be handled by the caller
  }
};


/**
 * Any other authentication-related API calls can be added here, such as:
 * - Login
 * - Logout
 * - Refresh Tokens
 * - etc.
 */
