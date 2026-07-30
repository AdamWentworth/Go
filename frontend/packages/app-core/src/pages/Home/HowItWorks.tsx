import React from 'react';
import { Link } from 'react-router';
import './HowItWorks.css';

const features = [
  {
    step: '01',
    title: 'Build your catalog',
    copy: 'Track caught Pokémon, variants, favorites, detailed stats, Wanted entries, and Pokémon available for trade.',
  },
  {
    step: '02',
    title: 'Discover the community',
    copy: 'Search eligible trainers and browse the Pokémon they have caught, want, or currently offer.',
  },
  {
    step: '03',
    title: 'Find reciprocal matches',
    copy: 'See where both trainers have something the other wants, then send a server-validated proposal.',
  },
];

const HowItWorks = () => (
  <main className="howItWorks">
    <header>
      <p>How it works</p>
      <h2>From collection to confident trade</h2>
    </header>
    <div className="home-feature-grid">
      {features.map((feature) => (
        <article key={feature.step}>
          <span>{feature.step}</span>
          <h3>{feature.title}</h3>
          <p>{feature.copy}</p>
        </article>
      ))}
    </div>
    <div className="home-feature-cta">
      <div>
        <strong>Ready to connect your collection?</strong>
        <span>Create an account or sign in with email, Google, Discord, or Facebook.</span>
      </div>
      <Link to="/register">Create your account</Link>
    </div>
  </main>
);

export default HowItWorks;
