// OwnedInstance.jsx
import React, { useState } from 'react';
import './OwnedInstance.css';

const OwnedInstance = ({ pokemon }) => {
  const [editMode, setEditMode] = useState({
    cp: false,
    nickname: false,
    weight: false,
    height: false,
    gender: false
  });
  const [cp, setCp] = useState(pokemon.ownershipStatus.cp);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname || pokemon.name);
  const [weight, setWeight] = useState(pokemon.ownershipStatus.weight);
  const [height, setHeight] = useState(pokemon.ownershipStatus.height);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender || 'Unknown');
  const [fastMove, setFastMove] = useState(pokemon.ownershipStatus.fast_move_id);
  const [chargedMoves, setChargedMoves] = useState([pokemon.ownershipStatus.charged_move1_id, pokemon.ownershipStatus.charged_move2_id]);

  const toggleEdit = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
  };

  const renderMoveOptions = (isFast) => {
    return pokemon.moves
      .filter(move => move.is_fast === (isFast ? 1 : 0))
      .map(move => <option key={move.move_id} value={move.move_id}>{move.name}</option>);
  };

  const handleChargedMoveChange = (index, value) => {
    const newChargedMoves = [...chargedMoves];
    newChargedMoves[index] = Number(value);
    setChargedMoves(newChargedMoves);
  };

  return (
    <div>
      <div className="editable-section">
        {editMode.cp ? (
          <input type="text" value={cp || ''} onChange={e => setCp(e.target.value)} className="cp-input" />
        ) : (
          <h2>CP: {cp}</h2>
        )}
        <button onClick={() => toggleEdit('cp')}>{editMode.cp ? 'Save' : 'Edit CP'}</button>
      </div>

      <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />

      <div className="editable-section">
        {editMode.nickname ? (
          <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} />
        ) : (
          <h2>{nickname}</h2>
        )}
        <button onClick={() => toggleEdit('nickname')}>{editMode.nickname ? 'Save' : 'Edit Nickname'}</button>
      </div>

      <div className="editable-section">
        {editMode.gender ? (
          <select value={gender} onChange={e => setGender(e.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Genderless">Genderless</option>
          </select>
        ) : (
          <span>{gender}</span>
        )}
        <button onClick={() => toggleEdit('gender')}>{editMode.gender ? 'Save' : 'Edit Gender'}</button>
      </div>

      <div className="details-row">
        {editMode.weight ? (
          <input type="text" value={weight || ''} onChange={e => setWeight(e.target.value)} />
        ) : (
          <span>{weight || 'N/A'} kg</span>
        )}
        <button onClick={() => toggleEdit('weight')}>{editMode.weight ? 'Save' : 'Edit Weight'}</button>

        <div className="type-icons">
          <img src={process.env.PUBLIC_URL + pokemon.type_1_icon} alt={pokemon.type1_name} />
          <span>{pokemon.type1_name}</span>
          {pokemon.type_2_id && (
            <>
              <span> / </span>
              <img src={process.env.PUBLIC_URL + pokemon.type_2_icon} alt={pokemon.type2_name} />
              <span>{pokemon.type2_name}</span>
            </>
          )}
        </div>

        {editMode.height ? (
          <input type="text" value={height || ''} onChange={e => setHeight(e.target.value)} />
        ) : (
          <span>{height || 'N/A'} m</span>
        )}
        <button onClick={() => toggleEdit('height')}>{editMode.height ? 'Save' : 'Edit Height'}</button>
      </div>

      <div className="moves-column">
        <h3>Fast Move</h3>
        <select value={fastMove} onChange={e => setFastMove(Number(e.target.value))}>
          {renderMoveOptions(true)}
        </select>

        <h3>Charged Moves</h3>
        {chargedMoves.map((moveId, index) => (
          <select key={index} value={moveId} onChange={e => handleChargedMoveChange(index, e.target.value)}>
            {renderMoveOptions(false)}
          </select>
        ))}
      </div>
    </div>
  );
}

export default OwnedInstance;
