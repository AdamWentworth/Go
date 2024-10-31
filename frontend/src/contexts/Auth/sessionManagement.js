// contexts/Auth/sessionManagement.js

import { useEffect, useState } from 'react';
import { formatTimeUntil } from '../../utils/formattingHelpers';

export const useSessionManagement = (
  userRef,
  setUser,
  setIsLoggedIn,
  clearSession,
  startTokenExpirationCheck,
  checkAndRefreshToken,
  scheduleTokenRefresh,
  tokenManagementCleanup
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      userRef.current = userData;
      setUser(userData);
      setIsLoggedIn(true);

      const currentTime = new Date().getTime();
      const accessTokenExpiryTime = new Date(userData.accessTokenExpiry).getTime();
      const refreshTokenExpiryTime = new Date(userData.refreshTokenExpiry).getTime();
      const refreshTiming = accessTokenExpiryTime - currentTime - 1 * 60 * 1000;

      console.log(`Access Token expires in: ${formatTimeUntil(accessTokenExpiryTime)}`);
      console.log(`Refresh Token expires in: ${formatTimeUntil(refreshTokenExpiryTime)}`);

      if (refreshTokenExpiryTime > currentTime) {
        if (refreshTiming > 0) {
          console.log(`Scheduling token refresh in ${refreshTiming} ms`);
          scheduleTokenRefresh(userData.accessTokenExpiry);
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

    setIsLoading(false);

    return () => {
      tokenManagementCleanup();
      // Any other cleanup if necessary
    };
  }, [setIsLoggedIn]);

  return {
    isLoading,
    isSessionReady,
    setIsSessionReady,
  };
};
