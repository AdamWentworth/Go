// useImageSelection.js
import { useState } from 'react';

const useImageSelection = (initialImages) => {
    // Initialize state for each image, each with its own selected state
    const [selectedImages, setSelectedImages] = useState(
        initialImages.map(() => false) // Set all images to unselected initially
    );

    const toggleImageSelection = (index, editMode) => {
        if (!editMode) {
            return;
        }

        setSelectedImages((prevSelectedImages) => {
            const updatedImages = [...prevSelectedImages];
            updatedImages[index] = !updatedImages[index]; // Toggle the selected state

            return updatedImages;
        });
    };

    // Return selectedImages, toggleImageSelection, and setSelectedImages
    return { selectedImages, toggleImageSelection, setSelectedImages };
};

export default useImageSelection;
