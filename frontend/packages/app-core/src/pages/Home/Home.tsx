// Home.jsx

import React, { useMemo } from 'react';
import { Link } from 'react-router';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import HomeHeader from './HomeHeader';
import HowItWorks from './HowItWorks';
import './Home.css';

const HomeDashboard = () => {
  const instances = useInstancesStore((state) => state.instances);
  const trades = useTradeStore((state) => state.trades);

  const summary = useMemo(() => {
    const values = Object.values(instances ?? {});
    const tradeValues = Object.values(trades ?? {});
    return {
      caught: values.filter((instance) => instance.is_caught).length,
      wanted: values.filter((instance) => instance.is_wanted).length,
      forTrade: values.filter((instance) => instance.is_for_trade).length,
      needsResponse: tradeValues.filter((trade) =>
        String(trade.trade_status).toLowerCase() === 'proposed',
      ).length,
      pending: tradeValues.filter((trade) =>
        String(trade.trade_status).toLowerCase() === 'pending',
      ).length,
    };
  }, [instances, trades]);

  return (
    <main className="home-dashboard">
      <section className="home-dashboard-hero">
        <div>
          <p>Your trainer dashboard</p>
          <h1>Welcome back</h1>
          <span>Pick up where you left off or find your next reciprocal trade.</span>
        </div>
        <Link className="home-primary-link" to="/trades?section=matches">Find trade matches</Link>
      </section>

      <section className="home-stat-grid" aria-label="Collection summary">
        <Link to="/pokemon"><strong>{summary.caught}</strong><span>Caught</span></Link>
        <Link to="/pokemon"><strong>{summary.wanted}</strong><span>Wanted</span></Link>
        <Link to="/pokemon"><strong>{summary.forTrade}</strong><span>For trade</span></Link>
      </section>

      <section className="home-dashboard-grid">
        <article className="home-action-card">
          <div>
            <p>Trades needing attention</p>
            <strong>{summary.needsResponse + summary.pending}</strong>
          </div>
          <span>
            {summary.needsResponse
              ? `${summary.needsResponse} offer${summary.needsResponse === 1 ? '' : 's'} waiting for you.`
              : summary.pending
                ? `${summary.pending} accepted trade${summary.pending === 1 ? '' : 's'} awaiting confirmation.`
                : 'You are all caught up.'}
          </span>
          <Link to="/trades?section=active">Review active trades</Link>
        </article>

        <article className="home-action-card">
          <div><p>Discover the community</p><strong>Search</strong></div>
          <span>Find trainers, wanted Pokémon, and Pokémon currently available for trade.</span>
          <Link to="/search?mode=pokemon">Explore Pokémon</Link>
        </article>

        <article className="home-action-card">
          <div><p>Keep matches accurate</p><strong>Catalog</strong></div>
          <span>Update Wanted and For Trade preferences as your collection changes.</span>
          <Link to="/pokemon">Manage collection</Link>
        </article>
      </section>
    </main>
  );
};

const Home = () => {
  const logoUrl = '/images/logo/logo.png';
  const { isLoggedIn } = useAuth();

  return (
    <div className="home-page">
      <Navbar />
      {isLoggedIn ? (
        <HomeDashboard />
      ) : (
        <>
          <HomeHeader logoUrl={logoUrl} isLoggedIn={false} />
          <HowItWorks />
        </>
      )}
    </div>
  );
};

export default Home;
