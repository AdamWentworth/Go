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
  moves?: Move[] | null;
};

const MoveDisplay: React.FC<Props> = ({ fastMoveId, chargedMove1Id, chargedMove2Id, moves }) => {
  const safeMoves = Array.isArray(moves) ? moves : [];

  const findMove = (id: number | null) => {
    if (id === null || id === undefined) return null;
    return safeMoves.find((move) => move.move_id === id) ?? null;
  };

  const renderMoveName = (move: Move) => (
    <p>{move.legacy ? <strong>{`${move.name ?? 'Unknown Move'}*`}</strong> : (move.name ?? 'Unknown Move')}</p>
  );

  const renderMove = (moveId: number | null) => {
    const move = findMove(moveId);
    if (!move) return null;
    const moveType = String(move.type ?? '').toLowerCase();
    const moveTypeName = move.type_name ?? move.type ?? 'Unknown';
    const iconPath = moveType ? `/images/types/${moveType}.png` : '/images/types/normal.png';

    return (
      <div className="move">
        <img
          src={iconPath}
          alt={moveTypeName}
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
