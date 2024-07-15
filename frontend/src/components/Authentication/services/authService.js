// authService.js

import axios from 'axios';

axios.defaults.withCredentials = true;

const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_API_URL,
});

const readApi = axios.create({
  baseURL: process.env.REACT_APP_READ_API_URL,
});

export const registerUser = async (userData) => {
  try {
    const response = await authApi.post('/register', userData);
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error.response || error);
    throw error;
  }
};

export const loginUser = async (loginData) => {
  try {
    const response = await authApi.post('/login', loginData);
    return response.data;
  } catch (error) {
    console.error('Error logging in user:', error.response || error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await authApi.post('/logout', {});
    localStorage.removeItem('user');
    return Promise.resolve();
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

export const updateUserDetails = async (userId, userData) => {
  try {
    const response = await authApi.put(`/update/${userId}`, userData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating user:', error.response || error);
    return { success: false, error: error.response.data.message };
  }
};

export const deleteAccount = async (userId) => {
  try {
    const response = await authApi.delete(`/delete/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export const refreshTokenService = async () => {
  try {
    const response = await authApi.post('/refresh', {});
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error.response || error);
    throw error;
  }
};

export const fetchOwnershipData = async (userId) => {
  try {
      const response = await readApi.get(`/ownershipData/${userId}`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          },
          credentials: 'include'  // Include credentials in the request
      });
      return response.data;
  } catch (error) {
      console.error('Error fetching ownership data:', error);
      throw error;
  }
};
