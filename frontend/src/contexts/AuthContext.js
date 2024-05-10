// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { logoutUser, updateUserDetails as updateUserService, deleteAccount as deleteAccountService } from '../components/Authentication/services/authService';

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
        await logoutUser(); // This should internally handle clearing local storage
        setIsLoggedIn(false);
        setUser(null);
    } catch (error) {
        console.error('Error during logout:', error);
    }
  };

  const updateUserDetails = async (userId, userData) => {
    try {
      const response = await updateUserService(userId, userData);
      const updatedData = response.data;  // Assuming the response structure is { success: true, data: {...} }
      if (response.success) {
        setUser(updatedData);  // Update the user state with the new data
        localStorage.setItem('user', JSON.stringify(updatedData)); // Optionally update local storage
        return { success: true, data: updatedData };
      } else {
        console.error('Failed to update user details:', response.message);
        return { success: false, error: response.message }; // Return an error object with the failure message
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      return { success: false, error: error.message }; // Return an error object
    }
  };

  const deleteAccount = async (userId) => {
    try {
        await deleteAccountService(userId);
        logout(); // logout the user after deleting the account
    } catch (error) {
        throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, updateUserDetails, deleteAccount }}>
        {children}
    </AuthContext.Provider>
);
};