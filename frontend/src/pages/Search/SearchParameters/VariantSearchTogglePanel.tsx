import React from 'react';

import Dropdown from '../components/Dropdown';

interface VariantSearchTogglePanelProps {
  isShiny: boolean;
  isShadow: boolean;
  showCostumeDropdown: boolean;
  onShinyToggle: () => void;
  onCostumeToggle: () => void;
  onShadowToggle: () => void;
  availableForms: string[];
  selectedForm: string;
  onFormChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  availableCostumeNames: string[];
  costume: string | null;
  onCostumeChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  formatCostumeLabel: (value: string) => string;
  formatFormLabel: (value: string) => string;
}

const VariantSearchTogglePanel: React.FC<VariantSearchTogglePanelProps> = ({
  isShiny,
  isShadow,
  showCostumeDropdown,
  onShinyToggle,
  onCostumeToggle,
  onShadowToggle,
  availableForms,
  selectedForm,
  onFormChange,
  availableCostumeNames,
  costume,
  onCostumeChange,
  formatCostumeLabel,
  formatFormLabel,
}) => (
  <>
    <div className="button-container">
      <button
        type="button"
        onClick={onShinyToggle}
        className={`shiny-button ${isShiny ? 'active' : ''}`}
      >
        <img src="/images/shiny_icon.png" alt="Toggle Shiny" />
      </button>
      <button
        type="button"
        onClick={onCostumeToggle}
        className={`costume-button ${showCostumeDropdown ? 'active' : ''}`}
      >
        <img src="/images/costume_icon.png" alt="Toggle Costume" />
      </button>
      <button
        type="button"
        onClick={onShadowToggle}
        className={`shadow-button ${isShadow ? 'active' : ''}`}
      >
        <img src="/images/shadow_icon.png" alt="Toggle Shadow" />
      </button>
    </div>

    {availableForms.length > 0 && (
      <Dropdown
        label="Form"
        value={selectedForm}
        options={availableForms}
        handleChange={onFormChange}
        formatLabel={formatFormLabel}
        className="form-dropdown"
      />
    )}

    {showCostumeDropdown && availableCostumeNames.length > 0 && (
      <Dropdown
        label="Costume"
        value={costume}
        options={availableCostumeNames}
        handleChange={onCostumeChange}
        formatLabel={formatCostumeLabel}
        className="costume-dropdown"
      />
    )}
  </>
);

export default VariantSearchTogglePanel;
