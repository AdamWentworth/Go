// PreviewContainer.jsx
import React from 'react';
import './PreviewContainer.css';
import ColorSettingsOverlay from './ColorSettingsOverlay';
import ListImageDownload from './ListImageDownload';
import LoadingSpinner from './../../../components/LoadingSpinner';

const PreviewContainer = ({
  isDownloading,
  setIsPreviewMode,
  setShowColorSettings,
  showColorSettings,
  downloadRef,
  handleDownload,
  previewBgColor,
  sectionFrameBgColor,
  activeLists,
  onSelectPreset,
  h2FontColor,
  pokemonNameColor,
  variants
}) => (
  <div className="preview-container">
    <div className="preview-header">
      <button onClick={() => setIsPreviewMode(false)}>Back to Lists</button>
      <button onClick={handleDownload}>
        <img src="/images/download-icon.png" alt="Download Icon" className="button-icon" />
        Download Preview Image
      </button>
      <button onClick={() => setShowColorSettings(true)}>Customize Colors</button>
    </div>

    {showColorSettings && (
      <ColorSettingsOverlay
        onClose={() => setShowColorSettings(false)}
        onSelectPreset={onSelectPreset}
      />
    )}

    <div className="preview-content-wrapper">
      <div
        className={`capture-container ${isDownloading ? 'hidden-capture' : ''}`}
        style={{
          "--preview-bg-color": previewBgColor,
          "--section-frame-bg-color": sectionFrameBgColor,
          "--h2-font-color": h2FontColor,
          "--pokemon-name-color": pokemonNameColor, // use the new variable here
        }}
      >
        <ListImageDownload
          ref={downloadRef}
          wantedPokemons={activeLists.wanted ? Object.values(activeLists.wanted) : []}
          tradePokemons={activeLists.trade ? Object.values(activeLists.trade) : []}
          variants={variants}
        />
      </div>
      {isDownloading && (
        <div className="spinner-overlay">
          <LoadingSpinner />
        </div>
      )}
    </div>
  </div>
);

export default PreviewContainer;
