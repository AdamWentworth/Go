// MaxMovesComponent.tsx

import React, { useEffect } from "react";
import "./MaxMovesComponent.css";

interface PokemonProps {
  pokemonKey: string;
}

interface MaxMovesComponentProps {
  pokemon: PokemonProps;
  editMode: boolean;
  showMaxOptions: boolean;
  setShowMaxOptions: (show: boolean) => void;
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
  showMaxOptions,
  setShowMaxOptions,
  maxAttack,
  maxGuard,
  maxSpirit,
  handleMaxAttackChange,
  handleMaxGuardChange,
  handleMaxSpiritChange,
}) => {
  useEffect(() => {
    if (!editMode) {
      setShowMaxOptions(false);
    }
  }, [editMode, setShowMaxOptions]);

  return (
    <div
      className={`max-options-container ${showMaxOptions ? "show" : ""}`}
      id={`max-options-${pokemon.pokemonKey}`}
    >
      <div className="max-moves-row">
        {/* Max Attack */}
        <div className="max-move">
          <label htmlFor="max-attack" className="max-move-label">
            <span className="max-text">Max</span>
            <span className="move-name">Attack</span>
          </label>
          <select
            id="max-attack"
            value={maxAttack}
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
            value={maxGuard}
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
            value={maxSpirit}
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
