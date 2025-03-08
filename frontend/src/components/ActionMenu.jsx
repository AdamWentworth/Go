// ActionMenu.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ActionMenuButton from './ActionMenuButton';
import CloseButton from './CloseButton';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSwitch from './ThemeSwitch';
import './ActionMenu.css';

const ActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { alert } = useModal();
  const { isLoggedIn } = useAuth();
  const { isLightMode } = useTheme();

  const toggleMenu = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const container = document.querySelector('.action-menu-buttons-container');

    if (isOpen) {
      if (container) {
        container.classList.remove('open');
      }
      // Allow fade-out transitions to complete
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 350);
    } else {
      setIsOpen(true);
      setTimeout(() => {
        const container = document.querySelector('.action-menu-buttons-container');
        if (container) {
          container.classList.add('open');
        }
        setIsAnimating(false);
      }, 50);
    }
  };

  useEffect(() => {
    return () => setIsAnimating(false);
  }, []);

  return (
    <>
      {isOpen && (
        <div className="action-menu-overlay active">
          <CloseButton onClick={toggleMenu} />

          {/* Settings button */}
          <button 
            className="settings-button" 
            onClick={() => alert("Settings page is not implemented yet!")}
          >
            <span className="settings-text">Settings</span>
            <img 
              className="settings-icon" 
              src="/images/btn_settings.png" 
              alt="Settings Icon" 
            />
          </button>

          {/* Light Mode Toggle */}
          <div className="theme-toggle">
            <div className="theme-toggle-container">
              <ThemeSwitch />
            </div>
          </div>

          {/* Auth buttons */}
          <div className="auth-button-container">
            {isLoggedIn ? (
              <Link to="/account" style={{ textDecoration: 'none' }}>
                <button className="auth-button">
                  <span className="auth-button-text">Account</span>
                  <img 
                    className="auth-button-icon" 
                    src="/images/profile-icon.png" 
                    alt="Account" 
                  />
                </button>
              </Link>
            ) : (
              <div className="auth-button-stacked">
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <button className="auth-button">
                    <span className="auth-button-text">Register</span>
                    <img 
                      className="auth-button-icon" 
                      src="/images/register-icon.png" 
                      alt="Register" 
                    />
                  </button>
                </Link>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button className="auth-button">
                    <span className="auth-button-text">Login</span>
                    <img 
                      className="auth-button-icon" 
                      src="/images/login-icon.png" 
                      alt="Log In" 
                    />
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Container for central animated buttons */}
          <div className="action-menu-buttons-container">
            {/* Raid button */}
            <button 
              className="action-menu-item button-raid" 
              onClick={() => alert("Raid page is not implemented yet!")}
            >
              <div className="button-content">
                <img src="/images/btn_raid.png" alt="Raid" className="button-icon" />
                <span className="button-label">Raid</span>
              </div>
            </button>

            {/* Search button */}
            <button 
              className="action-menu-item button-search" 
              onClick={() => navigate('/search')}
            >
              <div className="button-content">
                <img src="/images/btn_search.png" alt="Search" className="button-icon" />
                <span className="button-label">Search</span>
              </div>
            </button>

            {/* Pokémon button */}
            <button 
              className="action-menu-item button-pokemon" 
              onClick={() => navigate('/pokemon')}
            >
              <div className="button-content">
                <img src="/images/btn_pokemon.png" alt="Pokémon" className="button-icon" />
                <span className="button-label">Pokémon</span>
              </div>
            </button>

            {/* Home button */}
            <button 
              className="action-menu-item button-home" 
              onClick={() => navigate('/')}
            >
              <div className="button-content">
                <img src="/images/btn_home.png" alt="Home" className="button-icon" />
                <span className="button-label">Home</span>
              </div>
            </button>

            {/* PvP button */}
            <button 
              className="action-menu-item button-pvp" 
              onClick={() => alert("PvP page is not implemented yet!")}
            >
              <div className="button-content">
                <img src="/images/btn_pvp.png" alt="PvP" className="button-icon" />
                <span className="button-label">PvP</span>
              </div>
            </button>

            {/* Trades button */}
            <button 
              className="action-menu-item button-trades" 
              onClick={() => navigate('/trades')}
            >
              <div className="button-content">
                <img src="/images/btn_trades.png" alt="Trades" className="button-icon" />
                <span className="button-label">Trades</span>
              </div>
            </button>

            {/* Rankings button */}
            <button 
              className="action-menu-item button-rankings" 
              onClick={() => alert("Rankings page is not implemented yet!")}
            >
              <div className="button-content">
                <img src="/images/btn_rankings.png" alt="Rankings" className="button-icon" />
                <span className="button-label">Rankings</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Render the action menu button if the menu is closed */}
      {!isOpen && <ActionMenuButton onClick={toggleMenu} />}
    </>
  );
};

export default ActionMenu;