// HowItWorks.jsx

import React from 'react';
import NavigationSection from './HowItWorks/NavigationSection';
import SecondarySection from './/HowItWorks/SecondarySection';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <section className="howItWorks">
      <h2>How It Works</h2>
      <NavigationSection />
      <SecondarySection />
    </section>
  );
};

export default HowItWorks;
