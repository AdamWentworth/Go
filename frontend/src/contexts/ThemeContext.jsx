// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export const ThemeProvider = ({ children }) => {
    const [isLightMode, setIsLightMode] = useState(() => {
        const storedPreference = localStorage.getItem('isLightMode');
        return storedPreference !== null ? JSON.parse(storedPreference) : false;
    });

    const toggleTheme = () => {
        setIsLightMode((prevMode) => {
            const newMode = !prevMode;
            localStorage.setItem('isLightMode', JSON.stringify(newMode));
            return newMode;
        });
    };

    // Always run this effect regardless of which page or component is rendered.
    useEffect(() => {
        const lightModeStylesheet = document.getElementById('light-mode-stylesheet');
        if (isLightMode) {
            if (!lightModeStylesheet) {
                const link = document.createElement('link');
                link.id = 'light-mode-stylesheet';
                link.rel = 'stylesheet';
                link.href = `/Light-Mode.css`;
                document.head.appendChild(link);
            }
        } else {
            if (lightModeStylesheet) {
                lightModeStylesheet.remove();
            }
        }
    }, [isLightMode]);

    return (
        <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
