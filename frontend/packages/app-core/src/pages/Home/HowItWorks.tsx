import type { IconType } from 'react-icons';
import {
  FaArrowRight,
  FaBookOpen,
  FaExchangeAlt,
  FaSearch,
  FaShareAlt,
  FaTags,
  FaUserFriends,
} from 'react-icons/fa';
import { Link } from 'react-router';

import PokemonArtwork from '@/components/pokemonComponents/PokemonArtwork';

import './HowItWorks.css';

interface FeatureLink {
  title: string;
  description: string;
  href: string;
  image?: string;
  icon?: IconType;
  tone: string;
}

const CORE_FEATURES: FeatureLink[] = [
  {
    title: 'Pokémon collection',
    description: 'Catalog exact variants, showcase rare catches, and organize everything with flexible tags.',
    href: '/pokemon',
    image: '/images/btn_pokemon.png',
    tone: 'collection',
  },
  {
    title: 'Search & discovery',
    description: 'Find Pokémon listings or trainers nearby, with detailed filters that reflect what matters to you.',
    href: '/search',
    image: '/images/btn_search.png',
    tone: 'search',
  },
  {
    title: 'Trades',
    description: 'Set per-Pokémon preferences, propose an exchange, and follow every trade from offer to completion.',
    href: '/trades',
    image: '/images/btn_trades.png',
    tone: 'trades',
  },
  {
    title: 'Friends',
    description: 'Build your trainer network while keeping collection visibility and personal details under your control.',
    href: '/friends',
    icon: FaUserFriends,
    tone: 'friends',
  },
];

const TRAINER_TOOLS: FeatureLink[] = [
  { title: 'Pokédex', description: 'Explore species and variants.', href: '/pokedex', image: '/images/btn_pokedex.png', tone: 'pokedex' },
  { title: 'Raids', description: 'Build effective raid teams.', href: '/raid', image: '/images/btn_raid.png', tone: 'raid' },
  { title: 'PvP', description: 'Explore leagues and matchups.', href: '/pvp', image: '/images/btn_pvp.png', tone: 'pvp' },
  { title: 'Max Battles', description: 'Plan for Dynamax encounters.', href: '/max', image: '/images/btn_max.png', tone: 'max' },
  { title: 'Rankings', description: 'Compare Pokémon performance.', href: '/rankings', image: '/images/btn_rankings.png', tone: 'rankings' },
  { title: 'Trade Board', description: 'Share a visual trade list anywhere.', href: '/trade-board', icon: FaShareAlt, tone: 'board' },
];

const HowItWorks = () => {
  return (
    <main className="howItWorks home-shell">
      <section className="howItWorks__trade-story" id="trade-matching" aria-labelledby="home-trade-title">
        <div className="howItWorks__section-heading">
          <span className="home-eyebrow">Trading, without the guesswork</span>
          <h2 id="home-trade-title">The trade is the destination.<br />Your collection makes it possible.</h2>
          <p>
            PokeGo Nexus connects the pieces that usually live in screenshots, chat messages, and memory.
            Your collection, wishlist, and trade preferences work together to surface useful matches.
          </p>
        </div>

        <div className="howItWorks__trade-steps">
          <article>
            <span className="howItWorks__step-number">01</span>
            <div className="howItWorks__step-visual howItWorks__step-visual--collection" aria-hidden="true">
              <PokemonArtwork alt="" className="howItWorks__step-pokemon" gigantamax imageUrl="/images/shiny_gigantamax/shiny_gigantamax_6.png" />
              <FaTags />
            </div>
            <h3>Catalog what you have</h3>
            <p>Record exact catches, organize them your way, and mark the Pokémon you are ready to trade.</p>
          </article>
          <article>
            <span className="howItWorks__step-number">02</span>
            <div className="howItWorks__step-visual howItWorks__step-visual--match" aria-hidden="true">
              <PokemonArtwork alt="" className="howItWorks__step-pokemon" gigantamax imageUrl="/images/shiny_gigantamax/shiny_gigantamax_6.png" />
              <FaSearch />
              <PokemonArtwork alt="" className="howItWorks__step-pokemon" imageUrl="/images/costumes_shiny/pokemon_25_detective_shiny.png" />
            </div>
            <h3>Find a real match</h3>
            <p>Search listings and see when what you offer lines up with what another trainer actually wants.</p>
          </article>
          <article>
            <span className="howItWorks__step-number">03</span>
            <div className="howItWorks__step-visual howItWorks__step-visual--proposal" aria-hidden="true">
              <PokemonArtwork alt="" className="howItWorks__step-pokemon" gigantamax imageUrl="/images/shiny_gigantamax/shiny_gigantamax_6.png" />
              <FaExchangeAlt />
              <PokemonArtwork alt="" className="howItWorks__step-pokemon" imageUrl="/images/costumes_shiny/pokemon_25_detective_shiny.png" />
            </div>
            <h3>Propose with confidence</h3>
            <p>Review both Pokémon, trade eligibility, friendship, and Stardust cost before either trainer commits.</p>
          </article>
        </div>

        <Link className="howItWorks__guide-link" to="/getting-started">
          <FaBookOpen aria-hidden="true" /> New here? Open the complete illustrated guide <FaArrowRight aria-hidden="true" />
        </Link>
      </section>

      <section className="howItWorks__directory" id="feature-directory" aria-labelledby="feature-directory-title">
        <div className="howItWorks__section-heading">
          <span className="home-eyebrow">Everything in one trainer hub</span>
          <h2 id="feature-directory-title">Explore PokeGo Nexus</h2>
          <p>Trading is the heart of the platform, supported by the collection, discovery, social, and battle tools around it.</p>
        </div>

        <div className="howItWorks__core-grid">
          {CORE_FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} className={`howItWorks__feature-card is-${feature.tone}`} to={feature.href}>
                <span className="howItWorks__feature-icon" aria-hidden="true">
                  {feature.image ? <img src={feature.image} alt="" /> : Icon ? <Icon /> : null}
                </span>
                <span><strong>{feature.title}</strong><small>{feature.description}</small></span>
                <FaArrowRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>

        <div className="howItWorks__tools-heading">
          <h3>Trainer tools</h3>
          <p>Jump directly to the reference and planning tools you need.</p>
        </div>
        <div className="howItWorks__tools-grid">
          {TRAINER_TOOLS.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} className={`howItWorks__tool-card is-${feature.tone}`} to={feature.href}>
                <span aria-hidden="true">{feature.image ? <img src={feature.image} alt="" /> : Icon ? <Icon /> : null}</span>
                <span><strong>{feature.title}</strong><small>{feature.description}</small></span>
                <FaArrowRight aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

    </main>
  );
};

export default HowItWorks;
