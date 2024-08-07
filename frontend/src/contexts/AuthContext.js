// AuthContext.js

import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser, updateUserDetails as updateUserService, deleteAccount as deleteAccountService, refreshTokenService } from '../components/Authentication/services/authService';
import { formatTimeUntil } from '../components/Collect/utils/formattingHelpers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userRef = useRef(null);
  const navigate = useNavigate();
  const intervalRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  // Initialize from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRef.current = userData;
      setUser(userData);
      setIsLoggedIn(true);
      setIsLoading(false);
      const currentTime = new Date().getTime();
      const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
      const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();
      const refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

      if (refreshTokenExpiryTime > currentTime) {
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
              action: 'updateLoginStatus',
              data: { isLoggedIn: true }
          });
        }

        if (refreshTiming > 0) {
          refreshTimeoutRef.current = setTimeout(() => {
            checkAndRefreshToken();
          }, refreshTiming);
        } else {
          checkAndRefreshToken();
        }

        startTokenExpirationCheck();
      } else {
        clearSession(true);
      }
    } else {
      setIsLoading(false);
    }

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(refreshTimeoutRef.current);
    };
  }, []);

  const startTokenExpirationCheck = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const currentTime = new Date().getTime();
      if (userRef.current) {
        const refreshTokenExpiryTime = new Date(userRef.current.refreshTokenExpiry).getTime();
        if (currentTime >= refreshTokenExpiryTime) {
          clearSession(true);
        }
      }
    }, 60000);
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
      const response = await refreshTokenService();
      if (response && response.accessTokenExpiry && response.refreshTokenExpiry) {
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
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      clearSession(true);
    }
  };

  const scheduleTokenRefresh = (expiryTime) => {
    clearTimeout(refreshTimeoutRef.current);
    const currentTime = new Date().getTime();
    const accessTokenExpiryTime = new Date(expiryTime).getTime();
    let refreshTiming = accessTokenExpiryTime - currentTime - (1 * 60 * 1000);

    if (refreshTiming <= 0) {
      refreshToken();
    } else {
      refreshTimeoutRef.current = setTimeout(() => {
        checkAndRefreshToken();
      }, refreshTiming);
    }
  };

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    userRef.current = userData;

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
          action: 'updateLoginStatus',
          data: { isLoggedIn: true }
      });
    }

    startTokenExpirationCheck();
    scheduleTokenRefresh(userData.accessTokenExpiry);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearSession(false);
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            action: 'updateLoginStatus',
            data: { isLoggedIn: false }
        });
      }
    }
  };

  const clearSession = (isForcedLogout) => {
    localStorage.removeItem('user');
    localStorage.removeItem('location'); // Clear stored location
    setIsLoggedIn(false);
    setUser(null);
    userRef.current = null;
    clearInterval(intervalRef.current);
    clearTimeout(refreshTimeoutRef.current);
    if (isForcedLogout) {
      navigate('/login', { replace: true });
      setTimeout(() => {
        alert('Your session has expired, please log in again.');
      }, 1000);
    } else {
      navigate('/login', { replace: true });
    }
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      if (!response.success) {
        toast.error(`Failed to update account details: ${response.error}`);
        return { success: false, error: response.error };
      }

      const updatedData = { ...userRef.current, ...response.data };
      setUser(updatedData);
      localStorage.setItem('user', JSON.stringify(updatedData));
      toast.success('Account details updated successfully!');
      return { success: true, data: updatedData };
    } catch (error) {
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
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout, updateUserDetails, deleteAccount }}>
      {children}
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </AuthContext.Provider>
  );
};

export default AuthProvider;
