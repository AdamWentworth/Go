// ColorSettingsOverlay.tsx
import React from 'react';
import OverlayPortal from '@/components/OverlayPortal';
import WindowOverlay from '@/components/WindowOverlay';
import CloseButton from '@/components/CloseButton';
import './ColorSettingsOverlay.css';

export interface ColorPreset {
  name: string;
  previewBgColor: string;
  sectionFrameBgColor: string;
  h2FontColor: string;
  pokemonNameColor: string;
}

export interface ColorSettingsOverlayProps {
  colorPresets?: ColorPreset[];
  onSelectPreset: (preset: ColorPreset) => void;
  onClose: () => void;
}

const defaultColorPresets: ColorPreset[] = [
  { name: 'Light', previewBgColor: '#e0f0e5', sectionFrameBgColor: '#ffffff', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Night', previewBgColor: '#000', sectionFrameBgColor: '#222', h2FontColor: '#fff', pokemonNameColor: '#fff' },
  { name: 'Normal', previewBgColor: 'linear-gradient(to right, #A8A878, #C6C6A7)', sectionFrameBgColor: '#E0E0D0', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Fire', previewBgColor: 'linear-gradient(to right, #F08030, #F8A040)', sectionFrameBgColor: '#FFF3E0', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Water', previewBgColor: 'linear-gradient(to right, #6890F0, #98C6F0)', sectionFrameBgColor: '#E0F7FF', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Electric', previewBgColor: 'linear-gradient(to right, #F8D030, #F8E060)', sectionFrameBgColor: '#FFF9E0', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Grass', previewBgColor: 'linear-gradient(to right, #78C850, #A8D08D)', sectionFrameBgColor: '#E6F4E0', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Ice', previewBgColor: 'linear-gradient(to right, #98D8D8, #C0E8E8)', sectionFrameBgColor: '#E0FBFB', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Fighting', previewBgColor: 'linear-gradient(to right, #C03028, #E05040)', sectionFrameBgColor: '#FFECEB', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Poison', previewBgColor: 'linear-gradient(to right, #A040A0, #C070C0)', sectionFrameBgColor: '#F7E0F7', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Ground', previewBgColor: 'linear-gradient(to right, #E0C068, #F0D080)', sectionFrameBgColor: '#FFF8E0', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Flying', previewBgColor: 'linear-gradient(to right, #A890F0, #C0B0F0)', sectionFrameBgColor: '#F0F0FF', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Psychic', previewBgColor: 'linear-gradient(to right, #F85888, #F8A0A8)', sectionFrameBgColor: '#FFEFF0', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Bug', previewBgColor: 'linear-gradient(to right, #A8B820, #C8D040)', sectionFrameBgColor: '#F0F7D0', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Rock', previewBgColor: 'linear-gradient(to right, #B8A038, #D0B058)', sectionFrameBgColor: '#FFF2D0', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Ghost', previewBgColor: 'linear-gradient(to right, #705898, #A090B8)', sectionFrameBgColor: '#F6F0FB', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Dragon', previewBgColor: 'linear-gradient(to right, #7038F8, #A058F8)', sectionFrameBgColor: '#F0EFFF', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Dark', previewBgColor: 'linear-gradient(to right, #705848, #A08868)', sectionFrameBgColor: '#F5F0E8', h2FontColor: '#fff', pokemonNameColor: '#000' },
  { name: 'Steel', previewBgColor: 'linear-gradient(to right, #B8B8D0, #D0D0E0)', sectionFrameBgColor: '#F7F7FF', h2FontColor: '#000', pokemonNameColor: '#000' },
  { name: 'Fairy', previewBgColor: 'linear-gradient(to right, #EE99AC, #F8C0C8)', sectionFrameBgColor: '#FFF0F4', h2FontColor: '#000', pokemonNameColor: '#000' },
];

const ColorSettingsOverlay: React.FC<ColorSettingsOverlayProps> = ({ colorPresets, onSelectPreset, onClose }) => {
  const presets = colorPresets ?? defaultColorPresets;
  const firstRow = presets.slice(0, 2);
  const secondRow = presets.slice(2);

  return (
    <OverlayPortal>
      <div className="color-overlay">
        <WindowOverlay onClose={onClose} className="color-settings-overlay">
          <div className="color-settings-panel">
            <h3>Select a Color Preset</h3>
            <div className="preset-row">
              {firstRow.map((preset) => (
                <button
                  key={preset.name}
                  className="preset-button"
                  onClick={() => onSelectPreset(preset)}
                  style={{ background: preset.previewBgColor, color: preset.h2FontColor }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="preset-row">
              {secondRow.map((preset) => (
                <button
                  key={preset.name}
                  className="preset-button"
                  onClick={() => onSelectPreset(preset)}
                  style={{ background: preset.previewBgColor, color: preset.h2FontColor }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <CloseButton onClick={onClose} />
          </div>
        </WindowOverlay>
      </div>
    </OverlayPortal>
  );
};

export default ColorSettingsOverlay;