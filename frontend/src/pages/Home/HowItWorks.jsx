// HowItWorks.jsx

import React from 'react';
import NavigationSection from './HowItWorks/NavigationSection.jsx';
import PokemonSection from './HowItWorks/PokemonSection.jsx';
import SearchSection from './HowItWorks/SearchSection.jsx';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <section className="howItWorks">
      <h2>How It Works</h2>
      <NavigationSection />
      <div className="section-divider" />
      <PokemonSection />
      <div className="section-divider" />
      <SearchSection />
    </section>
  );
};

export default HowItWorks;
