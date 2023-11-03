/* moveList.jsx */

import React from 'react';
import './moveList.css'; // Now correctly pointing to the CSS file specific to MoveList

function getTypeIconPath(typeName) {
  return `/images/types/${typeName.toLowerCase()}.png`;
}

function MoveList({ moves }) {
  const fastAttacks = moves.filter(move => move.is_fast === 1);
  const chargedAttacks = moves.filter(move => move.is_fast === 0);

  const handleClick = (event) => {
    event.stopPropagation();
  };


  return (
    <div className="column moves-column" onClick={handleClick}>
      <h1>Moves</h1>
      <h2>Fast Attacks</h2>
      <ul>
        {fastAttacks.map((move) => (
          <li key={`fast-${move.move_id}`}>
            <img className="type-icon" src={getTypeIconPath(move.type_name)} alt={`${move.type_name} type`} />
            {move.name}
          </li>
        ))}
      </ul>
      <h2>Charged Attacks</h2>
      <ul>
        {chargedAttacks.map((move) => (
          <li key={`charged-${move.move_id}`}>
            <img className="type-icon" src={getTypeIconPath(move.type_name)} alt={`${move.type_name} type`} />
            {move.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MoveList;
