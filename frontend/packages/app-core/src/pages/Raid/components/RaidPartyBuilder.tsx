import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FaBolt,
  FaChevronDown,
  FaChevronUp,
  FaPlus,
  FaRedo,
  FaTrash,
  FaUsers,
} from "react-icons/fa";

import type { PokemonVariant } from "@/types/pokemonVariants";
import {
  buildRaidPartyTrainers,
  createRaidPartyTrainerDraft,
  getDefaultRaidPartyMemberIds,
  getRaidPartyScoreKey,
  type RaidPartyTrainerDraft,
} from "../utils/raidParty";
import { simulateRaidPartyAsync } from "../utils/raidPartyWorkers";
import { RAID_PARTY_MAX_TRAINERS } from "../utils/raidRules";
import { variantUsesRaidMegaSlot } from "../utils/raidTeamSelection";
import type {
  RaidCounterScore,
  RaidCounterSettings,
  RaidPartySimulationResult,
  RaidTierPreset,
} from "../utils/raidTypes";
import { formatDps, getRaidVariantDisplayName } from "../utils/raidViewModel";

type RaidPartyBuilderProps = {
  scores: RaidCounterScore[];
  boss: PokemonVariant;
  tier: RaidTierPreset;
  settings: RaidCounterSettings;
  onResultChange: (result: RaidPartySimulationResult | null) => void;
};

const formatSeconds = (seconds: number): string =>
  Number.isFinite(seconds) ? `${seconds.toFixed(1)}s` : "No clear";

