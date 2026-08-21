// HowItWorks.jsx

import {
  FaArrowRight,
  FaExchangeAlt,
  FaSearch,
  FaShareAlt,
  FaTags,
} from 'react-icons/fa';
import { Link } from 'react-router';
import './HowItWorks.css';

const HowItWorks = () => {
  return (
    <div className="howItWorks home-shell">
      <section className="howItWorks__intro" aria-labelledby="home-workflow-title">
        <span className="home-eyebrow">One connected workflow</span>
        <h2 id="home-workflow-title">From catalog to completed trade</h2>
        <p>Each part of PokeGo Nexus is built around a real trainer task, without burying the workflow in social noise.</p>
        <div className="howItWorks__steps">
          <article><span>01</span><FaTags aria-hidden="true" /><h3>Catalog and organize</h3><p>Record caught Pokémon, favorites, trade listings, wanted entries, and your own custom tags.</p></article>
          <article><span>02</span><FaSearch aria-hidden="true" /><h3>Find the right trainer</h3><p>Search exact Pokémon variants or trainers, then inspect their public collection and compatible listings.</p></article>
          <article><span>03</span><FaExchangeAlt aria-hidden="true" /><h3>Propose with confidence</h3><p>Review both Pokémon, friendship level, trade conditions, and Stardust cost before sending.</p></article>
          <article><span>04</span><FaShareAlt aria-hidden="true" /><h3>Share beyond the app</h3><p>Publish a live Trade Board or export a polished image for the communities where you already trade.</p></article>
        </div>
      </section>

      <section className="howItWorks__feature-band" aria-labelledby="home-real-features-title">
        <div>
          <span className="home-eyebrow">Built for collectors</span>
          <h2 id="home-real-features-title">Detailed when it matters. Simple when it doesn’t.</h2>
          <p>Track forms, costumes, shiny and shadow states, Max forms, backgrounds, moves, and trade preferences—then progressively reveal those details only when you need them.</p>
          <Link to="/register">Start your collection <FaArrowRight aria-hidden="true" /></Link>
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
        <div><span className="home-eyebrow">Ready when you are</span><h2 id="home-cta-title">Bring your collection together.</h2><p>Start with a few Pokémon or catalog everything. The workflow grows with you.</p></div>
        <div><Link className="home-primary-action" to="/register">Create account <FaArrowRight aria-hidden="true" /></Link><Link className="home-secondary-action" to="/login">I already have an account</Link></div>
      </section>
    </div>
  );
};

export default HowItWorks;
