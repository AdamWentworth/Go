// src/pages/Trades.jsx
import React, { useState } from 'react';

import { useTradeStore } from '@/features/trades/store/useTradeStore';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore.js';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore.js';
import { useTagsStore } from '@/features/tags/store/useTagsStore.js';

import TradeStatusButtons from './TradeStatusButtons.jsx';
import TradeList          from './TradeList.jsx';
import ActionMenu         from '../../components/ActionMenu.jsx';

import './TradeStatusButtons.css';

function Trades() {
  /* ------------ global data ------------ */
  const trades = useTradeStore((s) => s.trades);
  const relatedInstances = useTradeStore((s) => s.relatedInstances);

  const variants = useVariantsStore((s) => s.variants);
  const variantsLoading = useVariantsStore((s) => s.variantsLoading);
  const ownershipData = useInstancesStore((s) => s.instances);
  const setOwnershipData = useInstancesStore((s) => s.setInstances);
  const periodicUpdates = useInstancesStore((s) => s.periodicUpdates);

  const { tags: lists } = useTagsStore();

  /* ------------ local ui state ------------ */
  const [selectedStatus, setSelectedStatus] = useState('Pending');
  const loading = variantsLoading;        // extend with ownershipLoading if desired

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

        /* props that TradeList already expects */
        setOwnershipData={setOwnershipData}
        variants={variants}
        ownershipData={ownershipData}
        lists={lists}
        loading={loading}
        periodicUpdates={periodicUpdates}
      />

      <ActionMenu />
    </div>
  );
}

export default Trades;
