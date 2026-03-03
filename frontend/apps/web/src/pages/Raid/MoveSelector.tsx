import React from 'react';

type RaidMove = {
  name: string;
};

type MoveSelectorProps = {
  moves: RaidMove[];
  selectedMove?: RaidMove | null;
  onMoveSelect: (move: RaidMove | undefined) => void;
  moveType: string;
};

const MoveSelector: React.FC<MoveSelectorProps> = ({
  moves,
  selectedMove,
  onMoveSelect,
  moveType,
}) => {
  return (
    <div className="move-selector">
      <label>{moveType} Move: </label>
      <select
        value={selectedMove?.name ?? ''}
        onChange={(event) => {
          const selected = moves.find((move) => move.name === event.target.value);
          onMoveSelect(selected);
        }}
      >
        <option value="">Select a move</option>
        {moves.map((move) => (
          <option key={move.name} value={move.name}>
            {move.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MoveSelector;
