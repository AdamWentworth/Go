// ImageGroup.jsx
import React from 'react';

const ImageGroup = ({ images, group, selectedImages, toggleImageSelection, editMode }) => {
    return (
        <div className="image-row">
            {images.map((src, index) => (
                <img
                    key={index}
                    src={src}
                    alt={`${group} Image ${index + 1}`}
                    className={`toggleable-image ${editMode ? 'editable' : ''} ${selectedImages[index] ? '' : 'greyscale'}`}
                    onClick={() => toggleImageSelection(group, index, editMode)}
                />
            ))}
        </div>
    );
};

export default ImageGroup;
