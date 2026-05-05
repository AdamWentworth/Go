import React from 'react';

import { resolveTradeTargetsPanelCopy } from './tradeTargetsPanelState';

type TradeTargetsIntroProps = {
  isMirror: boolean;
};

export const TradeTargetsIntro: React.FC<TradeTargetsIntroProps> = ({ isMirror }) => {
  const copy = resolveTradeTargetsPanelCopy(isMirror);

  return (
    <div className="trade-details-container__intro">
      <div className="trade-details-container__eyebrow">{copy.eyebrow}</div>
      <h2>{copy.title}</h2>
      <p>{copy.description}</p>
    </div>
  );
};

type TradeTargetsWantedPanelProps = {
  isMirror: boolean;
  isEditable: boolean;
  editMode: boolean;
  visibleCount: number;
  onResetFilters: () => void;
  children: React.ReactNode;
};

export const TradeTargetsWantedPanel: React.FC<TradeTargetsWantedPanelProps> = ({
  isMirror,
  isEditable,
  editMode,
  visibleCount,
  onResetFilters,
  children,
}) => {
  const copy = resolveTradeTargetsPanelCopy(isMirror);
  const showResetFilters = !isMirror && isEditable;

  return (
    <div className="trade-details-container__wanted-panel">
      <div className="trade-details-container__wanted-header">
        <div>
          <h3>{copy.listTitle}</h3>
          <span>{visibleCount} visible</span>
        </div>
        {showResetFilters && (
          <button
            type="button"
            className={`trade-target-reset-button ${editMode ? 'editable' : ''}`}
            onClick={editMode ? onResetFilters : undefined}
          >
            <img src="/images/reset.png" alt="Reset Filters" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
};
