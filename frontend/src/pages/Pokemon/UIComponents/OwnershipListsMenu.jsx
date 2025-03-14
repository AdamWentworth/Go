// OwnershipListsMenu.jsx
import React, { useRef, useState } from 'react';
import './OwnershipListsMenu.css';
import html2canvas from 'html2canvas';

// Your custom hook
import useFavoriteList from '../../../hooks/sort/useFavoriteList';
// The display-only preview component
import ListImageDownload from './ListImageDownload';
// The loading spinner
import LoadingSpinner from './../../../components/LoadingSpinner';

// Import our new modular components
import ColorSettingsOverlay from './ColorSettingsOverlay';
import ListItems from './ListItems';

const OwnershipListsMenu = ({ onSelectList, activeLists, onSwipe }) => {
  const leftColumnLists = ['Caught', 'Trade'];
  const rightColumnLists = ['Wanted', 'Unowned'];

  // Sorted 'owned' Pokémons using your custom hook
  const sortedOwnedPokemons = useFavoriteList(
    activeLists.owned ? Object.values(activeLists.owned) : []
  );

  // States for toggling preview mode, download, and color settings overlay
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showColorSettings, setShowColorSettings] = useState(false);

  // Color customization states
  const [previewBgColor, setPreviewBgColor] = useState("#fff");
  const [sectionFrameBgColor, setSectionFrameBgColor] = useState("#f0f0f0");

  // Color presets available for users
  const colorPresets = [
    { name: "Default", previewBgColor: "#fff", sectionFrameBgColor: "#f0f0f0" },
    { name: "Dark", previewBgColor: "#333", sectionFrameBgColor: "#555" },
    { name: "Blue", previewBgColor: "#e0f7fa", sectionFrameBgColor: "#80deea" },
    { name: "Green", previewBgColor: "#e8f5e9", sectionFrameBgColor: "#a5d6a7" },
  ];

  // Ref to the child component exposing a capture area
  const downloadRef = useRef(null);

  // Swipe logic
  const SWIPE_THRESHOLD = 50;
  const touchStartX = useRef(0);
  const lastTouchX = useRef(0);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    lastTouchX.current = touch.clientX;
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    lastTouchX.current = touch.clientX;
  };

  const handleTouchEnd = () => {
    const dx = lastTouchX.current - touchStartX.current;
    if (dx > SWIPE_THRESHOLD) {
      onSwipe && onSwipe('right');
    } else if (dx < -SWIPE_THRESHOLD) {
      onSwipe && onSwipe('left');
    }
  };

  // Trigger the screenshot/download
  const handleDownload = async () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    if (!captureArea) return;
  
    setIsDownloading(true);
  
    // Make sure the browser has a chance to re-render any offscreen changes
    const rafPromise = () =>
      new Promise((resolve) => requestAnimationFrame(resolve));
    await rafPromise();
    await rafPromise();
  
    try {
      const canvas = await html2canvas(captureArea, {
        // forcibly limit how large the canvas can be
        windowWidth: captureArea.scrollWidth, 
        windowHeight: captureArea.scrollHeight,
        // optionally set the scale to 1 so it doesn't grow for high DPI screens
        scale: 1
      });      
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = isPreviewMode
        ? 'preview-wanted-trade.png'
        : 'wanted-trade-pokemons.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      className="lists-menu"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isPreviewMode ? (
        <div className="preview-container">
          {/* Header buttons for preview mode */}
          {!isDownloading && (
            <div className="preview-header">
              <button
                className="preview-toggle-button"
                onClick={() => setIsPreviewMode(false)}
              >
                Back to Lists
              </button>
              <button className="preview-toggle-button" onClick={handleDownload}>
                <img
                  src="/images/download-icon.png"
                  alt="Download Icon"
                  className="button-icon"
                />
                Download Preview Image
              </button>
              <button
                className="preview-toggle-button"
                onClick={() => setShowColorSettings(true)}
              >
                Customize Colors
              </button>
            </div>
          )}

          {/* Render color presets overlay */}
          {showColorSettings && (
            <ColorSettingsOverlay
              colorPresets={colorPresets}
              onSelectPreset={(preset) => {
                setPreviewBgColor(preset.previewBgColor);
                setSectionFrameBgColor(preset.sectionFrameBgColor);
                setShowColorSettings(false);
              }}
              onClose={() => setShowColorSettings(false)}
            />
          )}

          {/* Preview content */}
          <div className="preview-content-wrapper">
            <div
              className={`capture-container ${isDownloading ? 'hidden-capture' : ''}`}
              style={{
                "--preview-bg-color": previewBgColor,
                "--section-frame-bg-color": sectionFrameBgColor,
              }}
            >
              <ListImageDownload
                ref={downloadRef}
                wantedPokemons={activeLists.wanted ? Object.values(activeLists.wanted) : []}
                tradePokemons={activeLists.trade ? Object.values(activeLists.trade) : []}
                previewMode={true}
              />
            </div>
            {isDownloading && (
              <div className="spinner-overlay">
                <LoadingSpinner />
              </div>
            )}
          </div>
        </div>
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
                listNames={leftColumnLists}
                activeLists={activeLists}
                sortedOwnedPokemons={sortedOwnedPokemons}
                onSelectList={onSelectList}
              />
            </div>
            <div className="column">
              <ListItems
                listNames={rightColumnLists}
                activeLists={activeLists}
                sortedOwnedPokemons={sortedOwnedPokemons}
                onSelectList={onSelectList}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OwnershipListsMenu;