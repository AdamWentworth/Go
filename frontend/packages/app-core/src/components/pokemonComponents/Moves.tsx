// Moves.tsx
import React, { useEffect, useRef, useState } from 'react';
import './Moves.css';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonInstance } from '@/types/pokemonInstance';
import { resolveAssetUrl } from '@/utils/assetUrl';

type FusionMoveSource = 'base' | 'fusion' | 'fusion_missing';

type DamageMode = 'raid' | 'pvp';

type VariantWithOptionalInstance = {
  moves?: Move[];
  fusion?: Array<{ name?: string; fusion_id?: number | null; moves?: Move[] }>;
  instanceData?: Partial<PokemonInstance>;
};

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
export interface MovesProps {
  pokemon: VariantWithOptionalInstance;
  editMode: boolean;
  onMovesChange: (moves: {
    fastMove: number | null;
    chargedMove1: number | null;
    chargedMove2: number | null;
  }) => void;
  isShadow: boolean;
  isPurified: boolean;
  fusionMoveSource?: FusionMoveSource;
  isFused?: boolean;
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
  fusionMoveSource = 'base',
  isFused = false,
}) => {
  const allMoves = pokemon.moves ?? [];
  const instanceData: Partial<PokemonInstance> = pokemon.instanceData ?? {};
  const onMovesChangeRef = useRef(onMovesChange);
  const modeToggleRef = useRef<HTMLDivElement>(null);
  const raidTabRef = useRef<HTMLButtonElement>(null);
  const pvpTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    onMovesChangeRef.current = onMovesChange;
  }, [onMovesChange]);

  /* local state mirrors instanceData so UI can edit it -------------- */
  const [fastMove, setFastMove] = useState<number | null>(
    instanceData.fast_move_id ?? null,
  );
  const [chargedMove1, setChargedMove1] = useState<number | null>(
    instanceData.charged_move1_id ?? null,
  );
  const [chargedMove2, setChargedMove2] = useState<number | null>(
    instanceData.charged_move2_id ?? null,
  );
  const [damageMode, setDamageMode] = useState<DamageMode>('raid');
  const damageModeIndex = damageMode === 'raid' ? 0 : 1;
  const [underlineLeft, setUnderlineLeft] = useState(0);

  const normalizedFusionForm =
    typeof pokemon.instanceData?.fusion_form === 'string'
      ? pokemon.instanceData.fusion_form.trim().toLowerCase()
      : '';
  const fusionEntries = Array.isArray(pokemon.fusion) ? pokemon.fusion : [];
  const fusionIdFromName =
    normalizedFusionForm &&
    fusionEntries.find((f) => (f.name ?? '').trim().toLowerCase() === normalizedFusionForm)
      ?.fusion_id;
  const fusionIdFromNumericForm =
    normalizedFusionForm && /^\d+$/.test(normalizedFusionForm)
      ? Number(normalizedFusionForm)
      : null;
  const fusionIdsFromMoves = Array.from(
    new Set(
      allMoves
        .map((move) => move.fusion_id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  );
  const inferredFusionId = fusionIdsFromMoves.length === 1 ? fusionIdsFromMoves[0] : null;
  const fusionId =
    fusionIdFromName ??
    (typeof fusionIdFromNumericForm === 'number' ? fusionIdFromNumericForm : null) ??
    inferredFusionId;

  const hasMissingFusionMoves = isFused && fusionMoveSource === 'fusion_missing';
  const disableMoveEditing = editMode && hasMissingFusionMoves;

  const allowMoveForFusion = (move: Move) => {
    if (fusionMoveSource === 'fusion') return true;
    if (hasMissingFusionMoves) return false;
    if (!fusionId) return move.fusion_id == null;
    if (move.fusion_id == null) return true;
    return move.fusion_id === fusionId;
  };

  /* sync prop → state when `pokemon` object changes ----------------- */
  useEffect(() => {
    setFastMove(pokemon.instanceData?.fast_move_id ?? null);
    setChargedMove1(pokemon.instanceData?.charged_move1_id ?? null);
    setChargedMove2(pokemon.instanceData?.charged_move2_id ?? null);
  }, [pokemon.instanceData?.fast_move_id, pokemon.instanceData?.charged_move1_id, pokemon.instanceData?.charged_move2_id]);

  useEffect(() => {
    const updateUnderline = () => {
      const toggleEl = modeToggleRef.current;
      const activeTabEl = damageMode === 'raid' ? raidTabRef.current : pvpTabRef.current;
      if (!toggleEl || !activeTabEl) return;

      const toggleRect = toggleEl.getBoundingClientRect();
      const tabRect = activeTabEl.getBoundingClientRect();
      const tabCenter = tabRect.left + tabRect.width / 2;
      setUnderlineLeft(tabCenter - toggleRect.left);
    };

    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [damageMode]);

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
      onMovesChangeRef.current(updated);
    }
  }, [chargedMove1, chargedMove2, fastMove, isPurified, isShadow]);

  /* helpers --------------------------------------------------------- */
  const fastMoves = allMoves.filter((m) => m.is_fast === 1 && allowMoveForFusion(m));
  const chargedMoves = allMoves.filter((m) => m.is_fast === 0 && allowMoveForFusion(m));

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

  const getPowerValue = (move: Move, mode: DamageMode): number | null => {
    const power = mode === 'raid' ? move.raid_power : move.pvp_power;
    return typeof power === 'number' && Number.isFinite(power)
      ? power
      : null;
  };

  const getShadowBonusValue = (power: number): number =>
    Math.max(1, Math.round(power * 0.2));

  const renderPowerValue = (move: Move | null, mode: DamageMode) => {
    if (!move) return <span className="move-power-base">-</span>;

    const power = getPowerValue(move, mode);
    if (power == null) return <span className="move-power-base">-</span>;

    if (!isShadow) return <span className="move-power-base">{power}</span>;

    return (
      <>
        <span className="move-power-base">{power}</span>
        <span className="move-power-bonus">+{getShadowBonusValue(power)}</span>
      </>
    );
  };

  const renderShadowBonusRow = (moveId: number | null) => {
    if (!isShadow) return null;
    const move = getMoveById(moveId);
    if (!move) return null;

    return (
      <div className="move-shadow-bonus-row">
        <span className="move-shadow-icon-badge">
          <img
            src={resolveAssetUrl('/media/images/shadow_icon.png')}
            alt=""
            aria-hidden="true"
            className="move-shadow-icon"
          />
        </span>
        <span className="move-shadow-bonus-text">SHADOW BONUS</span>
      </div>
    );
  };

  useEffect(() => {
    if (hasMissingFusionMoves) {
      return;
    }
    const next = { fastMove, chargedMove1, chargedMove2 };
    let dirty = false;

    const fastSet = new Set(fastMoves.map((m) => m.move_id));
    const chargedSet = new Set(chargedMoves.map((m) => m.move_id));

    if (next.fastMove != null && !fastSet.has(next.fastMove)) {
      next.fastMove = null;
      dirty = true;
    }
    if (next.chargedMove1 != null && !chargedSet.has(next.chargedMove1)) {
      next.chargedMove1 = null;
      dirty = true;
    }
    if (next.chargedMove2 != null && !chargedSet.has(next.chargedMove2)) {
      next.chargedMove2 = null;
      dirty = true;
    }
    if (
      next.chargedMove1 != null &&
      next.chargedMove2 != null &&
      next.chargedMove1 === next.chargedMove2
    ) {
      next.chargedMove2 = null;
      dirty = true;
    }

    if (dirty) {
      setFastMove(next.fastMove);
      setChargedMove1(next.chargedMove1);
      setChargedMove2(next.chargedMove2);
      onMovesChangeRef.current(next);
    }
  }, [chargedMove1, chargedMove2, chargedMoves, fastMove, fastMoves, hasMissingFusionMoves]);

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
    mode: DamageMode,
  ) => {
    const filtered = moves.filter((m) => {
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
          disabled={disableMoveEditing}
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
        <span className="move-power-value">{renderPowerValue(move, mode)}</span>
      </div>
    );
  };

  const renderMoveInfo = (id: number | null, mode: DamageMode) => {
    const move = getMoveById(id);
    if (!move)
      return <span className="unselected-move">Unselected move</span>;

    return (
      <div className="move-info">
        <div className="move-left">
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
        </div>
        <span className="move-power-value">{renderPowerValue(move, mode)}</span>
      </div>
    );
  };

  const renderMovesPage = (mode: DamageMode) => (
    <>
      <div className="move-section">
        {editMode
          ? renderMoveOptions(fastMoves, fastMove, 'fast', mode)
          : renderMoveInfo(fastMove, mode)}
      </div>
      {renderShadowBonusRow(fastMove)}
      <div className="move-section">
        {editMode
          ? renderMoveOptions(chargedMoves, chargedMove1, 'charged1', mode)
          : renderMoveInfo(chargedMove1, mode)}
      </div>
      {renderShadowBonusRow(chargedMove1)}
      <div className="move-section">
        {chargedMove2 ? (
          editMode
            ? renderMoveOptions(chargedMoves, chargedMove2, 'charged2', mode)
            : renderMoveInfo(chargedMove2, mode)
        ) : editMode ? (
          <button
            onClick={addSecondChargedMove}
            className="icon-button add-move-button"
            disabled={disableMoveEditing}
            aria-label="Add second charged move"
          >
            <span className="move-add-icon">+</span>
          </button>
        ) : null}
      </div>
      {renderShadowBonusRow(chargedMove2)}
    </>
  );

  if (!editMode && !fastMove && !chargedMove1 && !chargedMove2 && !hasMissingFusionMoves) {
    return null;
  }

  return (
    <div className={`moves-container ${editMode ? 'editable' : ''}`}>
      {hasMissingFusionMoves ? (
        <div className="moves-fusion-warning" role="status">
          Fusion moves unavailable. Refresh pokemon data.
        </div>
      ) : null}
      <div
        ref={modeToggleRef}
        className="moves-mode-toggle"
        role="tablist"
        aria-label="Move battle mode"
      >
        <button
          ref={raidTabRef}
          type="button"
          role="tab"
          aria-selected={damageMode === 'raid'}
          className={`moves-mode-button ${damageMode === 'raid' ? 'active' : ''}`}
          onClick={() => setDamageMode('raid')}
        >
          Gyms &amp; Raids
        </button>
        <button
          ref={pvpTabRef}
          type="button"
          role="tab"
          aria-selected={damageMode === 'pvp'}
          className={`moves-mode-button ${damageMode === 'pvp' ? 'active' : ''}`}
          onClick={() => setDamageMode('pvp')}
        >
          Trainer Battles
        </button>
        <span
          className="moves-mode-underline"
          style={{ left: underlineLeft }}
          aria-hidden="true"
        />
      </div>
      <div className="moves-pages-viewport">
        <div
          className="moves-pages-track"
          style={{ transform: `translateX(-${damageModeIndex * 50}%)` }}
        >
          <div className="moves-page" role="tabpanel" aria-hidden={damageMode !== 'raid'}>
            {renderMovesPage('raid')}
          </div>
          <div className="moves-page" role="tabpanel" aria-hidden={damageMode !== 'pvp'}>
            {renderMovesPage('pvp')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Moves;
