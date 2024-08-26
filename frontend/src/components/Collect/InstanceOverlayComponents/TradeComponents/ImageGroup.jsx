// ImageGroup.jsx
import React, { useState } from 'react';
import './ImageGroup.css';

const ImageGroup = ({ images, selectedImages, toggleImageSelection, editMode, tooltipTexts }) => {
    const [hoveredImageIndex, setHoveredImageIndex] = useState(null);

    const handleMouseEnter = (index) => {
        setHoveredImageIndex(index);
    };

    const handleMouseLeave = () => {
        setHoveredImageIndex(null);
    };

    // Function to convert \n to <br /> for multi-line tooltips
    const renderTooltipText = (text) => {
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

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
                        className={`toggleable-image ${editMode ? 'editable' : ''} ${selectedImages[index] ? '' : 'greyscale'}`}
                        onClick={() => toggleImageSelection(index, editMode)}
                    />
                    {hoveredImageIndex === index && (
                        <div className="tooltip">
                            {renderTooltipText(tooltipTexts[index] || 'Placeholder tooltip text')}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ImageGroup;