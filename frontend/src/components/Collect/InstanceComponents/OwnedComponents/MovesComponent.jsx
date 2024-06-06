// MovesComponent.jsx

import React, { useState } from 'react';
import './MovesComponent.css';

const MovesComponent = ({ pokemon }) => {
  const allMoves = pokemon.moves;
  const fastMoves = allMoves.filter(move => move.is_fast);
  const chargedMoves = allMoves.filter(move => !move.is_fast);

  const getDefaultMoveId = (moves, currentId) => (
    moves.length > 0 ? (moves.find(move => move.move_id === currentId) || moves[0]).move_id : null
  );

  const [fastMove, setFastMove] = useState(getDefaultMoveId(fastMoves, pokemon.ownershipStatus.fast_move_id));
  const [chargedMove1, setChargedMove1] = useState(getDefaultMoveId(chargedMoves, pokemon.ownershipStatus.charged_move1_id));
  const [chargedMove2, setChargedMove2] = useState(getDefaultMoveId(chargedMoves, pokemon.ownershipStatus.charged_move2_id));
  const [editMode, setEditMode] = useState({ fast: false, charged1: false, charged2: false });

  const getMoveById = (id) => allMoves.find(move => move.move_id === id);

  const handleMoveChange = (event, moveType) => {
    const selectedMoveId = Number(event.target.value);
    if (moveType === 'fast') setFastMove(selectedMoveId);
    else if (moveType === 'charged1') setChargedMove1(selectedMoveId);
    else setChargedMove2(selectedMoveId);
  };

  const toggleEditMode = (type, value) => {
    setEditMode(prev => ({ ...prev, [type]: value }));
  };

  const renderMoveOptions = (moves, selectedMove, moveType) => {
    const move = getMoveById(selectedMove);
    return (
      <div className="move-option-container">
        <img src={`/images/types/${move?.type.toLowerCase()}.png`} alt={move?.type_name} className="type-icon" />
        <select value={selectedMove} onChange={(event) => handleMoveChange(event, moveType)} className="move-select">
          {moves.map(move => (
            <option key={move.move_id} value={move.move_id}>{move.name}</option>
          ))}
        </select>
        <button onClick={() => toggleEditMode(moveType, false)} className="icon-button">
          <img src="/images/save-icon.png" alt="Save" className="move-edit-icon" />
        </button>
      </div>
    );
  };

  const renderMoveInfo = (moveId, moveType) => {
    const move = getMoveById(moveId);
    if (!move) return 'No moves available';
    return (
      <div className="move-info">
        <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type_name} className="type-icon" />
        <span className="move-name">{move.name}</span>
        <button onClick={() => toggleEditMode(moveType, true)} className="icon-button">
          <img src="/images/edit-icon.png" alt="Edit" className="move-edit-icon" />
        </button>
      </div>
    );
  };

  return (
    <div className="moves-container">
      <div className="move-section">
        {editMode.fast ? renderMoveOptions(fastMoves, fastMove, 'fast') : renderMoveInfo(fastMove, 'fast')}
      </div>
      <div className="move-section">
        {editMode.charged1 ? renderMoveOptions(chargedMoves, chargedMove1, 'charged1') : renderMoveInfo(chargedMove1, 'charged1')}
      </div>
      <div className="move-section">
        {editMode.charged2 ? renderMoveOptions(chargedMoves, chargedMove2, 'charged2') : renderMoveInfo(chargedMove2, 'charged2')}
      </div>
    </div>
  );
};

export default MovesComponent;
