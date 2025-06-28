// PreviewContainer.tsx
import React, { CSSProperties } from 'react';
import './PreviewContainer.css';
import ColorSettingsOverlay from './ColorSettingsOverlay';
import ListImageDownload, { ListImageDownloadRef } from './ListImageDownload';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { AllVariants } from '@/types/pokemonVariants';
import type { TagBuckets } from '@/types/tags';
import type { ColorPreset } from './ColorSettingsOverlay';

export interface PreviewContainerProps {
  isDownloading: boolean;
  setIsPreviewMode: (value: boolean) => void;
  setShowColorSettings: (value: boolean) => void;
  showColorSettings: boolean;
  downloadRef: React.Ref<ListImageDownloadRef>;
  handleDownload: () => void;
  previewBgColor: string;
  sectionFrameBgColor: string;
  h2FontColor: string;
  pokemonNameColor: string;
  activeLists: Pick<TagBuckets, 'wanted' | 'trade'>;
  // Accept actual ColorPreset objects
  onSelectPreset: (preset: ColorPreset) => void;
  variants: AllVariants;
}

const PreviewContainer: React.FC<PreviewContainerProps> = ({
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
  variants,
}) => {
  // CSS custom properties require casting
  const captureStyles = {
    '--preview-bg-color': previewBgColor,
    '--section-frame-bg-color': sectionFrameBgColor,
    '--h2-font-color': h2FontColor,
    '--pokemon-name-color': pokemonNameColor,
  } as unknown as CSSProperties;

  return (
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
        <ColorSettingsOverlay onClose={() => setShowColorSettings(false)} onSelectPreset={onSelectPreset} />
      )}

      <div className="preview-content-wrapper">
        <div
          className={`capture-container ${isDownloading ? 'hidden-capture' : ''}`}
          style={captureStyles}
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
};

export default PreviewContainer;
