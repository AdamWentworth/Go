// src/mocks/contexts/AuthContext.js
import React, { createContext } from 'react';

export const AuthContext = createContext();

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();
  const mockUpdateUserDetails = jest.fn();
  const mockDeleteAccount = jest.fn();

  const mockContextValue = {
    user: null, // Adjust as needed for tests
    isLoggedIn: false, // Adjust based on your test scenario
    isLoading: false,
    login: mockLogin,
    logout: mockLogout,
    updateUserDetails: mockUpdateUserDetails,
    deleteAccount: mockDeleteAccount,
  };

  return (
    <AuthContext.Provider value={mockContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
