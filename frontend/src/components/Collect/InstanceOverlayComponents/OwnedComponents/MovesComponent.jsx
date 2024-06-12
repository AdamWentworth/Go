// MovesComponent.jsx

import React, { useState } from 'react';
import './MovesComponent.css';

const MovesComponent = ({ pokemon, editMode }) => {
  const allMoves = pokemon.moves;
  const fastMoves = allMoves.filter(move => move.is_fast);
  const chargedMoves = allMoves.filter(move => !move.is_fast);

  const getDefaultMoveId = (moves, currentId) => (
    moves.length > 0 ? (moves.find(move => move.move_id === currentId) || moves[0]).move_id : null
  );

  const [fastMove, setFastMove] = useState(getDefaultMoveId(fastMoves, pokemon.ownershipStatus.fast_move_id));
  const [chargedMove1, setChargedMove1] = useState(getDefaultMoveId(chargedMoves, pokemon.ownershipStatus.charged_move1_id));
  const [chargedMove2, setChargedMove2] = useState(pokemon.ownershipStatus.charged_move2_id ? getDefaultMoveId(chargedMoves, pokemon.ownershipStatus.charged_move2_id) : null);

  const getMoveById = (id) => allMoves.find(move => move.move_id === id);

  const handleMoveChange = (event, moveType) => {
    const selectedMoveId = Number(event.target.value);
    if (moveType === 'fast') {
      setFastMove(selectedMoveId);
    } else if (moveType === 'charged1') {
      setChargedMove1(selectedMoveId);
    } else {
      setChargedMove2(selectedMoveId);
    }
  };

  const addSecondChargedMove = () => {
    const firstAvailableMove = chargedMoves.find(move => move.move_id !== chargedMove1); // Find the first different move
    setChargedMove2(firstAvailableMove.move_id);
  };

  const renderMoveOptions = (moves, selectedMove, moveType) => {
    // Exclude already selected move for charged moves
    const filteredMoves = moves.filter(move => !(moveType.includes('charged') && ((moveType === 'charged1' && move.move_id === chargedMove2) || (moveType === 'charged2' && move.move_id === chargedMove1))));
    
    const move = getMoveById(selectedMove);
    return (
      <div className="move-option-container">
        <img src={`/images/types/${move?.type.toLowerCase()}.png`} alt={move?.type_name} className="type-icon" />
        <select value={selectedMove} onChange={(event) => handleMoveChange(event, moveType)} className="move-select">
          {filteredMoves.map(move => (
            <option key={move.move_id} value={move.move_id}>{move.name}</option>
          ))}
        </select>
        <div className="spacer"></div>
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
        <div className="spacer"></div>
      </div>
    );
  };

  return (
    <div className={`moves-container ${editMode ? 'editable' : ''}`}>
      <div className="move-section">
        {editMode ? renderMoveOptions(fastMoves, fastMove, 'fast') : renderMoveInfo(fastMove, 'fast')}
      </div>
      <div className="move-section">
        {editMode ? renderMoveOptions(chargedMoves, chargedMove1, 'charged1') : renderMoveInfo(chargedMove1, 'charged1')}
      </div>
      <div className="move-section">
        {chargedMove2 ? (
            editMode ? renderMoveOptions(chargedMoves, chargedMove2, 'charged2') : renderMoveInfo(chargedMove2, 'charged2')
        ) : (
            <button onClick={editMode ? addSecondChargedMove : undefined} className="icon-button add-move-button">
                <span className="move-add-icon">+</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default MovesComponent;

