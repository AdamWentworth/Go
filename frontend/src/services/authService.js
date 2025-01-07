// authService.js

import axios from 'axios';
import { getDeviceId } from '../utils/deviceID';

axios.defaults.withCredentials = true;

const authApi = axios.create({
  baseURL: process.env.REACT_APP_AUTH_API_URL,
});

const readApi = axios.create({
  baseURL: process.env.REACT_APP_USERS_API_URL,
});

export const registerUser = async (userData) => {
  try {
    const deviceId = getDeviceId();
    const response = await authApi.post('/register', { ...userData, device_id: deviceId });
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error.response || error);
    throw error;
  }
};

export const loginUser = async (loginData) => {
  try {
    const deviceId = getDeviceId();
    const response = await authApi.post('/login', { ...loginData, device_id: deviceId });
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
    localStorage.removeItem('location');
    localStorage.removeItem('pokemonOwnership');
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

// Function to update user in the secondary DB
export const updateUserInSecondaryDB = async (userId, userDetails) => {
  try {
    const response = await readApi.put(
      `/update-user/${userId}`, 
      {
        username: userDetails.username,
        latitude: userDetails.latitude,
        longitude: userDetails.longitude,
      },
      { 
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating user in secondary DB:', error.response || error);
    return {
      success: false,
      error: 
        error.response?.data?.message || 
        'Failed to update user in secondary DB',
    };
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
      const deviceId = getDeviceId();
      const response = await readApi.get(`/ownershipData/${userId}`, {
          params: {
              device_id: deviceId,
          },
          headers: {
              'Content-Type': 'application/json'
          },
          withCredentials: true  // Include credentials in the request
      });
      return response.data;
  } catch (error) {
      console.error('Error fetching ownership data:', error);
      throw error;
  }
};

export const resetPassword = async ({ identifier }) => {
  try {
    const response = await authApi.post('/reset-password', { identifier });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error.response || error);
    throw error;
  }
};