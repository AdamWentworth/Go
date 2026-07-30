import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import TradeList from '@/pages/Trades/TradeList';
import TradeMatches from '@/pages/Trades/components/TradeMatches';
import TradeStatusButtons, {
  type TradeHubSection,
} from '@/pages/Trades/TradeStatusButtons';

import './TradeStatusButtons.css';

const validSections = new Set<TradeHubSection>(['matches', 'active', 'history']);

function Trades() {
  const trades = useTradeStore((state) => state.trades);
  const relatedInstances = useTradeStore((state) => state.relatedInstances);
  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);
  const instances = useInstancesStore((state) => state.instances);
  const setInstances = useInstancesStore((state) => state.applyAuthoritativeInstanceChanges);
  const periodicUpdates = useInstancesStore((state) => state.periodicUpdates);
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedSection = searchParams.get('section') as TradeHubSection | null;
  const [selectedSection, setSelectedSectionState] = useState<TradeHubSection>(
    requestedSection && validSections.has(requestedSection) ? requestedSection : 'matches',
  );

  useEffect(() => {
    if (requestedSection && validSections.has(requestedSection)) {
      setSelectedSectionState(requestedSection);
    }
  }, [requestedSection]);

  const activeCount = useMemo(
    () =>
      Object.values(trades).filter((trade) =>
        ['proposed', 'pending'].includes(String(trade.trade_status).toLowerCase()),
      ).length,
    [trades],
  );

  const setSelectedSection = (section: TradeHubSection) => {
    setSelectedSectionState(section);
    const next = new URLSearchParams(searchParams);
    next.set('section', section);
    if (section !== 'matches') {
      next.delete('source_type');
      next.delete('source_instance_id');
    }
    setSearchParams(next, { replace: true });
  };

  const listProps = {
    trades,
    relatedInstances,
    setInstances,
    variants,
    instances,
    loading: variantsLoading,
    periodicUpdates,
  };

  return (
    <main className="trades-container">
      <header className="trade-hub-header">
        <div>
          <p className="trade-hub-eyebrow">Trade center</p>
          <h1>Make the right trade</h1>
          <p>Find reciprocal matches, respond to offers, and keep track of completed trades.</p>
        </div>
      </header>

      <TradeStatusButtons
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        activeCount={activeCount}
      />

      {selectedSection === 'matches' ? (
        <TradeMatches variants={variants} />
      ) : null}

      {selectedSection === 'active' ? (
        <div className="trade-hub-groups">
          <section>
            <div className="trade-section-heading">
              <div><h2>Needs your response</h2><p>Offers another trainer sent you.</p></div>
            </div>
            <TradeList {...listProps} selectedStatus="Accepting" />
          </section>
          <section>
            <div className="trade-section-heading">
              <div><h2>Waiting for trainer</h2><p>Proposals you have sent.</p></div>
            </div>
            <TradeList {...listProps} selectedStatus="Proposed" />
          </section>
          <section>
            <div className="trade-section-heading">
              <div><h2>Ready to confirm</h2><p>Accepted trades awaiting completion.</p></div>
            </div>
            <TradeList {...listProps} selectedStatus="Pending" />
          </section>
        </div>
      ) : null}

      {selectedSection === 'history' ? (
        <div className="trade-hub-groups">
          <section>
            <div className="trade-section-heading">
              <div><h2>Completed</h2><p>Your successful trade history.</p></div>
            </div>
            <TradeList {...listProps} selectedStatus="Completed" />
          </section>
          <section>
            <div className="trade-section-heading">
              <div><h2>Closed</h2><p>Cancelled and denied trade records.</p></div>
            </div>
            <TradeList {...listProps} selectedStatus="Cancelled" />
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default Trades;
