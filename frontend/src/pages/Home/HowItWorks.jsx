// HowItWorks.jsx

import React from 'react';
import NavigationSection from './HowItWorks/NavigationSection';
import PokemonSection from './HowItWorks/PokemonSection';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <section className="howItWorks">
      <h2>How It Works</h2>
      <NavigationSection />
      <div className="section-divider" />
      <PokemonSection />
    </section>
  );
};

export default HowItWorks;
