// HomeHeader.jsx

import { FaArrowDown, FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router';

import PokemonArtwork from '@/components/pokemonComponents/PokemonArtwork';

import './HomeHeader.css';

interface HomeHeaderProps {
  logoUrl: string;
  isLoggedIn: boolean;
}

const HomeHeader = ({ logoUrl, isLoggedIn }: HomeHeaderProps) => {
  const handleShowGuide = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const guide = document.getElementById('start-here');
    if (!guide) return;

    const prefersReducedMotion =
      document.documentElement.dataset.reducedMotion === 'true' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    guide.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    window.history.replaceState(null, '', '#start-here');
  };

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
              <a className="home-primary-action" href="#start-here" onClick={handleShowGuide}>Show me how <FaArrowDown aria-hidden="true" /></a>
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
              <PokemonArtwork
                alt=""
                className="homeHeader__showcase-artwork"
                gigantamax
                imageUrl="/images/shiny_gigantamax/shiny_gigantamax_6.png"
              />
              <PokemonArtwork
                alt=""
                className="homeHeader__showcase-artwork"
                imageUrl="/images/costumes_shiny/pokemon_25_detective_shiny.png"
              />
              <PokemonArtwork
                alt=""
                className="homeHeader__showcase-artwork"
                imageUrl="/images/shiny_shadow/shiny_shadow_pokemon_376.png"
              />
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
