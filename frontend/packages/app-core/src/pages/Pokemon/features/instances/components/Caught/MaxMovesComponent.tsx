// MaxMovesComponent.tsx

import React from "react";
import "./MaxMovesComponent.css";

type PokemonProps = { variant_id?: string };

interface MaxMovesComponentProps {
  pokemon: PokemonProps;
  editMode: boolean;
  maxAttack: string;
  maxGuard: string;
  maxSpirit: string;
  handleMaxAttackChange: (value: string) => void;
  handleMaxGuardChange: (value: string) => void;
  handleMaxSpiritChange: (value: string) => void;
}

const MaxMovesComponent: React.FC<MaxMovesComponentProps> = ({
  pokemon,
  editMode,
  maxAttack,
  maxGuard,
  maxSpirit,
  handleMaxAttackChange,
  handleMaxGuardChange,
  handleMaxSpiritChange,
}) => {
  const key = pokemon.variant_id ?? '';

  return (
    <div
      className="max-options-container"
      id={`max-options-${key}`}
      aria-label="Max Move levels"
    >
      <div className="max-moves-heading">Max Move Levels</div>
      <div className="max-moves-row">
        {/* Max Attack */}
        <div className="max-move">
          <label htmlFor="max-attack" className="max-move-label">
            <span className="max-text">Max</span>
            <span className="move-name">Attack</span>
          </label>
          <select
            id="max-attack"
            aria-label="Max Attack"
            value={maxAttack || "1"}
            onChange={(e) => handleMaxAttackChange(e.target.value)}
            disabled={!editMode}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        {/* Max Guard */}
        <div className="max-move">
          <label htmlFor="max-guard" className="max-move-label">
            <span className="max-text">Max</span>
            <span className="move-name">Guard</span>
          </label>
          <select
            id="max-guard"
            aria-label="Max Guard"
            value={maxGuard || "0"}
            onChange={(e) => handleMaxGuardChange(e.target.value)}
            disabled={!editMode}
          >
            <option value="0">Locked</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        {/* Max Spirit */}
        <div className="max-move">
          <label htmlFor="max-spirit" className="max-move-label">
            <span className="max-text">Max</span>
            <span className="move-name">Spirit</span>
          </label>
          <select
            id="max-spirit"
            aria-label="Max Spirit"
            value={maxSpirit || "0"}
            onChange={(e) => handleMaxSpiritChange(e.target.value)}
            disabled={!editMode}
          >
            <option value="0">Locked</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MaxMovesComponent;
