// AuthContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { logoutUser, updateUserDetails as updateUserService, deleteAccount as deleteAccountService } from '../components/Authentication/services/authService';
import { refreshTokenService } from '../components/Authentication/services/authService';
import { formatTimeUntil } from '../components/Collect/utils/formattingHelpers';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userRef = useRef(null);  // Create a ref to store the user state

  // Initialize from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRef.current = userData;  // Set the ref to the initial user data
      const currentTime = new Date().getTime();
      const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
      const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();
      const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

      console.log(`Access Token expires in: ${formatTimeUntil(accessTokenExpiryTime)}`);
      console.log(`Refresh Token expires in: ${formatTimeUntil(refreshTokenExpiryTime)}`);

      if (refreshTokenExpiryTime > currentTime) {
        setUser(userData);
        setIsLoggedIn(true);

        if (refreshTiming > 0) {
          setTimeout(() => {
            checkAndRefreshToken();
          }, refreshTiming);
        } else {
          checkAndRefreshToken(); // Immediately check and refresh token if timing is <= 0
        }
      } else {
        clearSession();
      }
    }
  }, []);

  const checkAndRefreshToken = async () => {
    const currentTime = new Date().getTime();
    const accessTokenExpiryTime = new Date(userRef.current.accessTokenExpiry).getTime();  // Use the ref to get the current user
    const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

    if (refreshTiming <= 0) {
      await refreshToken();
    } else {
      scheduleTokenRefresh(accessTokenExpiryTime);
    }
  };

  const refreshToken = async () => {
    try {
      console.log('Attempting to refresh token...');
      const response = await refreshTokenService();
      console.log('Refresh token response:', response); // Debug log
      if (response && response.accessTokenExpiry && response.refreshTokenExpiry) {
        console.log('Token refreshed successfully.');
        const updatedUser = response;

        // Update user state and local storage with new expiry times
        const newUser = {
          ...userRef.current,
          accessTokenExpiry: new Date(updatedUser.accessTokenExpiry),
          refreshTokenExpiry: new Date(updatedUser.refreshTokenExpiry),
        };
        setUser(newUser);
        userRef.current = newUser;  // Update the ref with the new user data
        localStorage.setItem('user', JSON.stringify(newUser));

        // Re-schedule the next token refresh
        scheduleTokenRefresh(new Date(updatedUser.accessTokenExpiry));
      } else {
        console.error('Failed to refresh token:', response);
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      clearSession();
    }
  };

  const scheduleTokenRefresh = (expiryTime) => {
    const currentTime = new Date().getTime();
    const accessTokenExpiryTime = new Date(expiryTime).getTime();
    let refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000); // Refresh 1 minute before actual expiry

    console.log(`Current Time: ${new Date(currentTime).toISOString()}, Access Token Expiry Time: ${new Date(accessTokenExpiryTime).toISOString()}, Refresh Timing: ${formatTimeUntil(accessTokenExpiryTime)}`);

    if (refreshTiming <= 0) {
      console.log('Access token is about to expire or already expired, refreshing immediately.');
      refreshToken();
    } else {
      console.log(`Next refresh scheduled in ${formatTimeUntil(currentTime + refreshTiming)}`);
      setTimeout(() => {
        checkAndRefreshToken();  // Changed to checkAndRefreshToken to ensure correct timing
      }, refreshTiming);
    }
  };

  const login = (userData) => {
    console.log("Login response:", userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    userRef.current = userData;  // Update the ref with the new user data
    scheduleTokenRefresh(userData.accessTokenExpiry);  // Schedule next token refresh based on the provided expiry time
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearSession();
    }
  };

  const clearSession = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;  // Clear the ref
    console.log('Session cleared locally.');
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      const updatedData = response.data;  // Assuming the response structure is { success: true, data: {...} }
      if (response.success) {
        setUser(updatedData);  // Update the user state with the new data
        userRef.current = updatedData;  // Update the ref with the new user data
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
      clearSession(); // Clear session after deleting the account
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

export default AuthProvider;