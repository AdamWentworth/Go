// contexts/AuthContext.js

import React, { useEffect, createContext, useState, useContext, useRef, useCallback } from 'react';
import { useGlobalState } from './GlobalStateContext';
import { useSession } from './SessionContext';
import { useTokenManagement } from './Auth/tokenManagement';
import { useSSEHandler } from './Auth/sseHandler';
import { useSessionManagement } from './Auth/sessionManagement';
import { useUserServices } from './Auth/userServices';
import { useAuthActions } from './Auth/authActions';
import { usePokemonData } from './PokemonDataContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  const { isLoggedIn, setIsLoggedIn } = useGlobalState();
  const { lastUpdateTimestamp, updateTimestamp, isSessionNew } = useSession();
  const { setOwnershipData, resetData } = usePokemonData();
  const navigate = useNavigate();

  // Define clearSession without closeConnection initially
  const clearSession = useCallback(
    async (isForcedLogout) => {
      localStorage.removeItem('user');
      localStorage.removeItem('pokemonOwnership');
      setIsLoggedIn(false);
      setUser(null);
      userRef.current = null;

      // Close SSE connection if available
      if (clearSession.closeConnection) {
        clearSession.closeConnection();
      }

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
    },
    [navigate, resetData, setIsLoggedIn, setUser]
  );

  // Initialize useTokenManagement
  const {
    startTokenExpirationCheck,
    checkAndRefreshToken,
    scheduleTokenRefresh,
    cleanup: tokenManagementCleanup,
  } = useTokenManagement(userRef, setUser, clearSession);

  // Initialize useSessionManagement
  const {
    isLoading,
    isSessionReady,
    setIsSessionReady,
  } = useSessionManagement(
    userRef,
    setUser,
    setIsLoggedIn,
    clearSession,
    startTokenExpirationCheck,
    checkAndRefreshToken,
    scheduleTokenRefresh,
    tokenManagementCleanup
  );

  // Function to handle incoming SSE updates
  const handleIncomingUpdate = useCallback(
    (data) => {
      console.log('handleIncomingUpdate called with data:', data);
      if (data.pokemon) {
        setOwnershipData(data.pokemon);

        // Update the last update timestamp
        const newTimestamp = new Date();
        updateTimestamp(newTimestamp);
      }
    },
    [setOwnershipData, updateTimestamp]
  );

  // Initialize useSSEHandler
  const { closeConnection } = useSSEHandler(
    user,
    isLoading,
    isSessionReady,
    isSessionNew,
    lastUpdateTimestamp,
    handleIncomingUpdate,
    updateTimestamp
  );

  // Attach closeConnection to clearSession
  useEffect(() => {
    if (closeConnection) {
      clearSession.closeConnection = closeConnection;
    }
  }, [closeConnection, clearSession]);

  const { login, logout } = useAuthActions(
    setIsLoggedIn,
    setUser,
    userRef,
    startTokenExpirationCheck,
    scheduleTokenRefresh,
    clearSession
  );

  const { updateUserDetails, deleteAccount } = useUserServices(userRef, setUser, clearSession);

  useEffect(() => {
    if (lastUpdateTimestamp !== null) {
      setIsSessionReady(true);
    }
  }, [lastUpdateTimestamp, setIsSessionReady]);

  useEffect(() => {
    return () => {
      // Component will unmount
      tokenManagementCleanup();
      if (closeConnection) {
        closeConnection();
      }
    };
  }, [tokenManagementCleanup, closeConnection]);

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
