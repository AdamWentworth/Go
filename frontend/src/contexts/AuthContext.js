// AuthContext.js

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  logoutUser,
  updateUserDetails as updateUserService,
  deleteAccount as deleteAccountService,
  refreshTokenService,
  updateUsernameInSecondaryDB
} from '../services/authService';
import { formatTimeUntil } from '../utils/formattingHelpers';
import { toast } from 'react-toastify';
import { usePokemonData } from './PokemonDataContext';
import { useGlobalState } from './GlobalStateContext';
import { useSession } from './SessionContext';
import {
  clearStore,
  clearListsStore
} from '../services/indexedDB';
import { getDeviceId } from '../utils/deviceID';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const refreshTimeoutRef = useRef(null);
  const { isLoggedIn, setIsLoggedIn } = useGlobalState();
  const [isLoading, setIsLoading] = useState(true);
  const deviceIdRef = useRef(getDeviceId());
  const { updateTimestamp } = useSession(); 
  const { resetData } = usePokemonData();

  useEffect(() => {
    // Attempt to load user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRef.current = userData;
      setUser(userData);
      setIsLoggedIn(true);

      // Set up token expiry checks
      const currentTime = Date.now();
      const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
      const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();
      const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

      console.log(`Access Token expires in: ${formatTimeUntil(accessTokenExpiryTime)}`);
      console.log(`Refresh Token expires in: ${formatTimeUntil(refreshTokenExpiryTime)}`);

      if (refreshTokenExpiryTime > currentTime) {
        if (refreshTiming > 0) {
          console.log(
            `Scheduling token refresh in ${formatTimeUntil(currentTime + refreshTiming)}`
          );
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
        clearSession(true);
      }
    } else {
      console.log('No stored user found in localStorage');
    }

    setIsLoading(false);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(refreshTimeoutRef.current);
    };
  }, [setIsLoggedIn]);

  const startTokenExpirationCheck = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (userRef.current) {
        const refreshTokenExpiryTime = new Date(userRef.current.refreshTokenExpiry).getTime();
        if (Date.now() >= refreshTokenExpiryTime) {
          clearSession(true); 
        }
      }
    }, 60000); // Check every 1 minute
  };

  const checkAndRefreshToken = async () => {
    if (!userRef.current) return;

    const currentTime = Date.now();
    const accessTokenExpiryTime = new Date(userRef.current.accessTokenExpiry).getTime();
    const refreshTokenExpiryTime = new Date(userRef.current.refreshTokenExpiry).getTime();
    const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

    if (currentTime >= refreshTokenExpiryTime) {
      clearSession(true);
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

        const newUser = {
          ...userRef.current,
          accessTokenExpiry: new Date(updatedUser.accessTokenExpiry),
          refreshTokenExpiry: new Date(updatedUser.refreshTokenExpiry),
        };
        setUser(newUser);
        userRef.current = newUser;
        localStorage.setItem('user', JSON.stringify(newUser));

        scheduleTokenRefresh(new Date(updatedUser.accessTokenExpiry));
      } else {
        console.error('Failed to refresh token:', response);
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error during token refresh:', error);
      clearSession(true);
    }
  };

  const scheduleTokenRefresh = (expiryTime) => {
    clearTimeout(refreshTimeoutRef.current);
    const currentTime = Date.now();
    const accessTokenExpiryTime = new Date(expiryTime).getTime();
    let refreshTiming =
      accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

    if (refreshTiming <= 0) {
      console.log('Access token is about to expire or already expired, refreshing immediately.');
      refreshToken();
    } else {
      console.log(
        `Next Access token refresh scheduled in: ${formatTimeUntil(currentTime + refreshTiming)}`
      );
      refreshTimeoutRef.current = setTimeout(() => {
        checkAndRefreshToken();
      }, refreshTiming);
    }
  };

  const login = (userData) => {
    console.log("Login response:", userData);

    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    userRef.current = userData;

    startTokenExpirationCheck();
    scheduleTokenRefresh(userData.accessTokenExpiry);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn('User not found during logout. Proceeding to clear session.');
      } else {
        console.error('Error during logout:', error);
        toast.error('An error occurred during logout. Please try again.');
        return; // Only clear session if it's just a 404
      }
    } finally {
      clearSession(false);
      setIsLoggedIn(false);
    }
  };

  const clearSession = async (isForcedLogout) => {
    localStorage.removeItem('user');
    localStorage.removeItem('pokemonOwnership');
    localStorage.removeItem('ownershipTimestamp');
    localStorage.removeItem('listsTimestamp');
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;

    // Reset in-memory data
    resetData();

    // Clear IndexedDB
    try {
      // Clear 'pokemonOwnership' store
      await clearStore('pokemonOwnership');
      // Clear lists from 'pokemonListsDB'
      for (const listName of ['owned', 'unowned', 'wanted', 'trade']) {
        await clearListsStore(listName);
      }
      console.log('Cleared IndexedDB data.');
    } catch (error) {
      console.error('Error clearing IndexedDB data:', error);
    }

    if (isForcedLogout) {
      navigate('/login', { replace: true });
      setTimeout(() => alert('Your session has expired, please log in again.'), 1000);
    } else {
      navigate('/login', { replace: true });
    }
  };

  const updateUserDetails = async (userId, newDetails) => {
    try {
      const response = await updateUserService(userId, newDetails);
      console.log("Full response from update:", response);

      if (!response.success) {
        console.error('Update failed:', response);
        return { success: false, error: response.error };
      }

      const previousUsername = userRef.current.username;
      const newUsername = response.data.data.username;
      const usernameChanged = previousUsername !== newUsername;

      // Merge updated user fields
      const updatedData = { ...userRef.current, ...response.data.data };
      console.log("Updated user data after merge:", updatedData);

      setUser(updatedData);
      userRef.current = updatedData;
      localStorage.setItem('user', JSON.stringify(updatedData));

      // If username changed, also update in secondary DB
      if (usernameChanged) {
        const secondaryUpdateResponse = await updateUsernameInSecondaryDB(userId, newUsername);
        if (!secondaryUpdateResponse.success) {
          console.error('Failed to update username in secondary DB:', secondaryUpdateResponse.error);
          toast.error(
            'Username was updated in main DB, but failed to update in secondary DB.'
          );
        } else {
          console.log('Username updated in secondary DB.');
          toast.success('Username updated successfully in all systems.');
        }
      }

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
      clearSession(false);
    } catch (error) {
      throw error;
    }
  };

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
    </AuthContext.Provider>
  );
};

export default AuthProvider;
