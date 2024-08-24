// ImageGroup.jsx
import React from 'react';

const ImageGroup = ({ images, selectedImages, toggleImageSelection, editMode }) => {
    return (
        <div className="image-row">
            {images.map((src, index) => (
                <div key={index} className="image-container">
                    <img
                        src={src}
                        alt={`Image ${index + 1}`}
                        className={`toggleable-image ${editMode ? 'editable' : ''} ${selectedImages[index] ? '' : 'greyscale'}`}
                        onClick={() => toggleImageSelection(index, editMode)}
                    />
                </div>
            ))}
        </div>
    );
};

export default ImageGroup;
