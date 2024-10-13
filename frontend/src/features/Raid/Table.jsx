// Table.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

function Table({ moves }) {
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
                    <tr key={index}>
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
}

Table.propTypes = {
    moves: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        fastMove: PropTypes.string.isRequired,
        chargedMove: PropTypes.string.isRequired,
        dps: PropTypes.string.isRequired,
        tdo: PropTypes.string.isRequired,
        er: PropTypes.string.isRequired,
        cp: PropTypes.string.isRequired
    })).isRequired
};

export default Table;