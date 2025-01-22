// MovesComponent.jsx
import React, { useState, useEffect } from 'react';
import './MovesComponent.css';

const MovesComponent = ({ pokemon, editMode, onMovesChange }) => {
  const allMoves = pokemon.moves;
  
  // Updated to allow "unselected move" as default
  const [fastMove, setFastMove] = useState(pokemon.ownershipStatus.fast_move_id || null);
  const [chargedMove1, setChargedMove1] = useState(pokemon.ownershipStatus.charged_move1_id || null);
  const [chargedMove2, setChargedMove2] = useState(pokemon.ownershipStatus.charged_move2_id || null);

  // Whenever the parent updates 'pokemon', reset local states
  useEffect(() => {
    if (pokemon?.ownershipStatus) {
      setFastMove(pokemon.ownershipStatus.fast_move_id || null);
      setChargedMove1(pokemon.ownershipStatus.charged_move1_id || null);
      setChargedMove2(pokemon.ownershipStatus.charged_move2_id || null);
    }
  }, [pokemon]);
  
  const fastMoves = allMoves.filter(move => move.is_fast);
  const chargedMoves = allMoves.filter(move => !move.is_fast);

  const getMoveById = (id) => allMoves.find(move => move.move_id === id);

  const handleMoveChange = (event, moveType) => {
    const selectedMoveId = Number(event.target.value) || null;
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

  const getFusionId = () => {
    const fusionForm = pokemon?.ownershipStatus?.fusion_form;
    if (!fusionForm) {
      return null;
    }
    if (!pokemon?.fusion || !Array.isArray(pokemon.fusion)) {
      return null;
    }
    const matchingFusion = pokemon.fusion.find(f => f.name === fusionForm);
    const fusionId = matchingFusion ? matchingFusion.fusion_id : null;
    return fusionId;
  };

  const fusionId = getFusionId();

  const renderMoveOptions = (moves, selectedMove, moveType) => {
  
    const filteredMoves = moves.filter(move => {
      // Exclude moves with a fusion_id if no fusion_form is present.
      if (fusionId == null && move.fusion_id != null) {
        return false;
      }
      // If fusionId exists and the move has a fusion_id, require a match.
      if (fusionId != null && move.fusion_id != null && move.fusion_id !== fusionId) {
        return false;
      }
      // Existing filtering for charged move conflicts.
      if (
        moveType.includes('charged') &&
        ((moveType === 'charged1' && move.move_id === chargedMove2) ||
         (moveType === 'charged2' && move.move_id === chargedMove1))
      ) {
        return false;
      }
      return true;
    });
  
    const move = getMoveById(selectedMove);
  
    return (
      <div className="move-option-container">
        {/* Only show type icon if a valid move is selected */}
        {move && selectedMove ? (
          <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type_name} className="type-icon" />
        ) : (
          <span className="no-type-icon"></span>
        )}
        <select 
          value={selectedMove || ''} 
          onChange={(event) => handleMoveChange(event, moveType)} 
          className="move-select"
        >
          <option value="">Unselected move</option>
          {filteredMoves.map(move => (
            <option 
              key={move.move_id} 
              value={move.move_id} 
              style={move.legacy ? { fontWeight: 'bold' } : {}}
            >
              {move.name}{move.legacy ? '*' : ''}
            </option>
          ))}
        </select>
        <div className="spacer"></div>
      </div>
    );
  };  

  const renderMoveInfo = (moveId, moveType) => {
    if (!moveId) return <span className="unselected-move">Unselected move</span>;
    
    const move = getMoveById(moveId);
    if (!move) return 'No moves available';
    
    return (
      <div className="move-info">
        <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type_name} className="type-icon" />
        <span className="move-name" style={move.legacy ? { fontWeight: 'bold' } : {}}>
          {move.name}{move.legacy ? '*' : ''}
        </span>
        <div className="spacer"></div>
      </div>
    );
  };

  // New check: If all moves are null and edit mode is off, render nothing
  if (!editMode && !fastMove && !chargedMove1 && !chargedMove2) {
    return null;
  }

  return (
    <div className={`moves-container ${editMode ? 'editable' : ''}`}>
      <div className="move-section">
        {editMode 
          ? renderMoveOptions(fastMoves, fastMove, 'fast') 
          : renderMoveInfo(fastMove, 'fast')}
      </div>
      <div className="move-section">
        {editMode 
          ? renderMoveOptions(chargedMoves, chargedMove1, 'charged1') 
          : renderMoveInfo(chargedMove1, 'charged1')}
      </div>
      <div className="move-section">
        {chargedMove2 ? (
          editMode 
            ? renderMoveOptions(chargedMoves, chargedMove2, 'charged2') 
            : renderMoveInfo(chargedMove2, 'charged2')
        ) : editMode ? (
          <button onClick={addSecondChargedMove} className="icon-button add-move-button">
            <span className="move-add-icon">+</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default MovesComponent;
