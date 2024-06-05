// PvPMovesComponent.jsx

import React, { useState, useEffect } from 'react';
import './PvPMovesComponent.css';

const PvPMovesComponent = ({ pokemon }) => {
  const allMoves = pokemon.moves;
  const fastMoves = allMoves.filter(move => move.is_fast);
  const chargedMoves = allMoves.filter(move => !move.is_fast);

  const getDefaultMoveId = (moves, currentId) => {
    return moves && moves.length > 0 ? (moves.find(move => move.move_id === currentId) ? currentId : moves[0].move_id) : null;
  };

  const [fastMove, setFastMove] = useState(getDefaultMoveId(fastMoves, pokemon.ownershipStatus.fast_move_id));
  const [chargedMove1, setChargedMove1] = useState(getDefaultMoveId(chargedMoves, pokemon.ownershipStatus.charged_move1_id));
  const [chargedMove2, setChargedMove2] = useState(getDefaultMoveId(chargedMoves, pokemon.ownershipStatus.charged_move2_id));
  const [editMode, setEditMode] = useState({fast: false, charged1: false, charged2: false});

  const getMoveById = (id) => allMoves.find(move => move.move_id === id);

  const renderMoveOptions = (moves, selectedMove, moveType) => (
    <select value={selectedMove || ''} onChange={(event) => handleMoveChange(event, moveType)}>
      <option value="">Select move</option>
      {moves.map(move => (
        <option key={move.move_id} value={move.move_id}>{move.name} ({move.type_name})</option>
      ))}
    </select>
  );

  const handleMoveChange = (event, moveType) => {
    const selectedMoveId = Number(event.target.value);
    if (moveType === 'fast') setFastMove(selectedMoveId);
    else if (moveType === 'charged1') setChargedMove1(selectedMoveId);
    else if (moveType === 'charged2') setChargedMove2(selectedMoveId);
  };

  const toggleEditMode = (type) => {
    setEditMode(prev => ({...prev, [type]: !prev[type]}));
  };

  const renderMoveInfo = (moveId, moveType) => {
    const move = getMoveById(moveId);
    if (!move) return 'No moves available';
    return (
      <div className="move-info">
        <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type_name} className="type-icon" />
        <span className="move-name">{move.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span className="move-power">{move.pvp_power}</span>
          <img src={`/images/edit-icon.png`} alt="Edit" className="move-edit-icon" onClick={() => toggleEditMode(moveType)} />
        </div>
      </div>
    );
  };  

  return (
    <div className="pvp-moves-container">
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

export default PvPMovesComponent;
