import React from 'react';
import './PowerPanel.css';
import MaxComponent from '../components/Caught/MaxComponent';
import MaxMovesComponent from '../components/Caught/MaxMovesComponent';
import MegaComponent from '../components/Caught/MegaComponent';

interface PowerPanelProps {
  pokemon: Record<string, unknown>;
  editMode: boolean;
  megaData: Record<string, unknown>;
  setMegaData: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  megaEvolutions: unknown[];
  isShadow: boolean;
  name: string;
  dynamax: boolean;
  gigantamax: boolean;
  showMaxOptions: boolean;
  onToggleMax: () => void;
  maxAttack: string;
  maxGuard: string;
  maxSpirit: string;
  onMaxAttackChange: (value: string) => void;
  onMaxGuardChange: (value: string) => void;
  onMaxSpiritChange: (value: string) => void;
}

const PowerPanel: React.FC<PowerPanelProps> = ({
  pokemon,
  editMode,
  megaData,
  setMegaData,
  megaEvolutions,
  isShadow,
  name,
  dynamax,
  gigantamax,
  showMaxOptions,
  onToggleMax,
  maxAttack,
  maxGuard,
  maxSpirit,
  onMaxAttackChange,
  onMaxGuardChange,
  onMaxSpiritChange,
}) => (
  <>
    <div className="max-mega-container">
      <div className="max-component">
        <MaxComponent
          pokemon={pokemon as never}
          editMode={editMode}
          dynamax={dynamax}
          gigantamax={gigantamax}
          onToggleMax={onToggleMax}
          showMaxOptions={showMaxOptions}
        />
      </div>
      <div className="mega-component">
        <MegaComponent
          megaData={megaData as never}
          setMegaData={setMegaData as never}
          editMode={editMode}
          megaEvolutions={megaEvolutions as never}
          isShadow={isShadow}
          name={name}
        />
      </div>
    </div>

    <MaxMovesComponent
      pokemon={pokemon as never}
      editMode={editMode}
      showMaxOptions={showMaxOptions}
      setShowMaxOptions={() => {
        // Kept for compatibility; no-op here.
      }}
      maxAttack={maxAttack}
      maxGuard={maxGuard}
      maxSpirit={maxSpirit}
      handleMaxAttackChange={onMaxAttackChange}
      handleMaxGuardChange={onMaxGuardChange}
      handleMaxSpiritChange={onMaxSpiritChange}
    />
  </>
);

export default PowerPanel;
