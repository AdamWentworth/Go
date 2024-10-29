// AuthContext.js

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { getDeviceId } from '../utils/deviceID';
import { useNavigate } from 'react-router-dom';
import {
  logoutUser,
  updateUserDetails as updateUserService,
  deleteAccount as deleteAccountService,
  refreshTokenService,
} from '../features/Authentication/services/authService';
import { formatTimeUntil } from '../utils/formattingHelpers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePokemonData } from './PokemonDataContext';
import { useGlobalState } from './GlobalStateContext';
import { initiateSSEConnection, closeSSEConnection, fetchUpdates } from '../services/sseService'; // Import SSE functions
import { useSession } from './SessionContext';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const userRef = useRef(null); // Create a ref to store the user state
  const navigate = useNavigate(); // Initialize the useNavigate hook
  const intervalRef = useRef(null); // Ref to store the interval ID
  const refreshTimeoutRef = useRef(null); // Ref to store the refresh token timeout
  const { isLoggedIn, setIsLoggedIn } = useGlobalState();
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const deviceIdRef = useRef(getDeviceId());
  const { lastUpdateTimestamp, updateTimestamp, isSessionNew } = useSession();
  const [isSessionReady, setIsSessionReady] = useState(false);

  const { setOwnershipData, resetData } = usePokemonData(); // Import updatePokemonData

  useEffect(() => {
    // console.log('Checking if lastUpdateTimestamp is set:', lastUpdateTimestamp);
    if (lastUpdateTimestamp !== null) {
      // console.log('Session is ready');
      setIsSessionReady(true);
    }
  }, [lastUpdateTimestamp]);

  // Function to handle incoming SSE updates
  const handleIncomingUpdate = (data) => {
    console.log('handleIncomingUpdate called with data:', data);
    if (data.pokemon) {
      setOwnershipData(data.pokemon);

      // Update the last update timestamp
      const newTimestamp = new Date();
      updateTimestamp(newTimestamp);
    }
  };

  useEffect(() => {
    // console.log('Initialization useEffect in AuthContext');
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      // console.log('Stored user found in localStorage:', storedUser);
      const userData = JSON.parse(storedUser);
      userRef.current = userData;
      setUser(userData);
      setIsLoggedIn(true);

      const currentTime = new Date().getTime();
      const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
      const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();
      const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

      console.log(`Access Token expires in: ${formatTimeUntil(accessTokenExpiryTime)}`);
      console.log(`Refresh Token expires in: ${formatTimeUntil(refreshTokenExpiryTime)}`);

      if (refreshTokenExpiryTime > currentTime) {
        if (refreshTiming > 0) {
          console.log(`Scheduling token refresh in ${refreshTiming} ms`);
          refreshTimeoutRef.current = setTimeout(() => {
            checkAndRefreshToken();
          }, refreshTiming);
        } else {
          console.log('Access token expired or about to expire, refreshing token immediately');
          checkAndRefreshToken();
        }

        startTokenExpirationCheck();
      } else {
        console.log('Refresh token expired, clearing session');
        clearSession(true); // Force logout due to token expiration
      }
    } else {
      console.log('No stored user found in localStorage');
    }

    // Set isLoading to false after processing
    setIsLoading(false);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(refreshTimeoutRef.current);
      closeSSEConnection();
    };
  }, [setIsLoggedIn]);

  useEffect(() => {
    if (user && !isLoading && isSessionReady) {
      const deviceId = deviceIdRef.current;
  
      if (isSessionNew && lastUpdateTimestamp) {
        console.log('Fetching missed updates...');
  
        // Convert lastUpdateTimestamp to milliseconds
        const timestamp = lastUpdateTimestamp.getTime().toString();
  
        fetchUpdates(user.user_id, deviceId, timestamp)
          .then((updates) => {
            console.log('Fetched missed updates:', updates);
            if (updates && updates.pokemon && Object.keys(updates.pokemon).length > 0) {
              console.log('Missed updates received:', Object.keys(updates.pokemon).length);
              handleIncomingUpdate(updates);
            } else {
              console.log('No missed updates found.');
              // Update the timestamp even if no updates
              const newTimestamp = new Date();
              updateTimestamp(newTimestamp);
            }
          })
          .catch((error) => {
            console.error('Error fetching missed updates:', error);
          });
      } else {
        console.log('Session is not new or lastUpdateTimestamp is null, not fetching missed updates.');
      }
  
      // Initiate SSE connection
      initiateSSEConnection(user.user_id, handleIncomingUpdate, lastUpdateTimestamp);
    }
  }, [user, isLoading, isSessionReady]);  

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

    // Initiate SSE connection
    initiateSSEConnection(userData.user_id, handleIncomingUpdate);
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

  const clearSession = async (isForcedLogout) => {
    localStorage.removeItem('user');
    localStorage.removeItem('pokemonOwnership');
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;

    // Close SSE connection
    closeSSEConnection();

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

  useEffect(() => {
    return () => {
      // Component will unmount
      clearInterval(intervalRef.current);
      clearTimeout(refreshTimeoutRef.current);
      closeSSEConnection();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        login,
        logout,
        updateUserDetails,
        deleteAccount,
      }}
    >
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
};

export default AuthProvider;