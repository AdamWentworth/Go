// ActionMenu.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ActionMenuButton from './ActionMenuButton';
import CloseButton from './CloseButton';
import './ActionMenu.css';

const ActionMenu = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (isOpen) {
      // Start closing animation
      const container = document.querySelector('.action-menu-buttons-container');
      if (container) {
        container.classList.remove('open');
      }
      
      // Delay the actual closing to allow animation to complete
      setTimeout(() => {
        setIsOpen(false);
        setIsAnimating(false);
      }, 500); // Match this with your CSS transition duration
    } else {
      setIsOpen(true);
      // Slight delay to ensure DOM is updated before we start animation
      setTimeout(() => {
        const container = document.querySelector('.action-menu-buttons-container');
        if (container) {
          container.classList.add('open');
        }
        setIsAnimating(false);
      }, 50);
    }
  };

  // Clean up animation states when component unmounts
  useEffect(() => {
    return () => {
      setIsAnimating(false);
    };
  }, []);

  return (
    <>
      {/* Overlay always rendered but with opacity 0 when closed */}
      <div className={`action-menu-overlay ${isOpen ? 'active' : 'inactive'}`}>
        {isOpen && (
          <>
            <CloseButton onClick={toggleMenu} />

            {/* Settings area in the top right */}
            <button 
              className="settings-button" 
              onClick={() => navigate('/settings')}
            >
              <span className="settings-text">Settings</span>
              <img 
                className="settings-icon" 
                src="/images/btn_settings.png" 
                alt="Settings Icon" 
              />
            </button>

            {/* Circular button container */}
            <div className={`action-menu-buttons-container ${isOpen ? '' : ''}`}>
              <button 
                className="action-menu-item button-raid" 
                onClick={() => navigate('/raid')}
              >
                <div className="button-content">
                  <img src="/images/btn_raid.png" alt="Raid" className="button-icon" />
                  <span className="button-label">Raid</span>
                </div>
              </button>

              <button 
                className="action-menu-item button-pvp" 
                onClick={() => navigate('/pvp')}
              >
                <div className="button-content">
                  <img src="/images/btn_pvp.png" alt="PvP" className="button-icon" />
                  <span className="button-label">PvP</span>
                </div>
              </button>

              <button 
                className="action-menu-item button-search" 
                onClick={() => navigate('/discover')}
              >
                <div className="button-content">
                  <img src="/images/btn_search.png" alt="Search" className="button-icon" />
                  <span className="button-label">Search</span>
                </div>
              </button>

              <button 
                className="action-menu-item button-rankings" 
                onClick={() => navigate('/rankings')}
              >
                <div className="button-content">
                  <img src="/images/btn_rankings.png" alt="Rankings" className="button-icon" />
                  <span className="button-label">Rankings</span>
                </div>
              </button>

              <button 
                className="action-menu-item button-pokemon" 
                onClick={() => navigate('/collection')}
              >
                <div className="button-content">
                  <img src="/images/btn_pokemon.png" alt="Pokémon" className="button-icon" />
                  <span className="button-label">Pokémon</span>
                </div>
              </button>

              <button 
                className="action-menu-item button-trades" 
                onClick={() => navigate('/trades')}
              >
                <div className="button-content">
                  <img src="/images/btn_trades.png" alt="Trades" className="button-icon" />
                  <span className="button-label">Trades</span>
                </div>
              </button>

              {/* Home button remains centered */}
              <button 
                className="action-menu-item button-home" 
                onClick={() => navigate('/')}
              >
                <div className="button-content">
                  <img src="/images/btn_home.png" alt="Home" className="button-icon" />
                  <span className="button-label">Home</span>
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