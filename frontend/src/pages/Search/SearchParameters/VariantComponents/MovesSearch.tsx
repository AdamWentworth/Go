import React, { useEffect, useState } from 'react';

import './MovesSearch.css';

type MoveOption = {
  move_id: number;
  name: string;
  is_fast?: number | boolean;
  legacy?: boolean;
  type?: string;
  type_name?: string;
};

export type SelectedMoves = {
  fastMove: number | '' | null;
  chargedMove1: number | '' | null;
  chargedMove2: number | '' | null;
};

type MovesSearchProps = {
  pokemon?: {
    moves?: MoveOption[];
  } | null;
  selectedMoves: SelectedMoves;
  onMovesChange: (nextMoves: SelectedMoves) => void;
};

const DEFAULT_MOVE: MoveOption = {
  name: 'Any Move',
  move_id: 0,
};

const getDefaultMoveId = (
  moves: MoveOption[],
  currentId: number | '' | null,
): number | '' => {
  if (moves.length === 0) {
    return '';
  }

  const matchingMove = moves.find((move) => move.move_id === currentId);
  return matchingMove?.move_id ?? '';
};

const MovesSearch: React.FC<MovesSearchProps> = ({
  pokemon,
  selectedMoves,
  onMovesChange,
}) => {
  const allMoves = pokemon?.moves?.length ? pokemon.moves : [DEFAULT_MOVE];
  const fastMoves = allMoves.filter((move) => Boolean(move.is_fast));
  const chargedMoves = allMoves.filter((move) => !move.is_fast);

  const [fastMove, setFastMove] = useState<number | ''>(
    getDefaultMoveId(fastMoves, selectedMoves.fastMove),
  );
  const [chargedMove1, setChargedMove1] = useState<number | ''>(
    getDefaultMoveId(chargedMoves, selectedMoves.chargedMove1),
  );
  const [chargedMove2, setChargedMove2] = useState<number | ''>(
    selectedMoves.chargedMove2
      ? getDefaultMoveId(chargedMoves, selectedMoves.chargedMove2)
      : '',
  );

  // Keep existing behavior: emit when local move selections change.
  useEffect(() => {
    onMovesChange({ fastMove, chargedMove1, chargedMove2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fastMove, chargedMove1, chargedMove2]);

  const getMoveById = (id: number | ''): MoveOption | undefined =>
    allMoves.find((move) => move.move_id === id);

  const handleMoveChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
    moveType: 'fast' | 'charged1' | 'charged2',
  ) => {
    const selectedMoveId = event.target.value ? Number(event.target.value) : '';

    if (moveType === 'fast') {
      setFastMove(selectedMoveId);
      return;
    }

    if (moveType === 'charged1') {
      setChargedMove1(selectedMoveId);
      return;
    }

    setChargedMove2(selectedMoveId);
  };

  const addSecondChargedMove = () => {
    const firstAvailableMove = chargedMoves.find(
      (move) => move.move_id !== chargedMove1,
    );
    if (firstAvailableMove) {
      setChargedMove2(firstAvailableMove.move_id);
    }
  };

  const renderMoveOptions = (
    moves: MoveOption[],
    selectedMove: number | '',
    moveType: 'fast' | 'charged1' | 'charged2',
  ) => {
    const filteredMoves = moves.filter(
      (move) =>
        !(
          moveType.includes('charged') &&
          ((moveType === 'charged1' && move.move_id === chargedMove2) ||
            (moveType === 'charged2' && move.move_id === chargedMove1))
        ),
    );

    const move = getMoveById(selectedMove);
    const moveTypeIcon =
      move && typeof move.type === 'string' && move.type.length > 0
        ? move.type.toLowerCase()
        : null;

    return (
      <div className="moves-search-option-container">
        {move && moveTypeIcon && (
          <img
            src={`/images/types/${moveTypeIcon}.png`}
            alt={move.type_name ?? move.type ?? 'Move Type'}
            className="moves-search-type-icon"
          />
        )}
        <select
          value={selectedMove || ''}
          onChange={(event) => handleMoveChange(event, moveType)}
          className="moves-search-select"
          style={move?.legacy ? { fontWeight: 'bold' } : {}}
        >
          <option value="">Any Move</option>
          {filteredMoves.map((entry) => (
            <option
              key={entry.move_id}
              value={entry.move_id}
              style={entry.legacy ? { fontWeight: 'bold' } : {}}
            >
              {entry.name}
              {entry.legacy ? '*' : ''}
            </option>
          ))}
        </select>
        <div className="moves-search-spacer" />
      </div>
    );
  };

  return (
    <div className="moves-search-container">
      <div className="moves-search-section">
        {renderMoveOptions(fastMoves, fastMove, 'fast')}
      </div>
      <div className="moves-search-section">
        {renderMoveOptions(chargedMoves, chargedMove1, 'charged1')}
      </div>
      <div className="moves-search-section">
        {chargedMove2 ? (
          renderMoveOptions(chargedMoves, chargedMove2, 'charged2')
        ) : (
          <button
            type="button"
            onClick={addSecondChargedMove}
            className="moves-search-icon-button moves-search-add-move-button"
          >
            <span className="moves-search-move-add-icon">+</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MovesSearch;
