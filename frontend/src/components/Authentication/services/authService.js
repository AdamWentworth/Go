// authService.js

import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_AUTH_API_URL;
axios.defaults.withCredentials = true;

export const registerUser = async (userData) => {
  try {
    const response = await axios.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error.response || error);
    throw error;
  }
};

export const loginUser = async (loginData) => {
  try {
    const response = await axios.post('/auth/login', loginData);

    return response.data;
  } catch (error) {
    console.error('Error logging in user:', error.response || error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await axios.post('/auth/logout', {}, { withCredentials: true });
    // Clear local storage (client-side session invalidation)
    localStorage.removeItem('user');
    return Promise.resolve(); // Resolve the promise immediately as there's no backend call
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// authService.js
export const updateUserDetails = async (userId, userData) => {
  try {
    const response = await axios.put(`/auth/update/${userId}`, userData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating user:', error.response || error);
    return { success: false, error: error.response.data.message };
  }
};

export const deleteAccount = async (userId) => {
  try {
    const response = await axios.delete(`/auth/delete/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export const refreshTokenService = async () => {
  try {
    const response = await axios.post('/auth/refresh', { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error.response || error);
    console.log('Detailed error response:', error.response.data);  // Log the detailed error message from server
    throw error;
  }
};
