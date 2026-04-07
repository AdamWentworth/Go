import React, { useEffect, useMemo, useRef, useState } from 'react';
import './TradeFilterDropdowns.css';

import TradeFiltersPanel from './TradeFiltersPanel';

type TradeFilterMode = 'exclude' | 'include';

interface TradeFilterDropdownsProps {
  isMirror: boolean;
  editMode: boolean;
  selectedExcludeImages: boolean[];
  selectedIncludeOnlyImages: boolean[];
  toggleExcludeImageSelection: (index: number, editMode: boolean) => void;
  toggleIncludeOnlyImageSelection: (index: number, editMode: boolean) => void;
}

const countActiveFilters = (items: boolean[]): number => items.filter(Boolean).length;

const TradeFilterDropdowns: React.FC<TradeFilterDropdownsProps> = ({
  isMirror,
  editMode,
  selectedExcludeImages,
  selectedIncludeOnlyImages,
  toggleExcludeImageSelection,
  toggleIncludeOnlyImageSelection,
}) => {
  const [openMode, setOpenMode] = useState<TradeFilterMode | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMode) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !rootRef.current.contains(target)) {
        setOpenMode(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [openMode]);

  const excludeCount = useMemo(
    () => countActiveFilters(selectedExcludeImages),
    [selectedExcludeImages],
  );
  const includeCount = useMemo(
    () => countActiveFilters(selectedIncludeOnlyImages),
    [selectedIncludeOnlyImages],
  );

  if (isMirror) {
    return null;
  }

  const handleToggleMode = (mode: TradeFilterMode) => {
    setOpenMode((currentMode) => (currentMode === mode ? null : mode));
  };

  return (
    <div className="trade-filter-dropdowns" ref={rootRef}>
      <div className="trade-filter-dropdowns__triggers">
        <button
          type="button"
          className={`trade-filter-trigger ${openMode === 'exclude' ? 'is-open' : ''}`}
          aria-expanded={openMode === 'exclude'}
          onClick={() => handleToggleMode('exclude')}
        >
          <span>Exclude</span>
          {excludeCount > 0 ? (
            <span className="trade-filter-trigger__count">{excludeCount}</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`trade-filter-trigger ${openMode === 'include' ? 'is-open' : ''}`}
          aria-expanded={openMode === 'include'}
          onClick={() => handleToggleMode('include')}
        >
          <span>Include</span>
          {includeCount > 0 ? (
            <span className="trade-filter-trigger__count">{includeCount}</span>
          ) : null}
        </button>
      </div>

      {openMode ? (
        <div
          className="trade-filter-dropdowns__panel"
          role="dialog"
          aria-label={openMode === 'exclude' ? 'Exclude filters' : 'Include filters'}
        >
          <TradeFiltersPanel
            isMirror={false}
            shouldShowFewLayout={false}
            mode={openMode}
            editMode={editMode}
            selectedExcludeImages={selectedExcludeImages}
            selectedIncludeOnlyImages={selectedIncludeOnlyImages}
            toggleExcludeImageSelection={toggleExcludeImageSelection}
            toggleIncludeOnlyImageSelection={toggleIncludeOnlyImageSelection}
          />
        </div>
      ) : null}
    </div>
  );
};

export default TradeFilterDropdowns;
