import React from 'react';

import FilterImages from '../../FilterImages';
import {
  EXCLUDE_IMAGES_wanted,
  EXCLUDE_IMAGES_trade,
  FILTER_NAMES,
  FILTER_NAMES_TRADE,
  INCLUDE_IMAGES_wanted,
  INCLUDE_IMAGES_trade,
} from '../../utils/constants';
import { TOOLTIP_TEXTS } from '../../utils/tooltipTexts';

interface TradeFiltersPanelProps {
  isMirror: boolean;
  shouldShowFewLayout: boolean;
  editMode: boolean;
  mode?: 'exclude' | 'include' | 'both';
  filterContext?: 'wanted' | 'trade';
  selectedExcludeImages: boolean[];
  selectedIncludeOnlyImages: boolean[];
  toggleExcludeImageSelection: (index: number, editMode: boolean) => void;
  toggleIncludeOnlyImageSelection: (index: number, editMode: boolean) => void;
}

const TradeFiltersPanel: React.FC<TradeFiltersPanelProps> = ({
  isMirror,
  shouldShowFewLayout: _shouldShowFewLayout,
  editMode,
  mode = 'both',
  filterContext = 'wanted',
  selectedExcludeImages,
  selectedIncludeOnlyImages,
  toggleExcludeImageSelection,
  toggleIncludeOnlyImageSelection,
}) => {
  const excludeImages =
    filterContext === 'trade' ? EXCLUDE_IMAGES_trade : EXCLUDE_IMAGES_wanted;
  const includeImages =
    filterContext === 'trade' ? INCLUDE_IMAGES_trade : INCLUDE_IMAGES_wanted;
  const filterNames =
    filterContext === 'trade' ? FILTER_NAMES_TRADE : FILTER_NAMES;
  const excludeTooltipTexts = filterNames
    .slice(0, excludeImages.length)
    .map((name) => TOOLTIP_TEXTS[name]);
  const includeTooltipTexts = filterNames
    .slice(excludeImages.length)
    .map((name) => TOOLTIP_TEXTS[name]);

  if (isMirror) {
    return null;
  }

  return (
    <div className="image-row-container">
      {mode !== 'include' && (
        <div className="trade-filter-group trade-filter-group--exclude">
          <h3>Exclude</h3>
          <FilterImages
            images={[...excludeImages]}
            selectedImages={selectedExcludeImages}
            toggleImageSelection={toggleExcludeImageSelection}
            editMode={editMode}
            tooltipTexts={excludeTooltipTexts}
          />
        </div>
      )}
      {mode !== 'exclude' && (
        <div className="trade-filter-group trade-filter-group--include">
          <h3>Require</h3>
          <FilterImages
            images={[...includeImages]}
            selectedImages={selectedIncludeOnlyImages}
            toggleImageSelection={toggleIncludeOnlyImageSelection}
            editMode={editMode}
            tooltipTexts={includeTooltipTexts}
          />
        </div>
      )}
    </div>
  );
};

export default TradeFiltersPanel;
