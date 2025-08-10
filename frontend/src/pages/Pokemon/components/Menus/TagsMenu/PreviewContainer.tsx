// PreviewContainer.tsx
import React, { CSSProperties } from 'react';
import './PreviewContainer.css';
import ColorSettingsOverlay from './ColorSettingsOverlay';
import TagImageDownload, { TagImageDownloadRef } from './TagImageDownload';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { AllVariants } from '@/types/pokemonVariants';
import type { TagBuckets } from '@/types/tags';
import type { ColorPreset } from './ColorSettingsOverlay';

export interface PreviewContainerProps {
  isDownloading: boolean;
  setIsPreviewMode: (value: boolean) => void;
  setShowColorSettings: (value: boolean) => void;
  showColorSettings: boolean;
  downloadRef: React.Ref<TagImageDownloadRef>;
  handleDownload: () => void;

  // ⬇️ Make these optional — we’ll rely on CSS fallbacks if absent.
  previewBgColor?: string;
  sectionFrameBgColor?: string;
  h2FontColor?: string;
  pokemonNameColor?: string;

  activeTags: Pick<TagBuckets, 'wanted' | 'trade'>;

  // ⬇️ Optional too; we’ll hide the Customize button when not provided.
  onSelectPreset?: (preset: ColorPreset) => void;

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
  activeTags,
  onSelectPreset,
  h2FontColor,
  pokemonNameColor,
  variants,
}) => {
  // Only set CSS vars that were provided; everything else falls back in CSS.
  const captureStyles: CSSProperties = {
    ...(previewBgColor       ? ({ ['--preview-bg-color' as any]: previewBgColor } as CSSProperties) : {}),
    ...(sectionFrameBgColor  ? ({ ['--section-frame-bg-color' as any]: sectionFrameBgColor } as CSSProperties) : {}),
    ...(h2FontColor          ? ({ ['--h2-font-color' as any]: h2FontColor } as CSSProperties) : {}),
    ...(pokemonNameColor     ? ({ ['--pokemon-name-color' as any]: pokemonNameColor } as CSSProperties) : {}),
  };

  return (
    <div className="preview-container">
      <div className="preview-header">
        <button onClick={() => setIsPreviewMode(false)}>Back to Tags</button>
        <button onClick={handleDownload}>
          <img src="/images/download-icon.png" alt="Download Icon" className="button-icon" />
          Download Preview Image
        </button>

        {/* Hide Customize Colors if there’s no onSelectPreset handler */}
        {onSelectPreset && (
          <button onClick={() => setShowColorSettings(true)}>Customize Colors</button>
        )}
      </div>

      {showColorSettings && onSelectPreset && (
        <ColorSettingsOverlay
          onClose={() => setShowColorSettings(false)}
          onSelectPreset={onSelectPreset}
        />
      )}

      <div className="preview-content-wrapper">
        <div
          className={`capture-container ${isDownloading ? 'hidden-capture' : ''}`}
          style={captureStyles}
        >
          <TagImageDownload
            ref={downloadRef}
            wantedPokemons={activeTags.wanted ? Object.values(activeTags.wanted) : []}
            tradePokemons={activeTags.trade ? Object.values(activeTags.trade) : []}
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
