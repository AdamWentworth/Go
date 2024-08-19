// GlobalStateContext.js

import React, { createContext, useState, useContext } from 'react';

const GlobalStateContext = createContext();

export const useGlobalState = () => useContext(GlobalStateContext);

export const GlobalStateProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <GlobalStateContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
            {children}
        </GlobalStateContext.Provider>
    );
};
