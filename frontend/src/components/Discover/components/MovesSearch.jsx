// MovesSearch.jsx

import React, { useState } from 'react';
import './MovesSearch.css'; // Import any specific CSS for MovesComponent

const MovesSearch = ({ pokemon, selectedMoves, editMode, onMovesChange }) => {
  const allMoves = pokemon?.moves || [];
  const fastMoves = allMoves.filter(move => move.is_fast);
  const chargedMoves = allMoves.filter(move => !move.is_fast);

  const getDefaultMoveId = (moves, currentId) => (
    moves.length > 0 ? (moves.find(move => move.move_id === currentId) || moves[0]).move_id : ''
  );

  const [fastMove, setFastMove] = useState(getDefaultMoveId(fastMoves, selectedMoves.fastMove));
  const [chargedMove1, setChargedMove1] = useState(getDefaultMoveId(chargedMoves, selectedMoves.chargedMove1));
  const [chargedMove2, setChargedMove2] = useState(selectedMoves.chargedMove2 ? getDefaultMoveId(chargedMoves, selectedMoves.chargedMove2) : '');

  const getMoveById = (id) => allMoves.find(move => move.move_id === id);

  const handleMoveChange = (event, moveType) => {
    const selectedMoveId = event.target.value ? Number(event.target.value) : '';
    if (moveType === 'fast') {
      setFastMove(selectedMoveId);
      onMovesChange({ fastMove: selectedMoveId, chargedMove1, chargedMove2 });
    } else if (moveType === 'charged1') {
      setChargedMove1(selectedMoveId);
      onMovesChange({ fastMove, chargedMove1: selectedMoveId, chargedMove2 });
    } else {
      setChargedMove2(selectedMoveId);
      onMovesChange({ fastMove, chargedMove1, chargedMove2: selectedMoveId });
    }
  };

  const addSecondChargedMove = () => {
    const firstAvailableMove = chargedMoves.find(move => move.move_id !== chargedMove1);
    if (firstAvailableMove) {
      const newChargedMove2 = firstAvailableMove.move_id;
      setChargedMove2(newChargedMove2);
      onMovesChange({ fastMove, chargedMove1, chargedMove2: newChargedMove2 });
    }
  };

  const renderMoveOptions = (moves, selectedMove, moveType) => {
    const filteredMoves = moves.filter(move => !(moveType.includes('charged') && ((moveType === 'charged1' && move.move_id === chargedMove2) || (moveType === 'charged2' && move.move_id === chargedMove1))));
    const move = getMoveById(selectedMove);
    return (
      <div className="moves-search-option-container">
        {/* Use absolute path or path relative to the public directory for images */}
        {move && (
          <img src={`/images/types/${move?.type.toLowerCase()}.png`} alt={move?.type_name} className="moves-search-type-icon" />
        )}
        <select value={selectedMove || ''} onChange={(event) => handleMoveChange(event, moveType)} className="moves-search-select">
          <option value="" disabled>Select a move</option>
          {filteredMoves.map(move => (
            <option key={move.move_id} value={move.move_id}>{move.name}</option>
          ))}
        </select>
        <div className="moves-search-spacer"></div>
      </div>
    );
  };

  const renderMoveInfo = (moveId, moveType) => {
    const move = getMoveById(moveId);
    if (!move) return 'No moves available';
    return (
      <div className="moves-search-info">
        {/* Use absolute path or path relative to the public directory for images */}
        <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type_name} className="moves-search-type-icon" />
        <span className="moves-search-name">{move.name}</span>
        <div className="moves-search-spacer"></div>
      </div>
    );
  };

  return (
    <div className={`moves-search-container ${editMode ? 'moves-search-editable' : ''}`}>
      <div className="moves-search-section">
        {editMode ? renderMoveOptions(fastMoves, fastMove, 'fast') : renderMoveInfo(fastMove, 'fast')}
      </div>
      <div className="moves-search-section">
        {editMode ? renderMoveOptions(chargedMoves, chargedMove1, 'charged1') : renderMoveInfo(chargedMove1, 'charged1')}
      </div>
      <div className="moves-search-section">
        {chargedMove2 ? (
            editMode ? renderMoveOptions(chargedMoves, chargedMove2, 'charged2') : renderMoveInfo(chargedMove2, 'charged2')
        ) : (
            <button onClick={editMode ? addSecondChargedMove : undefined} className="moves-search-icon-button moves-search-add-move-button">
                <span className="moves-search-move-add-icon">+</span>
            </button>
        )}
      </div>
    </div>
  );
};

export default MovesSearch;
