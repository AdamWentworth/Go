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
    console.log("Login response:", response.data); // Log to debug
    return response.data;
  } catch (error) {
    console.error('Error logging in user:', error.response || error);
    throw error;
  }
};

/**
 * Logs out the current user.
 * @returns {Promise<void>} - A promise that resolves when the logout process is complete.
 */
export const logoutUser = async () => {
  // Clear local storage (client-side session invalidation)
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  return Promise.resolve(); // Resolve the promise immediately as there's no backend call
};


// Update user details
export const updateUserDetails = async (userId, userData) => {
  try {
      const response = await axios.put(`${process.env.REACT_APP_AUTH_API_URL}/auth/update/${userId}`, userData);
      console.log("Update response:", response.data);
      return { success: true, data: response.data };  // Make sure the backend is sending back the updated user data or a confirmation.
  } catch (error) {
      console.error('Error updating user:', error.response || error);
      throw {
          status: error.response.status,
          message: error.response.data.message
      };
  }
};

export const deleteAccount = async (userId) => {
  try {
      const response = await axios.delete(`${process.env.REACT_APP_AUTH_API_URL}/auth/delete/${userId}`);
      return response.data;
  } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
  }
};

/**
 * Any other authentication-related API calls can be added here, such as:
 * - Logout
 * - Refresh Tokens
 * - etc.
 */

