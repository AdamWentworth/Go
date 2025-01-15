// ThemeContext.js
import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export const ThemeProvider = ({ children }) => {
    // Initialize state by reading from localStorage
    const [isLightMode, setIsLightMode] = useState(() => {
        // Try to fetch the saved theme preference from localStorage
        const storedPreference = localStorage.getItem('isLightMode');
        // If found, parse it (since it's stored as a string), otherwise default to false (dark mode)
        return storedPreference !== null ? JSON.parse(storedPreference) : false;
    });

    const toggleTheme = () => {
        setIsLightMode((prevMode) => {
            const newMode = !prevMode;
            // Save the updated preference to localStorage
            localStorage.setItem('isLightMode', JSON.stringify(newMode));
            return newMode;
        });
    };

    return (
        <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
