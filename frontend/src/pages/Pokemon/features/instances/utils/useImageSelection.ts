import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface UseImageSelectionResult {
  selectedImages: boolean[];
  toggleImageSelection: (index: number, editMode: boolean) => void;
  setSelectedImages: Dispatch<SetStateAction<boolean[]>>;
}

const useImageSelection = (initialImages: readonly string[]): UseImageSelectionResult => {
  const [selectedImages, setSelectedImages] = useState<boolean[]>(
    initialImages.map(() => false),
  );

  const toggleImageSelection = (index: number, editMode: boolean): void => {
    if (!editMode) return;

    setSelectedImages((prevSelectedImages) => {
      const updatedImages = [...prevSelectedImages];
      updatedImages[index] = !updatedImages[index];
      return updatedImages;
    });
  };

  return { selectedImages, toggleImageSelection, setSelectedImages };
};

export default useImageSelection;
