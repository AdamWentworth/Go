// src/mocks/contexts/SessionContext.js
import React, { createContext } from 'react';

const SessionContext = createContext();

const mockUpdateTimestamp = jest.fn();

const mockSessionState = {
  lastUpdateTimestamp: new Date(),
  updateTimestamp: mockUpdateTimestamp,
  isSessionNew: true,
};

export const SessionProvider = ({ children }) => {
  return (
    <SessionContext.Provider value={mockSessionState}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => React.useContext(SessionContext);
