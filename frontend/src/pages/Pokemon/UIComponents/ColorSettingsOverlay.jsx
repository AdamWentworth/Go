// ColorSettingsOverlay.jsx

import React from 'react';
import OverlayPortal from './../../../components/OverlayPortal';
import WindowOverlay from './../../../components/WindowOverlay';
import './ColorSettingsOverlay.css';

const ColorSettingsOverlay = ({ colorPresets, onSelectPreset, onClose }) => {
  return (
    <OverlayPortal>
      <div className="instance-overlay">
        <WindowOverlay onClose={onClose} className="color-settings-overlay">
          <div className="color-settings-panel">
            <h3>Select a Color Preset</h3>
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                className="preset-button"
                onClick={() => onSelectPreset(preset)}
              >
                {preset.name}
              </button>
            ))}
            <button className="preset-close-button" onClick={onClose}>
              Close
            </button>
          </div>
        </WindowOverlay>
      </div>
    </OverlayPortal>
  );
};

export default ColorSettingsOverlay;
