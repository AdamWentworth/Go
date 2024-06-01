// useInstanceState.js

import { useState } from 'react';

const useInstanceState = (pokemon) => {
  const [editMode, setEditMode] = useState({
    cp: false,
    nickname: false,
    weight: false,
    height: false,
    gender: false,
    fastMove: false,
    chargedMoves: false
  });
  const [cp, setCp] = useState(pokemon.ownershipStatus.cp);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [weight, setWeight] = useState(pokemon.ownershipStatus.weight);
  const [height, setHeight] = useState(pokemon.ownershipStatus.height);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender || 'Unknown');
  const [fastMove, setFastMove] = useState(pokemon.ownershipStatus.fast_move_id);
  const [chargedMoves, setChargedMoves] = useState([
    pokemon.ownershipStatus.charged_move1_id,
    pokemon.ownershipStatus.charged_move2_id
  ]);

  const toggleEdit = (field) => {
    setEditMode(prevModes => ({ ...prevModes, [field]: !prevModes[field] }));
  };

  const setStateValues = (field, value, index = null) => {
    switch (field) {
      case 'cp':
        setCp(value);
        break;
      case 'nickname':
        setNickname(value);
        break;
      case 'weight':
        setWeight(value);
        break;
      case 'height':
        setHeight(value);
        break;
      case 'gender':
        setGender(value);
        break;
      case 'fastMove':
        setFastMove(value);
        break;
      case 'chargedMoves':
        const newChargedMoves = [...chargedMoves];
        if (index !== null) {
          newChargedMoves[index] = value;
        }
        setChargedMoves(newChargedMoves);
        break;
      default:
        break;
    }
  };

  return {
    editMode,
    toggleEdit,
    stateValues: {
      cp, nickname, weight, height, gender, fastMove, chargedMoves
    },
    setStateValues
  };
};

export default useInstanceState;
