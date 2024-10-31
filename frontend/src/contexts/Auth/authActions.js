// contexts/Auth/authActions.js

import { logoutUser } from '../../features/Authentication/services/authService';

export const useAuthActions = (
  setIsLoggedIn,
  setUser,
  userRef,
  startTokenExpirationCheck,
  scheduleTokenRefresh,
  clearSession
) => {
  const login = (userData) => {
    console.log('Login response:', userData);

    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
    userRef.current = userData;

    startTokenExpirationCheck();
    scheduleTokenRefresh(userData.accessTokenExpiry);

    // SSE connection will be initiated by useSSEHandler
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearSession(false);
      setIsLoggedIn(false);
    }
  };

  return {
    login,
    logout,
  };
};
