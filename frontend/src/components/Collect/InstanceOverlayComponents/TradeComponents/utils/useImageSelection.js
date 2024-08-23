// useImageSelection.js
import { useState } from 'react';

const useImageSelection = () => {
    const [selectedImages, setSelectedImages] = useState({
        exclude: [false, false, false, false, false, false], // Initially all images are greyscaled
        includeOnly: [false, false, false, false, false],
    });

    const toggleImageSelection = (group, index, editMode) => {
        if (!editMode) return; // Only allow toggling in edit mode

        setSelectedImages((prevSelectedImages) => {
            const updatedGroup = [...prevSelectedImages[group]];
            updatedGroup[index] = !updatedGroup[index]; // Toggle the selection

            return {
                ...prevSelectedImages,
                [group]: updatedGroup,
            };
        });
    };

    return { selectedImages, toggleImageSelection };
};

export default useImageSelection;