const RaidPartyBuilder = ({
  scores,
  boss,
  tier,
  settings,
  onResultChange,
}: RaidPartyBuilderProps) => {
  const simulationAbortRef = useRef<AbortController | null>(null);
  const previousBossIdRef = useRef(boss.variant_id);
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<RaidPartyTrainerDraft[]>(() => [
    createRaidPartyTrainerDraft(0, scores, settings),
    createRaidPartyTrainerDraft(1, scores, settings),
  ]);
  const [expandedTrainerIds, setExpandedTrainerIds] = useState(
    () => new Set(["trainer-1"]),
  );
  const [result, setResult] = useState<RaidPartySimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const candidateScores = useMemo(() => scores.slice(0, 80), [scores]);
  const scoreById = useMemo(
    () =>
      new Map(
        candidateScores.map((score) => [getRaidPartyScoreKey(score), score]),
      ),
    [candidateScores],
  );

  useEffect(() => {
    simulationAbortRef.current?.abort();
    const bossChanged = previousBossIdRef.current !== boss.variant_id;
    previousBossIdRef.current = boss.variant_id;
    if (bossChanged) {
      setDrafts([
        createRaidPartyTrainerDraft(0, scores, settings),
        createRaidPartyTrainerDraft(1, scores, settings),
      ]);
      setExpandedTrainerIds(new Set(["trainer-1"]));
    } else {
      const availableIds = new Set(scores.map(getRaidPartyScoreKey));
      const defaults = getDefaultRaidPartyMemberIds(scores);
      setDrafts((current) =>
        current.map((draft) => {
          const memberVariantIds = draft.memberVariantIds.filter((id) =>
            availableIds.has(id),
          );
          defaults.forEach((id) => {
            if (memberVariantIds.length < 6 && !memberVariantIds.includes(id)) {
              memberVariantIds.push(id);
            }
          });
          return { ...draft, memberVariantIds };
        }),
      );
    }
    setResult(null);
    setError("");
    onResultChange(null);
  }, [boss.variant_id, scores, settings, onResultChange]);

  useEffect(
    () => () => {
      simulationAbortRef.current?.abort();
    },
    [],
  );

  const updateDraft = (
    id: string,
    update: (draft: RaidPartyTrainerDraft) => RaidPartyTrainerDraft,
  ) => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? update(draft) : draft)),
    );
    setResult(null);
    onResultChange(null);
  };

  const handleAddTrainer = () => {
    setDrafts((current) => {
      const nextTrainerNumber =
        Math.max(
          0,
          ...current.map((draft) => {
            const match = draft.id.match(/trainer-(\d+)/);
            return match ? Number(match[1]) : 0;
          }),
        ) + 1;
      const nextDraft = createRaidPartyTrainerDraft(
        nextTrainerNumber - 1,
        scores,
        settings,
      );
      setExpandedTrainerIds((expanded) => new Set(expanded).add(nextDraft.id));
      return [...current, nextDraft];
    });
    setResult(null);
    onResultChange(null);
  };

  const handleRemoveTrainer = (id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
    setExpandedTrainerIds((expanded) => {
      const next = new Set(expanded);
      next.delete(id);
      return next;
    });
    setResult(null);
    onResultChange(null);
  };

  const handleRun = async () => {
    const trainers = buildRaidPartyTrainers(drafts, scores, settings);
    if (trainers.length !== drafts.length) {
      setError("Every Trainer needs at least one valid team member.");
      return;
    }

    simulationAbortRef.current?.abort();
    const controller = new AbortController();
    simulationAbortRef.current = controller;
    setRunning(true);
    setError("");
    try {
      const nextResult = await simulateRaidPartyAsync(
        { trainers, boss, tier },
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setResult(nextResult);
      onResultChange(nextResult);
      if (!nextResult) setError("The boss has no usable raid movesets.");
    } catch (simulationError) {
      if (controller.signal.aborted) return;
      setError(
        simulationError instanceof Error
          ? simulationError.message
          : "Party simulation failed.",
      );
    } finally {
      if (!controller.signal.aborted) setRunning(false);
    }
  };

  return (
    <section className="raid-party-builder" aria-label="Custom raid party">
      <button
        className="raid-party-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <FaUsers aria-hidden="true" />
        <span>
          <strong>Custom raid party</strong>
          <small>Independent teams, dodges, relobbies, and contribution</small>
        </span>
        {open ? <FaChevronUp aria-hidden="true" /> : <FaChevronDown aria-hidden="true" />}
      </button>

      {open && (
        <div className="raid-party-content">
          <header className="raid-party-heading">
            <div>
              <span>{drafts.length} Trainers</span>
              <strong>Build the actual lobby</strong>
            </div>
            <button
              type="button"
              className="raid-party-add"
              onClick={handleAddTrainer}
              disabled={drafts.length >= RAID_PARTY_MAX_TRAINERS}
              title="Add Trainer"
            >
              <FaPlus aria-hidden="true" />
              Add Trainer
            </button>
          </header>

          <div className="raid-party-trainers">
            {drafts.map((draft, trainerIndex) => {
              const selectedScores = draft.memberVariantIds
                .map((id) => scoreById.get(id))
                .filter((score): score is RaidCounterScore => Boolean(score));
              const hasMega = selectedScores.some((score) =>
                variantUsesRaidMegaSlot(score.variant),
              );

              return (
                <details
                  className="raid-party-trainer"
                  key={draft.id}
                  open={expandedTrainerIds.has(draft.id)}
                  onToggle={(event) => {
                    const expanded = event.currentTarget.open;
                    setExpandedTrainerIds((current) => {
                      const next = new Set(current);
                      if (expanded) next.add(draft.id);
                      else next.delete(draft.id);
                      return next;
                    });
                  }}
                >
                  <summary>
                    <span className="raid-party-trainer-number">
                      {trainerIndex + 1}
                    </span>
                    <span>
                      <strong>{draft.label}</strong>
                      <small>
                        {selectedScores.length} Pokemon
                        {hasMega ? " · Mega/Primal" : ""}
                      </small>
                    </span>
                    <FaChevronDown aria-hidden="true" />
                  </summary>

                  <div className="raid-party-trainer-fields">
                    <label className="raid-party-name-field">
                      <span>Trainer name</span>
                      <input
                        value={draft.label}
                        onChange={(event) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Dodging</span>
                      <select
                        value={draft.dodgeStrategy}
                        onChange={(event) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            dodgeStrategy: event.target.value as RaidCounterSettings["dodgeStrategy"],
                          }))
                        }
                      >
                        <option value="none">No dodging</option>
                        <option value="charged">Charged attacks</option>
                      </select>
                    </label>
                    <label>
                      <span>Dodge success</span>
                      <select
                        value={draft.dodgeSuccessRate}
                        disabled={draft.dodgeStrategy === "none"}
                        onChange={(event) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            dodgeSuccessRate: Number(event.target.value),
                          }))
                        }
                      >
                        <option value={1}>100%</option>
                        <option value={0.75}>75%</option>
                        <option value={0.5}>50%</option>
                        <option value={0.25}>25%</option>
                      </select>
                    </label>
                    <label>
                      <span>Relobby</span>
                      <select
                        value={draft.relobbySeconds}
                        onChange={(event) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            relobbySeconds: Number(event.target.value),
                          }))
                        }
                      >
                        {[5, 10, 15, 20].map((seconds) => (
                          <option key={seconds} value={seconds}>
                            {seconds}s
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Action delay</span>
                      <select
                        value={draft.actionDelaySeconds}
                        onChange={(event) =>
                          updateDraft(draft.id, (current) => ({
                            ...current,
                            actionDelaySeconds: Number(event.target.value),
                          }))
                        }
                      >
                        <option value={0}>None</option>
                        <option value={0.5}>0.5s</option>
                        <option value={1}>1.0s</option>
                      </select>
                    </label>
                  </div>

                  <div className="raid-party-team-heading">
                    <strong>Battle team</strong>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft(draft.id, (current) => ({
                          ...current,
                          memberVariantIds: getDefaultRaidPartyMemberIds(scores),
                        }))
                      }
                    >
                      <FaRedo aria-hidden="true" />
                      Auto fill
                    </button>
                  </div>
                  <div className="raid-party-team">
                    {Array.from({ length: 6 }, (_, slotIndex) => {
                      const selectedId = draft.memberVariantIds[slotIndex] ?? "";
                      const otherIds = new Set(
                        draft.memberVariantIds.filter((_, index) => index !== slotIndex),
                      );
                      const selectedScore = scoreById.get(selectedId);
                      const anotherMegaSelected = selectedScores.some(
                        (score) =>
                          getRaidPartyScoreKey(score) !== selectedId &&
                          variantUsesRaidMegaSlot(score.variant),
                      );
                      return (
                        <label key={`${draft.id}-${slotIndex}`}>
                          <span>{slotIndex + 1}</span>
                          <select
                            aria-label={`${draft.label} team slot ${slotIndex + 1}`}
                            value={selectedId}
                            onChange={(event) =>
                              updateDraft(draft.id, (current) => {
                                const memberVariantIds = [...current.memberVariantIds];
                                memberVariantIds[slotIndex] = event.target.value;
                                return { ...current, memberVariantIds };
                              })
                            }
                          >
                            <option value="">Empty slot</option>
                            {candidateScores.map((score) => {
                              const id = getRaidPartyScoreKey(score);
                              const disabled =
                                otherIds.has(id) ||
                                (variantUsesRaidMegaSlot(score.variant) &&
                                  anotherMegaSelected &&
                                  selectedScore?.variant.variant_id !== id);
                              return (
                                <option key={id} value={id} disabled={disabled}>
                                  {getRaidVariantDisplayName(score.variant)} · {score.fastMove.name} / {score.chargedMove.name}
                                </option>
                              );
                            })}
                          </select>
                        </label>
                      );
                    })}
                  </div>

                  {drafts.length > 1 && (
                    <button
                      className="raid-party-remove"
                      type="button"
                      onClick={() => handleRemoveTrainer(draft.id)}
                    >
                      <FaTrash aria-hidden="true" />
                      Remove Trainer
                    </button>
                  )}
                </details>
              );
            })}
          </div>

          <button
            type="button"
            className="raid-party-run"
            onClick={handleRun}
            disabled={running || drafts.length === 0}
          >
            <FaBolt aria-hidden="true" />
            {running ? "Simulating party..." : "Simulate party"}
          </button>

          {error && <p className="raid-party-error" role="alert">{error}</p>}

          {result && (
            <section className="raid-party-result" aria-label="Raid party result">
              <header>
                <span className={result.won ? "won" : "lost"}>
                  {result.won ? "Clear" : "Time expired"}
                </span>
                <strong>{formatSeconds(result.projectedTimeToWinSeconds)}</strong>
                <small>
                  {formatDps(result.dps)} DPS · {Math.round(result.faints)} faints · {Math.round(result.relobbies)} relobbies
                </small>
              </header>
              <div className="raid-party-contributions">
                {result.trainers.map((trainer) => (
                  <div key={trainer.id}>
                    <span>
                      <strong>{trainer.label}</strong>
                      <small>{formatDps(trainer.dps)} DPS · {Math.round(trainer.damageShare * 100)}%</small>
                    </span>
                    <div aria-label={`${trainer.label} damage contribution`}>
                      <i style={{ width: `${Math.max(2, trainer.damageShare * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
};

export default RaidPartyBuilder;
