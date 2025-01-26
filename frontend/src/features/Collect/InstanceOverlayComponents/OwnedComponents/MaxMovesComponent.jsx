import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "./MaxMovesComponent.css";

const MaxMovesComponent = ({
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
  // Close max moves container when edit mode is disabled
  useEffect(() => {
    if (!editMode) {
      setShowMaxOptions(false);
    }
  }, [editMode]);

  return (
    <div
      className={`max-options-container ${showMaxOptions ? "show" : ""}`}
      id={`max-options-${pokemon.pokemonKey}`}
      aria-hidden={!showMaxOptions}
    >
      <div className="max-moves-row">
        <div className="max-move">
          <label htmlFor="max-attack">Max Attack:</label>
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
        <div className="max-move">
          <label htmlFor="max-guard">Max Guard:</label>
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
        <div className="max-move">
          <label htmlFor="max-spirit">Max Spirit:</label>
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

MaxMovesComponent.propTypes = {
  pokemon: PropTypes.object.isRequired,
  editMode: PropTypes.bool.isRequired,
  showMaxOptions: PropTypes.bool.isRequired,
  setShowMaxOptions: PropTypes.func.isRequired,
  maxAttack: PropTypes.string.isRequired,
  maxGuard: PropTypes.string.isRequired,
  maxSpirit: PropTypes.string.isRequired,
  handleMaxAttackChange: PropTypes.func.isRequired,
  handleMaxGuardChange: PropTypes.func.isRequired,
  handleMaxSpiritChange: PropTypes.func.isRequired,
};

export default MaxMovesComponent;
