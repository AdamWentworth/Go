// HomeHeader.jsx

import React from 'react';
import AuthButtons from '../../components/AuthButtons';
import './HomeHeader.css';

const HomeHeader = ({ logoUrl, isLoggedIn }) => {
  return (
    <header className="homeHeader framed-section">
      <div className="logoContainer">
        <img src={logoUrl} alt="Logo" onContextMenu={(e) => e.preventDefault()} />
      </div>
      <div className="titleContainer">
        <h1>Welcome to Pokémon Go Nexus</h1>
        <h2>The Ultimate Trainer Hub</h2>
        <p>
          The go-to platform for Pokémon GO trainers to{' '}
          <strong>catalog Pokémon, showcase rare catches, and connect with players worldwide for seamless trades.</strong>{' '}
          Discover, list, and connect with trainers for smooth trading.
        </p>
        {!isLoggedIn && <AuthButtons />}
      </div>
    </header>
  );
};

export default HomeHeader;
