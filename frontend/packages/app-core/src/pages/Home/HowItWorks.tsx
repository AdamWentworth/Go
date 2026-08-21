// HowItWorks.jsx

import {
  FaArrowRight,
  FaCheck,
  FaExchangeAlt,
  FaHeart,
  FaSearch,
  FaShareAlt,
  FaTags,
} from 'react-icons/fa';
import { Link } from 'react-router';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <div className="howItWorks home-shell" id="start-here">
      <section className="howItWorks__intro" aria-labelledby="home-workflow-title">
        <span className="home-eyebrow">Start here</span>
        <h2 id="home-workflow-title">Follow one Pokémon through the app</h2>
        <p>You do not need to learn every feature at once. These six steps are the shortest path from an empty account to a useful trade.</p>

        <div className="howItWorks__concepts" aria-label="Collection status guide">
          <article>
            <span className="howItWorks__concept-icon howItWorks__concept-icon--caught"><FaCheck aria-hidden="true" /></span>
            <div><strong>Caught</strong><small>A Pokémon currently in your collection.</small></div>
          </article>
          <article>
            <span className="howItWorks__concept-icon howItWorks__concept-icon--trade"><FaExchangeAlt aria-hidden="true" /></span>
            <div><strong>For Trade</strong><small>A caught Pokémon you are willing to offer.</small></div>
          </article>
          <article>
            <span className="howItWorks__concept-icon howItWorks__concept-icon--wanted"><FaHeart aria-hidden="true" /></span>
            <div><strong>Wanted</strong><small>A separate wishlist entry describing what you seek.</small></div>
          </article>
        </div>

        <div className="howItWorks__steps">
          <article><span>01</span><FaTags aria-hidden="true" /><h3>Add a Pokémon</h3><p>Find its exact variant, then save it as Caught, For Trade, or Wanted.</p></article>
          <article><span>02</span><FaHeart aria-hidden="true" /><h3>Describe what you want</h3><p>Add a Wanted entry and only specify details—such as form or moves—when they matter.</p></article>
          <article><span>03</span><FaExchangeAlt aria-hidden="true" /><h3>Prepare an offer</h3><p>List a caught Pokémon For Trade and choose the Wanted targets you would accept.</p></article>
          <article><span>04</span><FaSearch aria-hidden="true" /><h3>Discover trainers</h3><p>Search exact listings or trainer names and inspect the public collection behind a result.</p></article>
          <article><span>05</span><FaExchangeAlt aria-hidden="true" /><h3>Review the exchange</h3><p>Confirm both Pokémon, friendship level, eligibility, and Stardust cost before proposing.</p></article>
          <article><span>06</span><FaShareAlt aria-hidden="true" /><h3>Share when useful</h3><p>Create a live Trade Board or image for communities where the other trainer may not use the app yet.</p></article>
        </div>
        <Link className="howItWorks__guide-link" to="/getting-started">
          Continue with the illustrated guide <FaArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className="howItWorks__feature-band" aria-labelledby="home-real-features-title">
        <div>
          <span className="home-eyebrow">Learn at your pace</span>
          <h2 id="home-real-features-title">The details appear when they become relevant.</h2>
          <p>Start with a species and status. Forms, costumes, Max forms, backgrounds, moves, tags, and trade conditions remain available without blocking the basic workflow.</p>
          <Link to="/getting-started">Read the complete walkthrough <FaArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="howItWorks__feature-list">
          <span><strong>Custom tags</strong><small>Organize catches and wishlist entries your way.</small></span>
          <span><strong>Reciprocal matching</strong><small>See where your listings and another trainer’s needs align.</small></span>
          <span><strong>Server-authoritative trades</strong><small>Trade state changes only after the service validates them.</small></span>
          <span><strong>Privacy controls</strong><small>Choose who can view your profile, collection, and trainer details.</small></span>
        </div>
      </section>

      <section className="howItWorks__cta" aria-labelledby="home-cta-title">
        <img src="/images/logo/logo.png" alt="" />
        <div><span className="home-eyebrow">Ready when you are</span><h2 id="home-cta-title">Begin with one Pokémon.</h2><p>Your signed-in Home will guide the next useful step as your collection grows.</p></div>
        <div><Link className="home-primary-action" to="/register">Create account <FaArrowRight aria-hidden="true" /></Link><Link className="home-secondary-action" to="/login">I already have an account</Link></div>
      </section>
    </div>
  );
};

export default HowItWorks;
