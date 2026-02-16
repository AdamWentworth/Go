import { useState } from 'react';

import ActionMenu from '@/components/ActionMenu';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import TradeList from '@/pages/Trades/TradeList';
import TradeStatusButtons from '@/pages/Trades/TradeStatusButtons';
import type { TradeStatusFilter } from '@/pages/Trades/types';

import './TradeStatusButtons.css';

function Trades() {
  const trades = useTradeStore((state) => state.trades);
  const relatedInstances = useTradeStore((state) => state.relatedInstances);

  const variants = useVariantsStore((state) => state.variants);
  const variantsLoading = useVariantsStore((state) => state.variantsLoading);

  const instances = useInstancesStore((state) => state.instances);
  const setInstances = useInstancesStore((state) => state.setInstances);
  const periodicUpdates = useInstancesStore((state) => state.periodicUpdates);

  const [selectedStatus, setSelectedStatus] = useState<TradeStatusFilter>('Pending');
  const loading = variantsLoading;

  return (
    <div className="trades-container">
      <TradeStatusButtons
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
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

      <ActionMenu />
    </div>
  );
}

export default Trades;
