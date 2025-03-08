// Navbar.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import MainButtons from './MainButtons';
import AuthButtons from './AuthButtons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { isLoggedIn } = useAuth();
  const { isLightMode } = useTheme();

  // State to control mobile dropdown menus
  const [leftOpen, setLeftOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className={`navbar ${isLightMode ? 'light-mode' : 'dark-mode'}`}>
      {/* Desktop Navbar */}
      <div className="navbar-left">
        <MainButtons navbar={true} />
      </div>
      <div className="navbar-right">
        <AuthButtons />
      </div>

      {/* Mobile Navbar - Left Hamburger */}
      <div className="mobile-left-menu">
        <div className="mobile-menu-container">
          <button
            className="hamburger-button"
            onClick={() => setLeftOpen(!leftOpen)}
            aria-label="Toggle main menu"
          >
            &#9776;
          </button>
          {leftOpen && (
            <div className="mobile-dropdown left-dropdown">
              <Link to="/pokemon" onClick={() => setLeftOpen(false)}>Pokémon</Link>
              <Link to="/search" onClick={() => setLeftOpen(false)}>Search</Link>
              <Link to="/trades" onClick={() => setLeftOpen(false)}>Trades</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navbar - Right Gear for Settings */}
      <div className="mobile-right-menu">
        <div className="mobile-menu-container">
          <button
            className="gear-button"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-label="Toggle settings menu"
          >
            <img
              src="/images/btn_settings.png"
              alt="Settings"
              className="settings-icon"
            />
          </button>
          {settingsOpen && (
            <div className="mobile-dropdown right-dropdown">
              {isLoggedIn ? (
                <>
                  <Link to="/account" onClick={() => setSettingsOpen(false)}>Account</Link>
                  <Link to="/settings" onClick={() => setSettingsOpen(false)}>Settings</Link>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setSettingsOpen(false)}>Login</Link>
                  <Link to="/register" onClick={() => setSettingsOpen(false)}>Register</Link>
                  <Link to="/settings" onClick={() => setSettingsOpen(false)}>Settings</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
