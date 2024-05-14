import React from 'react';
import './moveList.css';

function getTypeIconPath(typeName) {
  return `/images/types/${typeName.toLowerCase()}.png`;
}

function formatMoveName(name, isLegacy) {
  if (isLegacy) {
    return (
      <strong>
        {name}*
      </strong>
    );
  }
  return name;
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

      {fastAttacks.length > 0 && (
        <>
          <h2>Fast Attacks</h2>
          <table className="moves-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>PvP</th>
                <th>Raid</th>
              </tr>
            </thead>
            <tbody>
              {fastAttacks.map((move) => (
                <tr key={`fast-${move.move_id}`}>
                  <td>
                    <img
                      className="type-icon"
                      src={getTypeIconPath(move.type_name)}
                      alt={`${move.type_name} type`}
                    />
                  </td>
                  <td>{formatMoveName(move.name, move.legacy)}</td>
                  <td>{move.pvp_power}</td>
                  <td>{move.raid_power}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {chargedAttacks.length > 0 && (
        <>
          <h2>Charged Attacks</h2>
          <table className="moves-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>PvP</th>
                <th>Raid</th>
              </tr>
            </thead>
            <tbody>
              {chargedAttacks.map((move) => (
                <tr key={`charged-${move.move_id}`}>
                  <td>
                    <img
                      className="type-icon"
                      src={getTypeIconPath(move.type_name)}
                      alt={`${move.type_name} type`}
                    />
                  </td>
                  <td>{formatMoveName(move.name, move.legacy)}</td>
                  <td>{move.pvp_power}</td>
                  <td>{move.raid_power}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

    </div>
  );
}

export default MoveList;
