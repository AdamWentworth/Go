// ActionMenu.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionMenuButton from './ActionMenuButton';
import CloseButton from './CloseButton';
import { useModal } from '../contexts/ModalContext';
import './ActionMenu.css';

const ActionMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const { alert } = useModal();

  const toggleMenu = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    const container = document.querySelector('.action-menu-buttons-container');

    if (isOpen) {
      // Closing: remove the "open" class so all buttons retract to the bottom–center.
      if (container) {
        container.classList.remove('open');
      }
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 250); // Adjust as desired
    } else {
      setIsOpen(true);
      // Query the container after the overlay is rendered.
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
      <div className={`action-menu-overlay ${isOpen ? 'active' : 'inactive'}`}>
        {isOpen && (
          <>
            <CloseButton onClick={toggleMenu} />

            {/* Settings button in the top right now acts like an animated button */}
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

            {/* Container for animated buttons */}
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
                onClick={() => navigate('/discover')}
              >
                <div className="button-content">
                  <img src="/images/btn_search.png" alt="Search" className="button-icon" />
                  <span className="button-label">Search</span>
                </div>
              </button>

              {/* Pokémon button */}
              <button 
                className="action-menu-item button-pokemon" 
                onClick={() => navigate('/collection')}
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
          </>
        )}
      </div>

      {/* When overlay is closed, show the ActionMenuButton */}
      {!isOpen && <ActionMenuButton onClick={toggleMenu} />}
    </>
  );
};

export default ActionMenu;
