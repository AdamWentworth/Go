// src/mocks/contexts/GlobalStateContext.js
import React, { createContext } from 'react';

const GlobalStateContext = createContext();

const mockSetIsLoggedIn = jest.fn();

const mockGlobalState = {
  isLoggedIn: true, // or false based on your test needs
  setIsLoggedIn: mockSetIsLoggedIn,
};

export const GlobalStateProvider = ({ children }) => {
  return (
    <GlobalStateContext.Provider value={mockGlobalState}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => React.useContext(GlobalStateContext);
