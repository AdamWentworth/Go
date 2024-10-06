// Navbar.jsx

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext';
import MainButtons from './MainButtons';
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme

function Navbar() {
    const location = useLocation();
    const logoUrl = process.env.PUBLIC_URL + '/images/logo/logo.png';
    const { isLoggedIn } = useAuth();
    const { isLightMode, toggleTheme } = useTheme(); // Use theme context
    const [searchQuery, setSearchQuery] = useState('');

    const showMainButtons = location.pathname !== '/';

    useEffect(() => {
        const lightModeStylesheet = document.getElementById('light-mode-stylesheet');
        if (isLightMode) {
            if (!lightModeStylesheet) {
                const link = document.createElement('link');
                link.id = 'light-mode-stylesheet';
                link.rel = 'stylesheet';
                link.href = `${process.env.PUBLIC_URL}/Light-Mode.css`;
                document.head.appendChild(link);
            }
        } else {
            if (lightModeStylesheet) {
                lightModeStylesheet.remove();
            }
        }
    }, [isLightMode]);

    const handleSearch = (event) => {
        event.preventDefault();
        console.log('Searching for:', searchQuery);
    };

    return (
        <div className={`navbar ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
            <div className="logo-container">
                <img src={logoUrl} alt="Logo" />
            </div>

            {/* Main title and buttons aligned left */}
            <div className="navbar-main">
                <div className="title-container">
                    <h1>Welcome to Pokémon Go Nexus</h1>
                </div>
                {showMainButtons && <MainButtons navbar={true} />}
            </div>

            {/* Search bar container */}
            <div className="search-container">
                <form onSubmit={handleSearch} className="search-form">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Username..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">🔍</button>
                </form>
            </div>

            {/* Navbar buttons with the theme toggle */}
            <div className="navbar-buttons">
                {/* Simplified Light/Dark mode toggle button */}
                <div className="theme-toggle" onClick={toggleTheme}>
                    <div className="icon-background">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/${isLightMode ? 'dark-mode.png' : 'light-mode.png'}`}
                            alt={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        />
                    </div>
                </div>
                {isLoggedIn ? (
                    <Link to="/account"><button>Account</button></Link>
                ) : (
                    <>
                        <Link to="/login"><button>Login</button></Link>
                        <Link to="/register"><button>Register</button></Link>
                    </>
                )}
                <button>Language</button>
            </div>
        </div>
    );
}

export default Navbar;
