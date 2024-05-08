import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Initialize user as null
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (userData) => {
    setIsLoggedIn(true);
    setUser(userData); // Set user data upon login
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null); // Clear user data upon logout
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
