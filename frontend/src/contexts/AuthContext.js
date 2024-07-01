// AuthContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, updateUserDetails as updateUserService, deleteAccount as deleteAccountService } from '../components/Authentication/services/authService';
import { refreshTokenService } from '../components/Authentication/services/authService';
import { formatTimeUntil } from '../components/Collect/utils/formattingHelpers';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const userRef = useRef(null);  // Create a ref to store the user state
  const navigate = useNavigate();  // Initialize the useNavigate hook

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
        clearSession(true);  // Force logout due to token expiration
      }
    }
  }, []);

  const checkAndRefreshToken = async () => {
    if (!userRef.current) {
      return;
    }

    const currentTime = new Date().getTime();
    const accessTokenExpiryTime = new Date(userRef.current.accessTokenExpiry).getTime();
    const refreshTokenExpiryTime = new Date(userRef.current.refreshTokenExpiry).getTime();
    const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

    if (currentTime >= refreshTokenExpiryTime) {
      clearSession(true); // Force logout due to refresh token expiration
      return;
    }

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
      clearSession(true);  // Force logout due to error in token refresh
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
      clearSession(false);  // Manual logout
    }
  };

  const clearSession = (isForcedLogout) => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;  // Clear the ref
    if (isForcedLogout) {
      navigate('/login');
      setTimeout(() => {
        alert('Your session has expired, please log in again.');
      }, 0);
    }
    console.log('Session cleared locally.');
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      console.log("Full response from update:", response); // Log the full response
  
      if (!response.success) {
        console.error('Update failed:', response);
        alert(`Failed to update account details: ${response.error}`);
        return { success: false, error: response.error };
      }
  
      const updatedData = { ...userRef.current, ...response.data };
      console.log("Updated user data after merge:", updatedData); // Log after merging
  
      setUser(updatedData); // Update the user state with the new data
      localStorage.setItem('user', JSON.stringify(updatedData)); // Optionally update local storage
  
      toast.success('Account details updated successfully!');
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('Error updating user details:', error);
      alert(`Failed to update account details: ${error.message}`);
      return { success: false, error: error.message };
    }
  };  

  const deleteAccount = async (userId) => {
    try {
      await deleteAccountService(userId);
      clearSession(false); // Clear session after deleting the account
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