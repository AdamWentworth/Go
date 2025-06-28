// TagsMenu.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import './TagsMenu.css';
import useDownloadImage from './hooks/useDownloadImage';
import PreviewContainer from './PreviewContainer';
import useFavoriteList from '@/hooks/sort/useFavoriteList';
import ListItems from './ListItems';
import type { TagBuckets, TagItem } from '@/types/tags';
import type { AllVariants } from '@/types/pokemonVariants';

export interface TagsMenuProps {
  onSelectList: (listName: string) => void;
  activeLists : TagBuckets;
  variants    : AllVariants;
}

const TagsMenu: React.FC<TagsMenuProps> = ({
  onSelectList,
  activeLists,
  variants,
}) => {
  const { isLightMode } = useTheme();

  // console.log(activeLists)

  /* ----- default colours ----------------------------------------- */
  const defaultColors = isLightMode
    ? {
        previewBgColor      : '#e0f0e5',
        sectionFrameBgColor : '#f8fff9',
        h2FontColor         : '#000',
        pokemonNameColor    : '#000',
      }
    : {
        previewBgColor      : '#000',
        sectionFrameBgColor : '#222',
        h2FontColor         : '#fff',
        pokemonNameColor    : '#fff',
      };

  /* ----- list sorting --------------------------------------------- */
  const sortedOwnedPokemons = useFavoriteList(
    activeLists.owned ? Object.values(activeLists.owned) : [],
  );

  const sortedTradePokemons = useMemo<TagItem[]>(() => {
    if (!activeLists.trade) return [];
    return Object.values(activeLists.trade).sort(
      (a, b) => a.pokedex_number - b.pokedex_number,
    );
  }, [activeLists.trade]);

  const sortedWantedPokemons = useMemo<TagItem[]>(() => {
    if (!activeLists.wanted) return [];
    return Object.values(activeLists.wanted).sort(
      (a, b) => a.pokedex_number - b.pokedex_number,
    );
  }, [activeLists.wanted]);

  const sortedUnownedPokemons = useMemo<TagItem[]>(() => {
    if (!activeLists.unowned) return [];
    return Object.values(activeLists.unowned).sort(
      (a, b) => a.pokedex_number - b.pokedex_number,
    );
  }, [activeLists.unowned]);

  const sortedLists: Record<string, TagItem[]> = {
    Caught : sortedOwnedPokemons,
    Trade  : sortedTradePokemons,
    Wanted : sortedWantedPokemons,
    Unowned: sortedUnownedPokemons,
  };

  /* ----- preview / download state --------------------------------- */
  const [isPreviewMode       , setIsPreviewMode]        = useState(false);
  const [showColorSettings   , setShowColorSettings]    = useState(false);
  const [previewBgColor      , setPreviewBgColor]       = useState(defaultColors.previewBgColor);
  const [sectionFrameBgColor , setSectionFrameBgColor]  = useState(defaultColors.sectionFrameBgColor);
  const [h2FontColor         , setH2FontColor]          = useState(defaultColors.h2FontColor);
  const [pokemonNameColor    , setPokemonNameColor]     = useState(defaultColors.pokemonNameColor);

  useEffect(() => {
    setPreviewBgColor     (defaultColors.previewBgColor);
    setSectionFrameBgColor(defaultColors.sectionFrameBgColor);
    setH2FontColor        (defaultColors.h2FontColor);
    setPokemonNameColor   (defaultColors.pokemonNameColor);
  }, [isLightMode]);

  const { isDownloading, downloadImage } = useDownloadImage();
  const downloadRef = useRef<any>(null);

  const handleDownload = () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    const filename    = isPreviewMode
      ? 'preview-wanted-trade.png'
      : 'wanted-trade-pokemons.png';
    downloadImage(captureArea, filename);
  };

  const handlePresetSelect = (preset: {
    previewBgColor      : string;
    sectionFrameBgColor : string;
    h2FontColor         : string;
    pokemonNameColor    : string;
  }) => {
    setPreviewBgColor     (preset.previewBgColor);
    setSectionFrameBgColor(preset.sectionFrameBgColor);
    setH2FontColor        (preset.h2FontColor);
    setPokemonNameColor   (preset.pokemonNameColor || preset.h2FontColor);
    setShowColorSettings(false);
  };

  /* ----- render ---------------------------------------------------- */
  return (
    <div className="lists-menu">
      {isPreviewMode ? (
        <PreviewContainer
          isDownloading       ={isDownloading}
          setIsPreviewMode    ={setIsPreviewMode}
          setShowColorSettings={setShowColorSettings}
          showColorSettings   ={showColorSettings}
          downloadRef         ={downloadRef}
          handleDownload      ={handleDownload}
          previewBgColor      ={previewBgColor}
          sectionFrameBgColor ={sectionFrameBgColor}
          h2FontColor         ={h2FontColor}
          pokemonNameColor    ={pokemonNameColor}
          onSelectPreset      ={handlePresetSelect}
          activeLists         ={activeLists}
          variants            ={variants}
        />
      ) : (
        <>
          <div className="toggle-row">
            <button
              className="preview-toggle-button"
              onClick={() => setIsPreviewMode(true)}
            >
              <img
                src="/images/image-icon.png"
                alt="Image Icon"
                className="button-icon"
              />
              Preview Trade / Wanted Image
            </button>
          </div>
          <div className="columns-wrapper">
            <div className="column">
              <ListItems
                listNames   ={['Caught', 'Trade']}
                sortedLists ={sortedLists}
                onSelectList={onSelectList}
              />
            </div>
            <div className="column">
              <ListItems
                listNames   ={['Wanted', 'Unowned']}
                sortedLists ={sortedLists}
                onSelectList={onSelectList}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TagsMenu;
