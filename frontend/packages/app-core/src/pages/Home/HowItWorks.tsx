// HowItWorks.jsx

import type { IconType } from 'react-icons';
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

import PokemonArtwork from '@/components/pokemonComponents/PokemonArtwork';

import './HowItWorks.css';

interface StoryPokemon {
  gigantamax?: boolean;
  imageUrl: string;
}

interface HomeGuideStep {
  number: string;
  title: string;
  description: string;
  images: StoryPokemon[];
  visualLabel: string;
  icon: IconType;
  tone: 'caught' | 'wanted' | 'trade' | 'search' | 'proposal' | 'share';
}

const HOME_GUIDE_STEPS: HomeGuideStep[] = [
  {
    number: '01',
    title: 'Add a Pokémon',
    description: 'Find its exact variant, then save it as Caught, For Trade, or Wanted.',
    images: [{ imageUrl: '/images/shiny_gigantamax/shiny_gigantamax_6.png', gigantamax: true }],
    visualLabel: 'Shiny Gigantamax Charizard',
    icon: FaTags,
    tone: 'caught',
  },
  {
    number: '02',
    title: 'Describe what you want',
    description: 'Add a Wanted entry and only specify details—such as form or moves—when they matter.',
    images: [{ imageUrl: '/images/costumes_shiny/pokemon_25_detective_shiny.png' }],
    visualLabel: 'Shiny Detective Pikachu',
    icon: FaHeart,
    tone: 'wanted',
  },
  {
    number: '03',
    title: 'Prepare an offer',
    description: 'List a caught Pokémon For Trade and choose the Wanted targets you would accept.',
    images: [{ imageUrl: '/images/shiny_gigantamax/shiny_gigantamax_6.png', gigantamax: true }],
    visualLabel: 'The same Charizard becomes your offer',
    icon: FaExchangeAlt,
    tone: 'trade',
  },
  {
    number: '04',
    title: 'Discover trainers',
    description: 'Search exact listings or trainer names and inspect the public collection behind a result.',
    images: [{ imageUrl: '/images/costumes_shiny/pokemon_25_detective_shiny.png' }],
    visualLabel: 'Search for the Pikachu you want',
    icon: FaSearch,
    tone: 'search',
  },
  {
    number: '05',
    title: 'Review the exchange',
    description: 'Confirm both Pokémon, friendship level, eligibility, and Stardust cost before proposing.',
    images: [
      { imageUrl: '/images/shiny_gigantamax/shiny_gigantamax_6.png', gigantamax: true },
      { imageUrl: '/images/costumes_shiny/pokemon_25_detective_shiny.png' },
    ],
    visualLabel: 'Your offer ↔ their offer',
    icon: FaExchangeAlt,
    tone: 'proposal',
  },
  {
    number: '06',
    title: 'Share when useful',
    description: 'Create a live Trade Board or image for communities where the other trainer may not use the app yet.',
    images: [
      { imageUrl: '/images/shiny_gigantamax/shiny_gigantamax_6.png', gigantamax: true },
      { imageUrl: '/images/costumes_shiny/pokemon_25_detective_shiny.png' },
    ],
    visualLabel: 'One board, both listings',
    icon: FaShareAlt,
    tone: 'share',
  },
];

const HowItWorks = () => {
  return (
    <div className="howItWorks home-shell" id="start-here">
      <section className="howItWorks__intro" aria-labelledby="home-workflow-title">
        <span className="home-eyebrow">Start here</span>
        <h2 id="home-workflow-title">Follow one Pokémon through the app</h2>
        <p>You do not need to learn every feature at once. These six steps are the shortest path from an empty account to a useful trade.</p>
        <p className="howItWorks__story-note"><strong>Example:</strong> you are offering a Shiny Gigantamax Charizard and looking for a Shiny Detective Pikachu.</p>

        <div className="howItWorks__concepts" aria-label="Collection status guide">
          <article>
            <span className="howItWorks__concept-icon howItWorks__concept-icon--caught" aria-hidden="true">
              <PokemonArtwork alt="" className="howItWorks__concept-artwork" gigantamax imageUrl="/images/shiny_gigantamax/shiny_gigantamax_6.png" />
              <FaCheck />
            </span>
            <div><strong>Caught</strong><small>A Pokémon currently in your collection.</small></div>
          </article>
          <article>
            <span className="howItWorks__concept-icon howItWorks__concept-icon--trade" aria-hidden="true">
              <PokemonArtwork alt="" className="howItWorks__concept-artwork" gigantamax imageUrl="/images/shiny_gigantamax/shiny_gigantamax_6.png" />
              <FaExchangeAlt />
            </span>
            <div><strong>For Trade</strong><small>A caught Pokémon you are willing to offer.</small></div>
          </article>
          <article>
            <span className="howItWorks__concept-icon howItWorks__concept-icon--wanted" aria-hidden="true">
              <PokemonArtwork alt="" className="howItWorks__concept-artwork" imageUrl="/images/costumes_shiny/pokemon_25_detective_shiny.png" />
              <FaHeart />
            </span>
            <div><strong>Wanted</strong><small>A separate wishlist entry describing what you seek.</small></div>
          </article>
        </div>

        <div className="howItWorks__steps">
          {HOME_GUIDE_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.number} className={`is-${step.tone}`}>
                <span>{step.number}</span>
                <div className={`howItWorks__step-art ${step.images.length > 1 ? 'has-pair' : ''}`} aria-hidden="true">
                  <Icon />
                  <div className="howItWorks__story-pokemon">
                    {step.images.map((image, index) => (
                      <PokemonArtwork
                        key={`${image.imageUrl}-${index}`}
                        alt=""
                        className="howItWorks__story-artwork"
                        gigantamax={image.gigantamax}
                        imageUrl={image.imageUrl}
                      />
                    ))}
                  </div>
                  <small>{step.visualLabel}</small>
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            );
          })}
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
