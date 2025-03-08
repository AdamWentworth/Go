// Home.jsx

import React from 'react';
import Navbar from '../../components/Navbar';
import ActionMenu from '../../components/ActionMenu';
import HomeHeader from './HomeHeader';
import HowItWorks from './HowItWorks';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const logoUrl = process.env.PUBLIC_URL + '/images/logo/logo.png';
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
