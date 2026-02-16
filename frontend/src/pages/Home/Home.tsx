// Home.jsx

import React from 'react';
import ActionMenu from '@/components/ActionMenu';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import HomeHeader from './HomeHeader';
import HowItWorks from './HowItWorks';
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
