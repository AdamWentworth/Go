// sections/PowerPanel.jsx
import React from 'react';
import './PowerPanel.css';
import MaxComponent from '../components/Caught/MaxComponent.jsx';
import MaxMovesComponent from '../components/Caught/MaxMovesComponent.jsx';
import MegaComponent from '../components/Caught/MegaComponent';

const PowerPanel = ({
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
          pokemon={pokemon}
          editMode={editMode}
          dynamax={dynamax}
          gigantamax={gigantamax}
          onToggleMax={onToggleMax}
          showMaxOptions={showMaxOptions}
        />
      </div>
      <div className="mega-component">
        <MegaComponent
          megaData={megaData}
          setMegaData={setMegaData}
          editMode={editMode}
          megaEvolutions={megaEvolutions}
          isShadow={isShadow}
          name={name}
        />
      </div>
    </div>

    <MaxMovesComponent
      pokemon={pokemon}
      editMode={editMode}
      showMaxOptions={showMaxOptions}
      setShowMaxOptions={() => { /* kept for compatibility; no-op here */ }}
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
