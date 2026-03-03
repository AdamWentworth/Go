// FilterImages.tsx
import React, { useState, Fragment } from 'react';
import './FilterImages.css';

interface FilterImagesProps {
  /** Array of image URLs to show in order */
  images: string[];

  /** true ⇢ image ON, false ⇢ image OFF / greyscale */
  selectedImages: boolean[];

  /**
   * Handler to toggle a particular image.
   * @param index - index of the clicked image
   * @param editMode - current edit-mode flag
   */
  toggleImageSelection: (index: number, editMode: boolean) => void;

  /** If true, images get the “editable” class */
  editMode: boolean;

  /** Tooltip text for each image (multi-line strings allowed) */
  tooltipTexts: string[];
}

const FilterImages: React.FC<FilterImagesProps> = ({
  images,
  selectedImages,
  toggleImageSelection,
  editMode,
  tooltipTexts,
}) => {
  const [hoveredImageIndex, setHoveredImageIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => setHoveredImageIndex(index);
  const handleMouseLeave = () => setHoveredImageIndex(null);

  /** Renders a multi-line tooltip by converting `\n` → `<br/>` */
  const renderTooltipText = (text: string) =>
    text.split('\n').map((line, i) => (
      <Fragment key={i}>
        {line}
        <br />
      </Fragment>
    ));

  return (
    <div className="image-row">
      {images.map((src, index) => (
        <div
          key={index}
          className="image-container"
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
        >
          <img
            src={src}
            alt={`Image ${index + 1}`}
            className={`toggleable-image ${editMode ? 'editable' : ''} ${
              selectedImages[index] ? '' : 'greyscale'
            }`}
            onClick={() => toggleImageSelection(index, editMode)}
          />

          {hoveredImageIndex === index && (
            <div className="tooltip">
              {renderTooltipText(tooltipTexts[index] ?? 'Placeholder tooltip text')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FilterImages;
