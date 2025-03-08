// Moves.jsx
import React, { useState, useEffect } from 'react';
import './Moves.css';

const Moves = ({ pokemon, editMode, onMovesChange, isShadow, isPurified }) => {
  const allMoves = pokemon.moves;

  // Initialize state with possible existing moves or null
  const [fastMove, setFastMove] = useState(pokemon.ownershipStatus.fast_move_id || null);
  const [chargedMove1, setChargedMove1] = useState(pokemon.ownershipStatus.charged_move1_id || null);
  const [chargedMove2, setChargedMove2] = useState(pokemon.ownershipStatus.charged_move2_id || null);

  // Effect to reset moves only when 'pokemon' prop changes
  useEffect(() => {
    if (pokemon?.ownershipStatus) {
      setFastMove(pokemon.ownershipStatus.fast_move_id || null);
      setChargedMove1(pokemon.ownershipStatus.charged_move1_id || null);
      setChargedMove2(pokemon.ownershipStatus.charged_move2_id || null);
    }
  }, [pokemon]);

  // Effect to handle move replacement based on isShadow and isPurified
  useEffect(() => {
    const updateMovesBasedOnStatus = () => {
      let updated = false;
      const updatedMoves = { fastMove, chargedMove1, chargedMove2 };

      // Handle replacement from Frustration to Return
      if (!isShadow && isPurified) {
        if (chargedMove1 === 228) {
          updatedMoves.chargedMove1 = 229;
          updated = true;
        }
        if (chargedMove2 === 228) {
          updatedMoves.chargedMove2 = 229;
          updated = true;
        }
      }

      // Handle replacement from Return to Frustration
      if (!isPurified && isShadow) {
        if (chargedMove1 === 229) {
          updatedMoves.chargedMove1 = 228;
          updated = true;
        }
        if (chargedMove2 === 229) {
          updatedMoves.chargedMove2 = 228;
          updated = true;
        }
      }

      // If "Frustration" is selected but isShadow is false and isPurified is false, deselect it
      if (chargedMove1 === 228 && !isShadow && !isPurified) {
        updatedMoves.chargedMove1 = null;
        updated = true;
      }
      if (chargedMove2 === 228 && !isShadow && !isPurified) {
        updatedMoves.chargedMove2 = null;
        updated = true;
      }

      // If "Return" is selected but isPurified is false and isShadow is false, deselect it
      if (chargedMove1 === 229 && !isPurified && !isShadow) {
        updatedMoves.chargedMove1 = null;
        updated = true;
      }
      if (chargedMove2 === 229 && !isPurified && !isShadow) {
        updatedMoves.chargedMove2 = null;
        updated = true;
      }

      if (updated) {
        setChargedMove1(updatedMoves.chargedMove1);
        setChargedMove2(updatedMoves.chargedMove2);
        onMovesChange({
          fastMove: updatedMoves.fastMove,
          chargedMove1: updatedMoves.chargedMove1,
          chargedMove2: updatedMoves.chargedMove2,
        });
      }
    };

    updateMovesBasedOnStatus();
  }, [isShadow, isPurified]);

  // Filter fast and charged moves
  const fastMoves = allMoves.filter(move => move.is_fast);

  // Conditionally add "Frustration" and "Return" to charged moves
  let chargedMoves = allMoves.filter(move => !move.is_fast);

  // Add "Frustration" if the Pokémon is a shadow Pokémon
  if (isShadow) {
    const frustrationMove = allMoves.find(move => move.move_id === 228);
    if (frustrationMove && !chargedMoves.some(move => move.move_id === 228)) {
      chargedMoves = [...chargedMoves, frustrationMove];
    } else if (!frustrationMove) {
      // Manually add "Frustration" if it's not present in allMoves
      chargedMoves = [
        ...chargedMoves,
        {
          move_id: 228,
          name: 'Frustration',
          type: 'Normal',
          is_fast: false,
          legacy: false, // Set to true if it's a legacy move
          fusion_id: null, // Set accordingly if applicable
        }
      ];
    }
  }

  // Add "Return" if the Pokémon is purified
  if (isPurified) {
    const returnMove = allMoves.find(move => move.move_id === 229);
    if (returnMove && !chargedMoves.some(move => move.move_id === 229)) {
      chargedMoves = [...chargedMoves, returnMove];
    } else if (!returnMove) {
      // Manually add "Return" if it's not present in allMoves
      chargedMoves = [
        ...chargedMoves,
        {
          move_id: 229,
          name: 'Return',
          type: 'Normal',
          is_fast: false,
          legacy: false, // Set to true if it's a legacy move
          fusion_id: null, // Set accordingly if applicable
        }
      ];
    }
  }

  // Function to retrieve move details by ID
  const getMoveById = (id) => {
    const move = allMoves.find(move => move.move_id === id);
    // If move not found and id is 228 (Frustration) with shadow status, return manually added move
    if (!move && id === 228 && isShadow) {
      return {
        move_id: 228,
        name: 'Frustration',
        type: 'Normal',
        is_fast: false,
        legacy: false,
        fusion_id: null,
      };
    }
    // If move not found and id is 229 (Return) with purified status, return manually added move
    if (!move && id === 229 && isPurified) {
      return {
        move_id: 229,
        name: 'Return',
        type: 'Normal',
        is_fast: false,
        legacy: false,
        fusion_id: null,
      };
    }
    return move || null;
  };

  // Retrieve fusion ID if applicable
  const getFusionId = () => {
    const fusionForm = pokemon?.ownershipStatus?.fusion_form;
    if (!fusionForm || !pokemon?.fusion || !Array.isArray(pokemon.fusion)) {
      return null;
    }
    const matchingFusion = pokemon.fusion.find(f => f.name === fusionForm);
    return matchingFusion ? matchingFusion.fusion_id : null;
  };

  const fusionId = getFusionId();

  // Handle move selection changes
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

  // Function to add a second charged move
  const addSecondChargedMove = () => {
    const firstAvailableMove = chargedMoves.find(
      move => move.move_id !== chargedMove1 && move.move_id !== 228 && move.move_id !== 229
    );
    if (firstAvailableMove) {
      const newChargedMove2 = firstAvailableMove.move_id;
      setChargedMove2(newChargedMove2);
      onMovesChange({ fastMove, chargedMove1, chargedMove2: newChargedMove2 });
    }
  };

  // Render move options for selection
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
      // Prevent selecting the same charged move in both slots.
      if (
        moveType.includes('charged') &&
        ((moveType === 'charged1' && move.move_id === chargedMove2) ||
          (moveType === 'charged2' && move.move_id === chargedMove1))
      ) {
        return false;
      }

      // Handle move exclusivity
      if (move.shadow === 1 && !isShadow) {
        return false;
      }
      if (move.purified === 1 && !isPurified) {
        return false;
      }

      return true;
    });

    const move = getMoveById(selectedMove);

    return (
      <div className="move-option-container">
        {/* Display type icon if a valid move is selected */}
        {move && selectedMove ? (
          <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type} className="type-icon" />
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

  // Render move information when not in edit mode
  const renderMoveInfo = (moveId, moveType) => {
    if (!moveId) return <span className="unselected-move">Unselected move</span>;

    const move = getMoveById(moveId);
    if (!move) return 'No moves available';

    return (
      <div className="move-info">
        <img src={`/images/types/${move.type.toLowerCase()}.png`} alt={move.type} className="type-icon" />
        <span className="move-name" style={move.legacy ? { fontWeight: 'bold' } : {}}>
          {move.name}{move.legacy ? '*' : ''}
        </span>
        <div className="spacer"></div>
      </div>
    );
  };

  // If not in edit mode and no moves are selected, render nothing
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

export default Moves;
