import React from 'react';

import FilterImages from '../../FilterImages';
import {
  EXCLUDE_IMAGES_wanted,
  FILTER_NAMES,
  INCLUDE_IMAGES_wanted,
} from '../../utils/constants';
import { TOOLTIP_TEXTS } from '../../utils/tooltipTexts';

interface TradeFiltersPanelProps {
  isMirror: boolean;
  shouldShowFewLayout: boolean;
  editMode: boolean;
  selectedExcludeImages: boolean[];
  selectedIncludeOnlyImages: boolean[];
  toggleExcludeImageSelection: (index: number, editMode: boolean) => void;
  toggleIncludeOnlyImageSelection: (index: number, editMode: boolean) => void;
}

const excludeTooltipTexts = FILTER_NAMES.map((name) => TOOLTIP_TEXTS[name]);
const includeTooltipTexts = FILTER_NAMES.slice(EXCLUDE_IMAGES_wanted.length).map(
  (name) => TOOLTIP_TEXTS[name],
);

const TradeFiltersPanel: React.FC<TradeFiltersPanelProps> = ({
  isMirror,
  shouldShowFewLayout,
  editMode,
  selectedExcludeImages,
  selectedIncludeOnlyImages,
  toggleExcludeImageSelection,
  toggleIncludeOnlyImageSelection,
}) => {
  if (isMirror) {
    return null;
  }

  if (!shouldShowFewLayout) {
    return (
      <div className="image-row-container">
        <div className="exclude-header-group image-group">
          <FilterImages
            images={[...EXCLUDE_IMAGES_wanted]}
            selectedImages={selectedExcludeImages}
            toggleImageSelection={toggleExcludeImageSelection}
            editMode={editMode}
            tooltipTexts={excludeTooltipTexts}
          />
        </div>
        <div className="include-only-header-group image-group">
          <FilterImages
            images={[...INCLUDE_IMAGES_wanted]}
            selectedImages={selectedIncludeOnlyImages}
            toggleImageSelection={toggleIncludeOnlyImageSelection}
            editMode={editMode}
            tooltipTexts={includeTooltipTexts}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="exclude-header-group image-group exclude-few">
        <FilterImages
          images={[...EXCLUDE_IMAGES_wanted]}
          selectedImages={selectedExcludeImages}
          toggleImageSelection={toggleExcludeImageSelection}
          editMode={editMode}
          tooltipTexts={excludeTooltipTexts}
        />
      </div>
      <div className="include-only-header-group include-few">
        <h3>Include</h3>
        <FilterImages
          images={[...INCLUDE_IMAGES_wanted]}
          selectedImages={selectedIncludeOnlyImages}
          toggleImageSelection={toggleIncludeOnlyImageSelection}
          editMode={editMode}
          tooltipTexts={includeTooltipTexts}
        />
      </div>
    </>
  );
};

export default TradeFiltersPanel;
