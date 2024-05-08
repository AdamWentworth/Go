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
 * Logs in a user with the provided credentials.
 * @param {Object} loginData - Data containing user credentials for login.
 * @returns {Promise<AxiosResponse<any>>} - The response from the login API.
 */
export const loginUser = async (loginData) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_AUTH_API_URL}/auth/login`, loginData);
    return response.data; // Assuming the API returns user data or token on successful login
  } catch (error) {
    console.error('Error logging in user:', error.response || error);
    throw error; // Rethrow the error to be handled by the caller
  }
};

/**
 * Any other authentication-related API calls can be added here, such as:
 * - Logout
 * - Refresh Tokens
 * - etc.
 */

