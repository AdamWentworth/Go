// MoveDisplay.jsx

import React from 'react';
import './MoveDisplay.css'; // Add specific styling for moves display if needed

const MoveDisplay = ({ fastMoveId, chargedMove1Id, chargedMove2Id, moves }) => {
  const fastMove = moves.find((move) => move.move_id === fastMoveId);
  const chargedMove1 = moves.find((move) => move.move_id === chargedMove1Id);
  const chargedMove2 = moves.find((move) => move.move_id === chargedMove2Id);

  const renderMoveName = (move) => {
    const isLegacy = move.legacy;
    return (
      <p>
        {isLegacy ? <strong>{`${move.name}*`}</strong> : move.name}
      </p>
    );
  };

  return (
    <div className="moves-container">
      {fastMove && (
        <div className="move">
          <img
            src={`/images/types/${fastMove.type.toLowerCase()}.png`}
            alt={fastMove.type_name}
            className="move-type-icon"
          />
          {renderMoveName(fastMove)}
        </div>
      )}
      {chargedMove1 && (
        <div className="move">
          <img
            src={`/images/types/${chargedMove1.type.toLowerCase()}.png`}
            alt={chargedMove1.type_name}
            className="move-type-icon"
          />
          {renderMoveName(chargedMove1)}
        </div>
      )}
      {chargedMove2 && (
        <div className="move">
          <img
            src={`/images/types/${chargedMove2.type.toLowerCase()}.png`}
            alt={chargedMove2.type_name}
            className="move-type-icon"
          />
          {renderMoveName(chargedMove2)}
        </div>
      )}
    </div>
  );
};

export default MoveDisplay;