// TagsMenu.jsx
import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import './TagsMenu.css';
import useSwipeHandler from '../hooks/useSwipeHandler';
import useDownloadImage from './hooks/useDownloadImage';
import PreviewContainer from './PreviewContainer';
import useFavoriteList from '../../../hooks/sort/useFavoriteList';
import useNumberPokemons from '../../../hooks/sort/useNumberPokemons';
import ListItems from './ListItems';

const TagsMenu = ({ onSelectList, activeLists, onSwipe, variants }) => {
  const { isLightMode } = useTheme();

  const defaultColors = isLightMode
    ? {
        previewBgColor: "#e0f0e5",
        sectionFrameBgColor: "#f8fff9",
        h2FontColor: "#000",
        pokemonNameColor: "#000",
      }
    : {
        previewBgColor: "#000",
        sectionFrameBgColor: "#222",
        h2FontColor: "#fff",
        pokemonNameColor: "#fff",
      };

  const sortedOwnedPokemons = useFavoriteList(
    activeLists.owned ? Object.values(activeLists.owned) : []
  );

  const sortedTradePokemons = useNumberPokemons(
    activeLists.trade ? Object.values(activeLists.trade) : [],
    "ascending",
    { isShiny: false, showShadow: false, showCostume: false, showAll: true }
  );
  const sortedWantedPokemons = useNumberPokemons(
    activeLists.wanted ? Object.values(activeLists.wanted) : [],
    "ascending",
    { isShiny: false, showShadow: false, showCostume: false, showAll: true }
  );
  const sortedUnownedPokemons = useNumberPokemons(
    activeLists.unowned ? Object.values(activeLists.unowned) : [],
    "ascending",
    { isShiny: false, showShadow: false, showCostume: false, showAll: true }
  );

  const sortedLists = {
    Caught: sortedOwnedPokemons,
    Trade: sortedTradePokemons,
    Wanted: sortedWantedPokemons,
    Unowned: sortedUnownedPokemons,
  };

  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [showColorSettings, setShowColorSettings] = React.useState(false);

  const [previewBgColor, setPreviewBgColor] = React.useState(defaultColors.previewBgColor);
  const [sectionFrameBgColor, setSectionFrameBgColor] = React.useState(defaultColors.sectionFrameBgColor);
  const [h2FontColor, setH2FontColor] = React.useState(defaultColors.h2FontColor);
  const [pokemonNameColor, setPokemonNameColor] = React.useState(defaultColors.pokemonNameColor);

  React.useEffect(() => {
    setPreviewBgColor(defaultColors.previewBgColor);
    setSectionFrameBgColor(defaultColors.sectionFrameBgColor);
    setH2FontColor(defaultColors.h2FontColor);
    setPokemonNameColor(defaultColors.pokemonNameColor);
  }, [isLightMode]);

  const { isDownloading, downloadImage } = useDownloadImage();
  const downloadRef = React.useRef(null);

  const handleDownload = () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    const filename = isPreviewMode ? 'preview-wanted-trade.png' : 'wanted-trade-pokemons.png';
    downloadImage(captureArea, filename);
  };

  return (
    <div
      className="lists-menu"
    >
      {isPreviewMode ? (
        <PreviewContainer
          isDownloading={isDownloading}
          setIsPreviewMode={setIsPreviewMode}
          setShowColorSettings={setShowColorSettings}
          showColorSettings={showColorSettings}
          downloadRef={downloadRef}
          handleDownload={handleDownload}
          previewBgColor={previewBgColor}
          sectionFrameBgColor={sectionFrameBgColor}
          activeLists={activeLists}
          h2FontColor={h2FontColor}
          pokemonNameColor={pokemonNameColor}
          onSelectPreset={(preset) => {
            setPreviewBgColor(preset.previewBgColor);
            setSectionFrameBgColor(preset.sectionFrameBgColor);
            setH2FontColor(preset.h2FontColor);
            setPokemonNameColor(preset.pokemonNameColor || preset.h2FontColor);
            setShowColorSettings(false);
          }}
          variants={variants}
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
                listNames={['Caught', 'Trade']}
                sortedLists={sortedLists}
                onSelectList={onSelectList}
              />
            </div>
            <div className="column">
              <ListItems
                listNames={['Wanted', 'Unowned']}
                sortedLists={sortedLists}
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