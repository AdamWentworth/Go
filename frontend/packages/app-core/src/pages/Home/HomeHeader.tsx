// HomeHeader.jsx

import { FaArrowDown, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router';
import './HomeHeader.css';

interface HomeHeaderProps {
  logoUrl: string;
  isLoggedIn: boolean;
}

const HomeHeader = ({ logoUrl, isLoggedIn }: HomeHeaderProps) => {
  return (
    <header className="homeHeader">
      <nav className="homeHeader__nav" aria-label="Home navigation">
        <Link className="home-brand" to="/">
          <img src={logoUrl} alt="" onContextMenu={(event) => event.preventDefault()} />
          <span>PokeGo Nexus</span>
        </Link>
        {!isLoggedIn ? (
          <div>
            <Link className="homeHeader__login" to="/login">Log in</Link>
            <Link className="homeHeader__register" to="/register">Create account</Link>
          </div>
        ) : null}
      </nav>

      <div className="homeHeader__hero home-shell">
        <div className="homeHeader__copy">
          <span className="home-eyebrow">New to PokeGo Nexus?</span>
          <h1>Start with your collection.<br /><em>We’ll guide the rest.</em></h1>
          <p>
            Learn the workflow one step at a time: record what you have, mark what you want,
            find compatible trainers, and send a clear trade proposal.
          </p>
          {!isLoggedIn ? (
            <div className="homeHeader__actions">
              <a className="home-primary-action" href="#start-here">Show me how <FaArrowDown aria-hidden="true" /></a>
              <Link className="home-secondary-action" to="/getting-started">Open the full guide <FaArrowRight aria-hidden="true" /></Link>
            </div>
          ) : null}
          <ul className="homeHeader__proof" aria-label="Available features">
            <li><FaCheckCircle aria-hidden="true" /> Free to use</li>
            <li><FaCheckCircle aria-hidden="true" /> Mobile ready</li>
            <li><FaCheckCircle aria-hidden="true" /> Learn before signing up</li>
          </ul>
        </div>

        <div className="homeHeader__showcase" aria-label="PokeGo Nexus feature preview">
          <div className="homeHeader__showcase-glow" aria-hidden="true" />
          <div className="homeHeader__showcase-card homeHeader__showcase-card--collection">
            <span>Step 1 · Collection</span>
            <strong>Begin with Pokémon you already know</strong>
            <div className="homeHeader__pokemon-row" aria-hidden="true">
              <img src="/images/default/pokemon_1.png" alt="" />
              <img src="/images/default/pokemon_6.png" alt="" />
              <img src="/images/default/pokemon_25.png" alt="" />
            </div>
          </div>
          <div className="homeHeader__showcase-card homeHeader__showcase-card--trade">
            <img src="/images/btn_trades.png" alt="" />
            <span><strong>Then mark your intent</strong><small>For Trade and Wanted listings power the matching workflow.</small></span>
          </div>
          <div className="homeHeader__showcase-card homeHeader__showcase-card--share">
            <span>Your destination</span>
            <strong>A clear, reviewable trade proposal.</strong>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
