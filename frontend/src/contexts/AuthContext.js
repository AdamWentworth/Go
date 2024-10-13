// AuthContext.js
import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, updateUserDetails as updateUserService, deleteAccount as deleteAccountService, refreshTokenService } from '../features/Authentication/services/authService';
import { formatTimeUntil } from '../utils/formattingHelpers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePokemonData } from './PokemonDataContext';
import { useGlobalState } from './GlobalStateContext'

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const userRef = useRef(null);  // Create a ref to store the user state
  const navigate = useNavigate();  // Initialize the useNavigate hook
  const intervalRef = useRef(null); // Ref to store the interval ID
  const refreshTimeoutRef = useRef(null); // Ref to store the refresh token timeout
  const { isLoggedIn, setIsLoggedIn } = useGlobalState(); 
  const [isLoading, setIsLoading] = useState(true);  // Add loading state

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRef.current = userData;
      setUser(userData);
      setIsLoggedIn(true);
    }
    setIsLoading(false);  // Ensure loading is set to false after the user data has been checked
  }, [setIsLoggedIn]);  

  // Initialize from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRef.current = userData;  // Set the ref to the initial user data
      setUser(userData); // Set the user state
      setIsLoggedIn(true); // Set the logged-in state to true
      const currentTime = new Date().getTime();
      const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
      const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();
      const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

      console.log(`Access Token expires in: ${formatTimeUntil(accessTokenExpiryTime)}`);
      console.log(`Refresh Token expires in: ${formatTimeUntil(refreshTokenExpiryTime)}`);

      if (refreshTokenExpiryTime > currentTime) {
        if (refreshTiming > 0) {
          refreshTimeoutRef.current = setTimeout(() => {
            checkAndRefreshToken();
          }, refreshTiming);
        } else {
          checkAndRefreshToken(); // Immediately check and refresh token if timing is <= 0
        }

        startTokenExpirationCheck();
      } else {
        clearSession(true);  // Force logout due to token expiration
      }
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(refreshTimeoutRef.current);
    };
  }, [setIsLoggedIn]);

  const startTokenExpirationCheck = () => {
    clearInterval(intervalRef.current); // Clear any existing interval
    intervalRef.current = setInterval(() => {
      const currentTime = new Date().getTime();
      if (userRef.current) {
        const refreshTokenExpiryTime = new Date(userRef.current.refreshTokenExpiry).getTime();
        if (currentTime >= refreshTokenExpiryTime) {
          clearSession(true); // Force logout due to refresh token expiration
        }
      }
    }, 60000); // Check every 1 minute
  };

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
    clearTimeout(refreshTimeoutRef.current); // Clear any existing timeout
    const currentTime = new Date().getTime();
    const accessTokenExpiryTime = new Date(expiryTime).getTime();
    let refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000); // Refresh 1 minute before actual expiry

    if (refreshTiming <= 0) {
      console.log('Access token is about to expire or already expired, refreshing immediately.');
      refreshToken();
    } else {
      console.log(`Next Access token refresh scheduled in: ${formatTimeUntil(currentTime + refreshTiming)}`);
      refreshTimeoutRef.current = setTimeout(() => {
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

    startTokenExpirationCheck();
    scheduleTokenRefresh(userData.accessTokenExpiry); // Pass the correct expiry time
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearSession(false);  // Manual logout
      setIsLoggedIn(false);
    }
  };

  // Inside your AuthProvider component
  const { resetData  } = usePokemonData(); // Destructure setData from the context

  const clearSession = async (isForcedLogout) => {
    localStorage.removeItem('user');
    localStorage.removeItem('pokemonOwnership');
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;

    // Clear relevant caches
    if ('caches' in window) {
        try {
            const cache = await caches.open('pokemonCache');
            await cache.delete('/pokemonOwnership');
            await cache.delete('/pokemonLists');
        } catch (error) {
            console.error('Error clearing cache storage:', error);
        }
    }

    // Call resetData to clear and reinitialize the Pokemon data
    resetData();

    if (isForcedLogout) {
        navigate('/login', { replace: true });
        setTimeout(() => alert('Your session has expired, please log in again.'), 1000);
    } else {
        navigate('/login', { replace: true });
    }
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      console.log("Full response from update:", response); // Log the full response
  
      if (!response.success) {
        console.error('Update failed:', response);
        toast.error(`Failed to update account details: ${response.error}`);
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
      toast.error(`Failed to update account details: ${error.message}`);
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
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout, updateUserDetails, deleteAccount }}>
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );  
};

export default AuthProvider;
