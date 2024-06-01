import React from 'react';

const MoveSelect = ({ label, field, isFast, moves, selectedMove, onChange }) => {
  const renderMoveOptions = (moveList, isFastMove) => {
    return moveList
      .filter(move => move.is_fast === (isFastMove ? 1 : 0))
      .map(move => <option key={move.move_id} value={move.move_id}>{move.name}</option>);
  };

  return (
    <div className="moves-column">
      <h3>{label}</h3>
      {Array.isArray(selectedMove) ? (
        selectedMove.map((moveId, index) => (
          <select
            key={index}
            value={moveId}
            onChange={(e) => onChange(Number(e.target.value), index)}
          >
            {renderMoveOptions(moves, isFast)}
          </select>
        ))
      ) : (
        <select
          value={selectedMove}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {renderMoveOptions(moves, isFast)}
        </select>
      )}
    </div>
  );
};

export default MoveSelect;
