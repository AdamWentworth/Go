import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import TradeList from '@/pages/Trades/TradeList';
import TradeStatusButtons from '@/pages/Trades/TradeStatusButtons';
import TradeTargetsWorkspace from '@/pages/Trades/TradeTargetsWorkspace';
import type { TradeStatusFilter } from '@/pages/Trades/types';
import { getStoredUsername } from '@/utils/storage';

import './TradeStatusButtons.css';
import './TradeActivity.css';

function Trades() {
  const [searchParams, setSearchParams] = useSearchParams();
  const trades = useTradeStore((state) => state.trades);
  const relatedInstances = useTradeStore((state) => state.relatedInstances);

  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);

  const instances = useInstancesStore((state) => state.instances);
  const setInstances = useInstancesStore((state) => state.applyAuthoritativeInstanceChanges);
  const periodicUpdates = useInstancesStore((state) => state.periodicUpdates);

  const activeSection =
    searchParams.get('section') === 'activity' ? 'activity' : 'preferences';
  const [selectedStatus, setSelectedStatus] = useState<TradeStatusFilter>('Accepting');
  const loading = variantsLoading;
  const currentUsername = getStoredUsername() ?? '';
  const setActiveSection = (section: 'activity' | 'preferences') => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('section', section);
      if (section === 'activity') {
        next.delete('mode');
        next.delete('instance');
      }
      return next;
    });
  };
  const activityCounts = useMemo(() => {
    const counts: Record<TradeStatusFilter, number> = {
      Accepting: 0,
      Proposed: 0,
      Pending: 0,
      Completed: 0,
      Cancelled: 0,
    };
    Object.values(trades ?? {}).forEach((trade) => {
      const status = String(trade.trade_status ?? '').toLowerCase();
      if (status === 'proposed') {
        if (trade.username_accepting === currentUsername) counts.Accepting += 1;
        if (trade.username_proposed === currentUsername) counts.Proposed += 1;
      } else if (status === 'pending') counts.Pending += 1;
      else if (status === 'completed') counts.Completed += 1;
      else if (status === 'cancelled' || status === 'denied') counts.Cancelled += 1;
    });
    return counts;
  }, [currentUsername, trades]);

  return (
    <div className="trades-container">
      <nav className="trade-page-sections" aria-label="Trade sections">
        <button
          type="button"
          className={`trade-page-section ${activeSection === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveSection('preferences')}
        >
          Trade Preferences
        </button>
        <button
          type="button"
          className={`trade-page-section ${activeSection === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveSection('activity')}
        >
          Trade Activity
        </button>
      </nav>

      {activeSection === 'preferences' ? (
        <TradeTargetsWorkspace />
      ) : (
        <section className="trade-activity-workspace" aria-labelledby="trade-activity-heading">
          <header className="trade-activity-heading">
            <div>
              <h1 id="trade-activity-heading">Your trades</h1>
              <p>Respond to offers, track active trades, and revisit past exchanges.</p>
            </div>
          </header>
          <TradeStatusButtons
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            counts={activityCounts}
          />
          <TradeList
            trades={trades}
            relatedInstances={relatedInstances}
            selectedStatus={selectedStatus}
            setInstances={setInstances}
            variants={variants}
            instances={instances}
            loading={loading}
            periodicUpdates={periodicUpdates}
          />
        </section>
      )}
    </div>
  );
}

export default Trades;
