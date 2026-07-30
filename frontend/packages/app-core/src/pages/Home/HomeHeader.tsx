// HomeHeader.jsx

import React from 'react';
import AuthButtons from '@/components/AuthButtons';
import './HomeHeader.css';

interface HomeHeaderProps {
  logoUrl: string;
  isLoggedIn: boolean;
}

const HomeHeader = ({ logoUrl, isLoggedIn }: HomeHeaderProps) => {
  return (
    <header className="homeHeader framed-section">
      <div className="logoContainer">
        <img src={logoUrl} alt="Logo" onContextMenu={(e) => e.preventDefault()} />
      </div>
      <div className="titleContainer">
        <h1>Your Pokémon GO collection, connected</h1>
        <h2>Catalog. Discover. Match. Trade.</h2>
        <p>
          Keep a detailed catalog, publish what you want and what you can offer,
          and <strong>find reciprocal matches with eligible trainers.</strong>
        </p>
        {!isLoggedIn && <AuthButtons />}
      </div>
    </header>
  );
};

export default HomeHeader;
