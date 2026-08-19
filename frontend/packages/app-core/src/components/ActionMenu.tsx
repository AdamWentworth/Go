// ActionMenu.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import ActionMenuButton from './ActionMenuButton';
import CloseButton from './CloseButton';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useContextBackHandler } from '../contexts/ContextBackContext';
import { fetchFriendsOverview } from '../services/socialService';
import ThemeSwitch from './ThemeSwitch';
import './ActionMenu.css';

const ActionMenu: React.FC = () => {
  const MENU_TRANSITION_MS = 300;
  const MENU_OPEN_DELAY_MS = 75;
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isCloseEnabled, setIsCloseEnabled] = useState(false);
  const openingAnimationTimeoutRef = useRef<number | null>(null);
  const closeEnableTimeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth() ?? {};
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  useTheme();

  const cancelPendingOpenAnimation = useCallback(() => {
    if (openingAnimationTimeoutRef.current === null) return;
    window.clearTimeout(openingAnimationTimeoutRef.current);
    openingAnimationTimeoutRef.current = null;
  }, []);

  const cancelPendingCloseEnable = useCallback(() => {
    if (closeEnableTimeoutRef.current === null) return;
    window.clearTimeout(closeEnableTimeoutRef.current);
    closeEnableTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen && isVisible) {
      const timeoutId = window.setTimeout(() => {
        setIsVisible(false);
      }, MENU_TRANSITION_MS);

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [isOpen, isVisible]);

  useEffect(() => {
    return () => {
      cancelPendingOpenAnimation();
      cancelPendingCloseEnable();
    };
  }, [cancelPendingCloseEnable, cancelPendingOpenAnimation]);

  useEffect(() => {
    if (!isOpen || !isLoggedIn) {
      if (!isLoggedIn) setPendingFriendCount(0);
      return;
    }

    let active = true;
    void fetchFriendsOverview()
      .then((overview) => {
        if (active) setPendingFriendCount(overview.incoming.length);
      })
      .catch(() => {
        if (active) setPendingFriendCount(0);
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn, isOpen]);

  const openMenu = useCallback(() => {
    cancelPendingOpenAnimation();
    cancelPendingCloseEnable();
    setIsCloseEnabled(false);
    setIsVisible(true);

    openingAnimationTimeoutRef.current = window.setTimeout(() => {
      openingAnimationTimeoutRef.current = null;
      setIsOpen(true);

      closeEnableTimeoutRef.current = window.setTimeout(() => {
        closeEnableTimeoutRef.current = null;
        setIsCloseEnabled(true);
      }, MENU_TRANSITION_MS);
    }, MENU_OPEN_DELAY_MS);
  }, [cancelPendingCloseEnable, cancelPendingOpenAnimation]);

  const closeMenu = useCallback(() => {
    cancelPendingOpenAnimation();
    cancelPendingCloseEnable();
    setIsCloseEnabled(false);
    setIsOpen(false);
  }, [cancelPendingCloseEnable, cancelPendingOpenAnimation]);

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu();
      return;
    }
    openMenu();
  };

  const handleNavigation = (path: string) => {
    if (location.pathname !== path) {
      navigate(path, {
        state: {
          contextBackTo: `${location.pathname}${location.search}${location.hash}`,
        },
      });
    }
    closeMenu();
  };

  useContextBackHandler(isVisible, closeMenu, 'action-menu');

  return (
    <>
      {isVisible && (
        <div
          className={`action-menu-overlay ${isOpen ? 'active' : ''}`}
          data-menu-state={isOpen ? 'open' : 'closed'}
          data-overlay-motion={isOpen ? 'entered' : 'exiting'}
        >
          <CloseButton onClick={closeMenu} disabled={!isCloseEnabled} />

          <button
            className="settings-button"
            onClick={() => handleNavigation('/settings')}
          >
            <span className="settings-text">Settings</span>
            <img
              className="settings-icon"
              src="/images/btn_settings.png"
              alt="Settings Icon"
            />
          </button>

          <div className="theme-toggle">
            <div className="theme-toggle-container">
              <ThemeSwitch />
            </div>
          </div>

          <div className="auth-button-container">
            {isLoggedIn ? (
              <button
                className="auth-button"
                type="button"
                onClick={() => handleNavigation('/profile')}
              >
                <span className="auth-button-text">Profile</span>
                <span className="auth-button-icon-wrap">
                  <img
                    className="auth-button-icon"
                    src="/images/profile-icon.png"
                    alt=""
                  />
                  {pendingFriendCount > 0 ? (
                    <span className="action-menu-notification">
                      {pendingFriendCount > 9 ? '9+' : pendingFriendCount}
                    </span>
                  ) : null}
                </span>
              </button>
            ) : (
              <div className="auth-button-stacked">
                <button
                  className="auth-button"
                  type="button"
                  onClick={() => handleNavigation('/register')}
                >
                  <span className="auth-button-text">Register</span>
                  <img
                    className="auth-button-icon"
                    src="/images/register-icon.png"
                    alt="Register"
                  />
                </button>
                <button
                  className="auth-button"
                  type="button"
                  onClick={() => handleNavigation('/login')}
                >
                  <span className="auth-button-text">Login</span>
                  <img
                    className="auth-button-icon"
                    src="/images/login-icon.png"
                    alt="Log In"
                  />
                </button>
              </div>
            )}
          </div>

          <div className={`action-menu-buttons-container ${isOpen ? 'open' : ''}`}>
            <button
              className="action-menu-item button-raid"
              onClick={() => handleNavigation('/raid')}
            >
              <div className="button-content">
                <img src="/images/btn_raid.png" alt="" className="button-icon" />
                <span className="button-label">Raid</span>
              </div>
            </button>

            <button
              className="action-menu-item button-search"
              onClick={() => handleNavigation('/search')}
            >
              <div className="button-content">
                <img src="/images/btn_search.png" alt="" className="button-icon" />
                <span className="button-label">Search</span>
              </div>
            </button>

            <button
              className="action-menu-item button-pokemon"
              onClick={() => handleNavigation('/pokemon')}
            >
              <div className="button-content">
                <img src="/images/btn_pokemon.png" alt="" className="button-icon" />
                <span className="button-label">Pokémon</span>
              </div>
            </button>

            <button
              className="action-menu-item button-pokedex"
              onClick={() => handleNavigation('/pokedex')}
            >
              <div className="button-content">
                <img src="/images/btn_pokedex.png" alt="" className="button-icon" />
                <span className="button-label">Pokedex</span>
              </div>
            </button>

            <button
              className="action-menu-item button-home"
              onClick={() => handleNavigation('/')}
            >
              <div className="button-content">
                <img src="/images/btn_home.png" alt="" className="button-icon" />
                <span className="button-label">Home</span>
              </div>
            </button>

            <button
              className="action-menu-item button-pvp"
              onClick={() => handleNavigation('/pvp')}
            >
              <div className="button-content">
                <img src="/images/btn_pvp.png" alt="" className="button-icon" />
                <span className="button-label">PvP</span>
              </div>
            </button>

            <button
              className="action-menu-item button-trades"
              onClick={() => handleNavigation('/trades')}
            >
              <div className="button-content">
                <img src="/images/btn_trades.png" alt="" className="button-icon" />
                <span className="button-label">Trades</span>
              </div>
            </button>

            <button
              className="action-menu-item button-rankings"
              onClick={() => handleNavigation('/rankings')}
            >
              <div className="button-content">
                <img src="/images/btn_rankings.png" alt="" className="button-icon" />
                <span className="button-label">Rankings</span>
              </div>
            </button>

            <button
              className="action-menu-item button-max"
              onClick={() => handleNavigation('/max')}
            >
              <div className="button-content">
                <img src="/images/btn_max.png" alt="" className="button-icon" />
                <span className="button-label">Max Battles</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {!isVisible && <ActionMenuButton onClick={toggleMenu} />}
    </>
  );
};

export default ActionMenu;
