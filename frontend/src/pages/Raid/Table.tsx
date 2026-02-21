import React from 'react';
import type { MoveCombination } from './utils/moveCombinations';

type TableProps = {
  moves: MoveCombination[];
};

const Table: React.FC<TableProps> = ({ moves }) => {
  return (
    <table className="raid-table">
      <thead>
        <tr>
          <th>Pokemon</th>
          <th>Fast Move</th>
          <th>Charged Move</th>
          <th>DPS</th>
          <th>TDO</th>
          <th>ER</th>
          <th>CP</th>
        </tr>
      </thead>
      <tbody>
        {moves.map((combo, index) => (
          <tr key={`${combo.name}-${combo.fastMove}-${combo.chargedMove}-${index}`}>
            <td>{combo.name}</td>
            <td>{combo.fastMove}</td>
            <td>{combo.chargedMove}</td>
            <td>{combo.dps}</td>
            <td>{combo.tdo}</td>
            <td>{combo.er}</td>
            <td>{combo.cp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
