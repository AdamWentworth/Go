// hooks/useBackgrounds.ts
import { useEffect, useMemo, useState, useCallback } from 'react';

export function useBackgrounds(backgrounds: any[], variantType?: string, locationCard?: string | number | null) {
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<any | null>(null);

  useEffect(() => {
    if (locationCard !== null && locationCard !== undefined) {
      const id = parseInt(String(locationCard), 10);
      const bg = backgrounds.find(b => b.background_id === id);
      if (bg) setSelectedBackground(bg);
    }
  }, [backgrounds, locationCard]);

  const selectableBackgrounds = useMemo(() => {
    return backgrounds.filter((background) => {
      if (!background.costume_id) return true;
      const variantTypeId = variantType?.split('_')[1];
      return Number(background.costume_id) === Number(variantTypeId);
    });
  }, [backgrounds, variantType]);

  const handleBackgroundSelect = useCallback((bg: any) => {
    setSelectedBackground(bg);
    setShowBackgrounds(false);
  }, []);

  return {
    showBackgrounds,
    setShowBackgrounds,
    selectedBackground,
    handleBackgroundSelect,
    selectableBackgrounds,
  };
}
