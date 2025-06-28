// Home.jsx

import React from 'react';
import Navbar from '../../components/Navbar.jsx';
import ActionMenu from '../../components/ActionMenu.jsx';
import HomeHeader from './HomeHeader.jsx';
import HowItWorks from './HowItWorks.jsx';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const logoUrl = '/images/logo/logo.png';
  const { isLoggedIn } = useAuth();

  return (
    <div className="home-page">
      <Navbar />
      <HomeHeader logoUrl={logoUrl} isLoggedIn={isLoggedIn} />
      <ActionMenu />
      <HowItWorks />
    </div>
  );
};

export default Home;
