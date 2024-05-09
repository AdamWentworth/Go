// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { logoutUser, updateUserDetails as updateUserService } from '../components/Authentication/services/authService'; // Adjust path as necessary

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Initialize from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsLoggedIn(true);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const updatedData = await updateUserService(userId, userData);
      setUser(updatedData);  // Update the user state with the new data
      localStorage.setItem('user', JSON.stringify(updatedData)); // Optionally update local storage
      return updatedData;
    } catch (error) {
      console.error('Error updating user details:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUserDetails }}>
      {children}
    </AuthContext.Provider>
  );
};
