// Home.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ActionMenu from '../../components/ActionMenu';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Home.css';

const Home = () => {
  const logoUrl = process.env.PUBLIC_URL + '/images/logo/logo.png';

  return (
    <div className="home-page">
      <Navbar />
      <header className="home-header framed-section">
        <div className="logo-container">
          <img src={logoUrl} alt="Logo" onContextMenu={(e) => e.preventDefault()} />
        </div>
        <div className="title-container">
          <h1>Welcome to Pokémon Go Nexus</h1>
            <h2>The Ultimate Trainer Hub</h2>
                <p>The ultimate platform for Pokémon GO players to <strong>catalog your Pokémon, showcase your rarest catches, and connect with trainers worldwide for seamless trade matchmaking!</strong> Discover trainers near you, build your dream wishlist, forge new friendships, and take your trading game to the next level!</p>
        </div>
      </header>

      <ActionMenu />
    </div>
  );
};

export default Home;