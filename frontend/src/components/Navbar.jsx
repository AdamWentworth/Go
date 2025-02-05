// Navbar.jsx

import React, { useEffect, useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../contexts/AuthContext';
import MainButtons from './MainButtons';
import { useTheme } from '../contexts/ThemeContext';
import UserSearchContext from '../contexts/UserSearchContext'; // Import the context, not the provider

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { fetchUserOwnershipData } = useContext(UserSearchContext); // Use UserSearchContext instead of UserSearchProvider
    const logoUrl = process.env.PUBLIC_URL + '/images/logo/logo.png';
    const { isLoggedIn } = useAuth();
    const { isLightMode, toggleTheme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const showMainButtons = location.pathname !== '/';

    const handleSearch = async (event) => {
        event.preventDefault();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
          // 1) Navigate to route
          navigate(`/collection/${trimmedQuery.toLowerCase()}`);
      
          setSearchQuery('');
        }
    };

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

    return (
        <div className={`navbar ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
            <div className="logo-container">
                <img src={logoUrl} alt="Logo" onContextMenu={(e) => e.preventDefault()} />
            </div>
            <div className="navbar-main">
                <div className="title-container">
                    <h1>Welcome to Pokémon Go Nexus</h1>
                </div>
                {showMainButtons && <MainButtons navbar={true} />}
            </div>
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
            <div className="navbar-buttons">
                <div className="theme-toggle" onClick={toggleTheme}>
                    <div className="icon-background">
                        <img
                            src={`${process.env.PUBLIC_URL}/images/${isLightMode ? 'dark-mode.png' : 'light-mode.png'}`}
                            alt={isLightMode ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    </div>
                </div>
                {isLoggedIn ? (
                    <>  
                        <Link to="/trades"><button>Trades</button></Link>
                        <Link to="/account"><button>Account</button></Link>
                    </>
                ) : (
                    <>
                        <Link to="/login"><button>Login</button></Link>
                        <Link to="/register"><button>Register</button></Link>
                    </>
                )}
                {/* <button>Language</button> */}
            </div>
        </div>
    );
}

export default Navbar;