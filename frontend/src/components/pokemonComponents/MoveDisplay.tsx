// MoveDisplay.tsx
import React from 'react';
import './MoveDisplay.css';

type Move = {
  move_id: number;
  name: string;
  type: string;
  type_name: string;
  legacy?: boolean;
};

type Props = {
  fastMoveId: number | null;
  chargedMove1Id: number | null;
  chargedMove2Id: number | null;
  moves: Move[];
};

const MoveDisplay: React.FC<Props> = ({ fastMoveId, chargedMove1Id, chargedMove2Id, moves }) => {
  const findMove = (id: number | null) => moves.find((move) => move.move_id === id);

  const renderMoveName = (move: Move) => (
    <p>{move.legacy ? <strong>{`${move.name}*`}</strong> : move.name}</p>
  );

  const renderMove = (moveId: number | null) => {
    const move = findMove(moveId);
    if (!move) return null;
    return (
      <div className="move">
        <img
          src={`/images/types/${move.type.toLowerCase()}.png`}
          alt={move.type_name}
          className="move-type-icon"
        />
        {renderMoveName(move)}
      </div>
    );
  };

  return (
    <div className="moves-container">
      {renderMove(fastMoveId)}
      {renderMove(chargedMove1Id)}
      {renderMove(chargedMove2Id)}
    </div>
  );
};

export default MoveDisplay;
