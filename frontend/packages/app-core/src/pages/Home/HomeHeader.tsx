// HomeHeader.jsx

import { FaArrowRight, FaCheckCircle } from 'react-icons/fa';
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
          <span className="home-eyebrow">Your Pokémon GO trainer hub</span>
          <h1>Your collection.<br /><em>Better connected.</em></h1>
          <p>
            Catalog the Pokémon you own, organize what you want, discover nearby trainers,
            and turn compatible listings into clear, secure trade proposals.
          </p>
          {!isLoggedIn ? (
            <div className="homeHeader__actions">
              <Link className="home-primary-action" to="/register">Build your collection <FaArrowRight aria-hidden="true" /></Link>
              <Link className="home-secondary-action" to="/search">Explore search</Link>
            </div>
          ) : null}
          <ul className="homeHeader__proof" aria-label="Available features">
            <li><FaCheckCircle aria-hidden="true" /> Free to use</li>
            <li><FaCheckCircle aria-hidden="true" /> Mobile ready</li>
            <li><FaCheckCircle aria-hidden="true" /> Your listings, your privacy</li>
          </ul>
        </div>

        <div className="homeHeader__showcase" aria-label="PokeGo Nexus feature preview">
          <div className="homeHeader__showcase-glow" aria-hidden="true" />
          <div className="homeHeader__showcase-card homeHeader__showcase-card--collection">
            <span>Collection</span>
            <strong>Keep every catch organized</strong>
            <div className="homeHeader__pokemon-row" aria-hidden="true">
              <img src="/images/default/pokemon_1.png" alt="" />
              <img src="/images/default/pokemon_6.png" alt="" />
              <img src="/images/default/pokemon_25.png" alt="" />
            </div>
          </div>
          <div className="homeHeader__showcase-card homeHeader__showcase-card--trade">
            <img src="/images/btn_trades.png" alt="" />
            <span><strong>Trade-ready</strong><small>Match what you have with what trainers want.</small></span>
          </div>
          <div className="homeHeader__showcase-card homeHeader__showcase-card--share">
            <span>Share Trade Board</span>
            <strong>One link. Your offers and wishlist.</strong>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
