// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { logoutUser, updateUserDetails as updateUserService, deleteAccount as deleteAccountService } from '../components/Authentication/services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to convert milliseconds to human-readable time
  const msToTime = (duration) => {
    const milliseconds = parseInt((duration % 1000) / 100),
          seconds = Math.floor((duration / 1000) % 60),
          minutes = Math.floor((duration / (1000 * 60)) % 60),
          hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Initialize from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const userData = JSON.parse(storedUser);
        const currentTime = new Date().getTime();
        const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();

        console.log(`Current time: ${new Date(currentTime).toLocaleString()}, Refresh token expiry time: ${new Date(refreshTokenExpiryTime).toLocaleString()}`);

        if (refreshTokenExpiryTime > currentTime) {
            setUser(userData);
            setIsLoggedIn(true);
            console.log('User data and tokens loaded successfully.');

            // Refresh access token before it expires
            const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
            const refreshTiming = accessTokenExpiryTime - currentTime - (5 * 60 * 1000); // Refresh 5 minutes before expiry

            console.log(`Access token expiry time: ${new Date(accessTokenExpiryTime).toLocaleString()}, Time until refresh: ${msToTime(refreshTiming)}`);

            if (refreshTiming > 0) {
                const refreshTimeout = setTimeout(() => {
                    refreshToken();
                }, refreshTiming);

                return () => clearTimeout(refreshTimeout);
            } else {
                // If access token is already expired, refresh immediately
                console.log('Access token is already expired, refreshing immediately.');
                refreshToken();
            }
        } else {
            // If refresh token is expired, log out immediately
            console.log('Refresh token is expired, logging out.');
            logout();
        }
    }
  }, []);

  const refreshToken = async () => {
    try {
        console.log('Attempting to refresh token...');
        const response = await refreshTokenService();
        if (response.status === 200 && response.data.accessToken) {
            console.log('Token refreshed successfully.');
            const newUserData = { 
                ...user, 
                accessToken: response.data.accessToken, 
                accessTokenExpiry: response.data.accessTokenExpiry 
            };
            setUser(newUserData);
            localStorage.setItem('user', JSON.stringify(newUserData));

            // Schedule next token refresh
            const currentTime = new Date().getTime();
            const accessTokenExpiryTime = new Date(response.data.accessTokenExpiry).getTime();
            const refreshTiming = accessTokenExpiryTime - currentTime - (5 * 60 * 1000); // Refresh 5 minutes before expiry

            console.log(`Next refresh scheduled in ${msToTime(refreshTiming)}`);

            const refreshTimeout = setTimeout(() => {
                refreshToken();
            }, refreshTiming);

            return () => clearTimeout(refreshTimeout);
        } else {
            throw new Error('Failed to refresh token');
        }
    } catch (error) {
        console.error('Error during token refresh:', error);
        logout();
    }
  };

  const login = (userData) => {
    console.log(userData)
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
        await logoutUser();
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUser(null);
    } catch (error) {
        console.error('Error during logout:', error);
    }
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      const updatedData = response.data;  // Assuming the response structure is { success: true, data: {...} }
      if (response.success) {
        setUser(updatedData);  // Update the user state with the new data
        localStorage.setItem('user', JSON.stringify(updatedData)); // Optionally update local storage
        return { success: true, data: updatedData };
      } else {
        console.error('Failed to update user details:', response.message);
        return { success: false, error: response.message }; // Return an error object with the failure message
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      return { success: false, error: error.message }; // Return an error object
    }
  };

  const deleteAccount = async (userId) => {
    try {
        await deleteAccountService(userId);
        logout(); // logout the user after deleting the account
    } catch (error) {
        throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, updateUserDetails, deleteAccount }}>
        {children}
    </AuthContext.Provider>
);
};