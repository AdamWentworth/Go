import { useMemo } from 'react';
import { FaArrowLeft, FaArrowRight, FaExternalLinkAlt } from 'react-icons/fa';
import { Link, Navigate, useLocation } from 'react-router';

import LoadingSpinner from '@/components/LoadingSpinner';
import TradeBoardComposer from '@/features/tradeBoard/components/TradeBoardComposer';
import { tradeBoardPath } from '@/features/tradeBoard/model/tradeBoardUrl';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { initializePokemonTags } from '@/features/tags/utils/initializePokemonTags';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { useAuth } from '@/contexts/AuthContext';
import type { TagBuckets } from '@/types/tags';

import './TradeBoardBuilderPage.css';

const TradeBoardBuilderPage = () => {
  const location = useLocation();
  const { isLoading: authLoading, isLoggedIn, user } = useAuth();
  const instances = useInstancesStore((state) => state.instances);
  const instancesLoading = useInstancesStore((state) => state.instancesLoading);
  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);

  const tags = useMemo(
    () => initializePokemonTags(instances, variants),
    [instances, variants],
  );
  const boardTags = useMemo<Pick<TagBuckets, 'trade' | 'wanted'>>(() => ({
    trade: Object.fromEntries(
      Object.entries(tags.caught).filter(([, item]) => item.is_for_trade),
    ),
    wanted: tags.wanted,
  }), [tags]);
  const tradeCount = Object.keys(boardTags.trade).length;
  const wantedCount = Object.keys(boardTags.wanted).length;
  const hasListings = tradeCount > 0 || wantedCount > 0;
  const loading = authLoading || variantsLoading || instancesLoading;

  if (loading) {
    return (
      <main className="trade-board-builder-page">
        <section className="trade-board-builder-page__state" aria-live="polite">
          <LoadingSpinner />
          <h1>Preparing your Trade Board</h1>
          <p>Gathering your current For Trade and Wanted listings…</p>
        </section>
      </main>
    );
  }

  if (!isLoggedIn || !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return (
    <main className="trade-board-builder-page">
      <nav aria-label="Trade Board navigation" className="trade-board-builder-page__nav">
        <Link to="/trades"><FaArrowLeft aria-hidden="true" /> Trades</Link>
        {hasListings ? (
          <Link to={tradeBoardPath(user.username)}>
            View live board <FaExternalLinkAlt aria-hidden="true" />
          </Link>
        ) : null}
      </nav>

      {hasListings ? (
        <TradeBoardComposer activeTags={boardTags} presentation="page" variants={variants} />
      ) : (
        <section className="trade-board-builder-page__empty">
          <span>Share your collection</span>
          <h1>Your Trade Board needs a listing</h1>
          <p>
            Mark at least one Pokémon as For Trade or Wanted. Your board will then stay
            synchronized with those listings automatically.
          </p>
          <div>
            <Link className="trade-board-builder-page__primary" to="/pokemon">
              Add Pokémon listings <FaArrowRight aria-hidden="true" />
            </Link>
            <Link to="/trades?section=preferences">Review trade preferences</Link>
          </div>
        </section>
      )}
    </main>
  );
};

export default TradeBoardBuilderPage;
