// Moves.tsx
import React, { useEffect, useState } from 'react';
import './Moves.css';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

/* ------------------------------------------------------------------ */
/* Narrow Variant so we always have instanceData                      */
/* ------------------------------------------------------------------ */
type VariantWithInstance = PokemonVariant & { instanceData: PokemonInstance };

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface MovesProps {
  pokemon: VariantWithInstance;
  editMode: boolean;
  onMovesChange: (moves: {
    fastMove: number | null;
    chargedMove1: number | null;
    chargedMove2: number | null;
  }) => void;
  isShadow: boolean;
  isPurified: boolean;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const Moves: React.FC<MovesProps> = ({
  pokemon,
  editMode,
  onMovesChange,
  isShadow,
  isPurified,
}) => {
  const allMoves = pokemon.moves;

  /* local state mirrors instanceData so UI can edit it -------------- */
  const [fastMove, setFastMove] = useState<number | null>(
    pokemon.instanceData.fast_move_id ?? null,
  );
  const [chargedMove1, setChargedMove1] = useState<number | null>(
    pokemon.instanceData.charged_move1_id ?? null,
  );
  const [chargedMove2, setChargedMove2] = useState<number | null>(
    pokemon.instanceData.charged_move2_id ?? null,
  );

  /* sync prop → state when `pokemon` object changes ----------------- */
  useEffect(() => {
    setFastMove(pokemon.instanceData.fast_move_id ?? null);
    setChargedMove1(pokemon.instanceData.charged_move1_id ?? null);
    setChargedMove2(pokemon.instanceData.charged_move2_id ?? null);
  }, [pokemon]);

  /* shadow / purified swap logic ------------------------------------ */
  useEffect(() => {
    const updated = { fastMove, chargedMove1, chargedMove2 };
    let dirty = false;

    const replace = (from: number, to: number) => {
      if (updated.chargedMove1 === from) {
        updated.chargedMove1 = to;
        dirty = true;
      }
      if (updated.chargedMove2 === from) {
        updated.chargedMove2 = to;
        dirty = true;
      }
    };

    if (isPurified && !isShadow) replace(228, 229);
    if (isShadow && !isPurified) replace(229, 228);

    const clearIfInvalid = (id: number | null) =>
      id != null && !isShadow && !isPurified && (id === 228 || id === 229);

    if (clearIfInvalid(updated.chargedMove1)) {
      updated.chargedMove1 = null;
      dirty = true;
    }
    if (clearIfInvalid(updated.chargedMove2)) {
      updated.chargedMove2 = null;
      dirty = true;
    }

    if (dirty) {
      setChargedMove1(updated.chargedMove1);
      setChargedMove2(updated.chargedMove2);
      onMovesChange(updated);
    }
  }, [isShadow, isPurified]); // eslint-disable-line react-hooks/exhaustive-deps

  /* helpers --------------------------------------------------------- */
  const fastMoves = allMoves.filter((m) => m.is_fast === 1);
  const chargedMoves = allMoves.filter((m) => m.is_fast === 0);

  const makeSpecial = (id: number, name: string): Move => ({
    move_id: id,
    name,
    type: 'Normal',
    type_id: 0,
    raid_power: 0,
    pvp_power: 0,
    raid_energy: 0,
    pvp_energy: 0,
    raid_cooldown: 0,
    pvp_turns: 0,
    is_fast: 0,
    type_name: 'Normal',
    legacy: false,
    fusion_id: null,
    shadow: null,
    purified: null,
    apex: null,
  });

  if (isShadow && !chargedMoves.some((m) => m.move_id === 228))
    chargedMoves.push(makeSpecial(228, 'Frustration'));
  if (isPurified && !chargedMoves.some((m) => m.move_id === 229))
    chargedMoves.push(makeSpecial(229, 'Return'));

  const getMoveById = (id: number | null): Move | null =>
    id != null
      ? allMoves.find((m) => m.move_id === id) ??
        chargedMoves.find((m) => m.move_id === id) ??
        null
      : null;

  const fusionId =
    pokemon.instanceData.fusion_form &&
    pokemon.fusion?.find((f) => f.name === pokemon.instanceData.fusion_form)
      ?.fusion_id;

  /* event handlers -------------------------------------------------- */
  const handleMoveChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    slot: 'fast' | 'charged1' | 'charged2',
  ) => {
    const id = Number(e.target.value) || null;
    if (slot === 'fast') {
      setFastMove(id);
      onMovesChange({ fastMove: id, chargedMove1, chargedMove2 });
    } else if (slot === 'charged1') {
      setChargedMove1(id);
      onMovesChange({ fastMove, chargedMove1: id, chargedMove2 });
    } else {
      setChargedMove2(id);
      onMovesChange({ fastMove, chargedMove1, chargedMove2: id });
    }
  };

  const addSecondChargedMove = () => {
    const available = chargedMoves.find(
      (m) =>
        m.move_id !== chargedMove1 &&
        m.move_id !== 228 &&
        m.move_id !== 229,
    );
    if (available) {
      setChargedMove2(available.move_id);
      onMovesChange({
        fastMove,
        chargedMove1,
        chargedMove2: available.move_id,
      });
    }
  };

  /* option + info render helpers ----------------------------------- */
  const renderMoveOptions = (
    moves: Move[],
    selectedId: number | null,
    slot: 'fast' | 'charged1' | 'charged2',
  ) => {
    const filtered = moves.filter((m) => {
      if (!fusionId && m.fusion_id != null) return false;
      if (fusionId && m.fusion_id && m.fusion_id !== fusionId) return false;
      if (slot === 'charged1' && m.move_id === chargedMove2) return false;
      if (slot === 'charged2' && m.move_id === chargedMove1) return false;
      if (m.shadow === 1 && !isShadow) return false;
      if (m.purified === 1 && !isPurified) return false;
      return true;
    });

    const move = getMoveById(selectedId);

    return (
      <div className="move-option-container">
        {move ? (
          <img
            src={`/images/types/${move.type.toLowerCase()}.png`}
            alt={move.type}
            className="type-icon"
          />
        ) : (
          <span className="no-type-icon" />
        )}

        <select
          value={selectedId ?? ''}
          onChange={(e) => handleMoveChange(e, slot)}
          className="move-select"
        >
          <option value="">Unselected move</option>
          {filtered.map((m) => (
            <option
              key={m.move_id}
              value={m.move_id}
              style={m.legacy ? { fontWeight: 'bold' } : undefined}
            >
              {m.name}
              {m.legacy ? '*' : ''}
            </option>
          ))}
        </select>
        <div className="spacer" />
      </div>
    );
  };

  const renderMoveInfo = (id: number | null) => {
    const move = getMoveById(id);
    if (!move)
      return <span className="unselected-move">Unselected move</span>;

    return (
      <div className="move-info">
        <img
          src={`/images/types/${move.type.toLowerCase()}.png`}
          alt={move.type}
          className="type-icon"
        />
        <span
          className="move-name"
          style={move.legacy ? { fontWeight: 'bold' } : undefined}
        >
          {move.name}
          {move.legacy ? '*' : ''}
        </span>
        <div className="spacer" />
      </div>
    );
  };

  if (!editMode && !fastMove && !chargedMove1 && !chargedMove2) return null;

  return (
    <div className={`moves-container ${editMode ? 'editable' : ''}`}>
      <div className="move-section">
        {editMode
          ? renderMoveOptions(fastMoves, fastMove, 'fast')
          : renderMoveInfo(fastMove)}
      </div>
      <div className="move-section">
        {editMode
          ? renderMoveOptions(chargedMoves, chargedMove1, 'charged1')
          : renderMoveInfo(chargedMove1)}
      </div>
      <div className="move-section">
        {chargedMove2 ? (
          editMode
            ? renderMoveOptions(chargedMoves, chargedMove2, 'charged2')
            : renderMoveInfo(chargedMove2)
        ) : editMode ? (
          <button
            onClick={addSecondChargedMove}
            className="icon-button add-move-button"
          >
            <span className="move-add-icon">+</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default Moves;
