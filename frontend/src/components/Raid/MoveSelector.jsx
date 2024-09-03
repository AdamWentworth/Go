// MoveSelector.jsx
import React from 'react';

function MoveSelector({ moves, selectedMove, onMoveSelect, moveType }) {
    return (
        <div className="move-selector">
            <label>{moveType} Move: </label>
            <select
                value={selectedMove ? selectedMove.name : ''}
                onChange={e => {
                    const move = moves.find(move => move.name === e.target.value);
                    onMoveSelect(move);
                }}
            >
                <option value="">Select a move</option>
                {moves.map(move => (
                    <option key={move.name} value={move.name}>
                        {move.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default MoveSelector;
