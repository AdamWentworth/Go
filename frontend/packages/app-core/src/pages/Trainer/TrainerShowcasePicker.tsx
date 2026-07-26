import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  FaCheck,
  FaSearch,
  FaStar,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import {
  resolvePokemonDisplayAttributes,
  resolvePokemonDisplayImageUrl,
} from "@/features/pokemonDisplay/pokemonDisplayPresentation";
import type { PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";

const INITIAL_VISIBLE_CANDIDATES = 48;

const candidateName = (
  instance: PokemonInstance,
  variant?: PokemonVariant,
) =>
  instance.nickname ||
  variant?.species_name ||
  `Pokemon #${instance.pokemon_id}`;

const candidateSearchText = (
  instance: PokemonInstance,
  variant?: PokemonVariant,
) =>
  [
    candidateName(instance, variant),
    variant?.species_name,
    instance.pokemon_id,
    instance.cp,
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();

const CandidateImage = ({
  instance,
  variant,
}: {
  instance: PokemonInstance;
  variant?: PokemonVariant;
}) => {
  if (!variant) {
    return (
      <span className="trainer-showcase-image-placeholder">
        #{instance.pokemon_id}
      </span>
    );
  }

  const pokemon = { ...variant, instanceData: instance };
  const image = resolvePokemonDisplayImageUrl({
    pokemon,
    attributes: resolvePokemonDisplayAttributes(pokemon),
  });

  return image ? (
    <img src={image} alt="" />
  ) : (
    <span className="trainer-showcase-image-placeholder">
      #{instance.pokemon_id}
    </span>
  );
};

type TrainerShowcasePickerProps = {
  candidates: PokemonInstance[];
  selectedIds: string[];
  slotIndex: number;
  variantById: Map<string, PokemonVariant>;
  onSelect: (instanceId: string) => void;
  onClear: () => void;
  onClose: () => void;
};

const TrainerShowcasePicker = ({
  candidates,
  selectedIds,
  slotIndex,
  variantById,
  onSelect,
  onClear,
  onClose,
}: TrainerShowcasePickerProps) => {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_CANDIDATES,
  );
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const currentInstanceId = selectedIds[slotIndex] || "";
  const selectedSlots = useMemo(
    () =>
      new Map(
        selectedIds
          .slice(0, 6)
          .map((instanceId, index) => [instanceId, index + 1] as const)
          .filter(([instanceId]) => Boolean(instanceId)),
      ),
    [selectedIds],
  );

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_CANDIDATES);
  }, [deferredQuery]);

  const filteredCandidates = useMemo(() => {
    if (!deferredQuery) return candidates;
    return candidates.filter((instance) =>
      candidateSearchText(
        instance,
        variantById.get(instance.variant_id),
      ).includes(deferredQuery),
    );
  }, [candidates, deferredQuery, variantById]);
  const visibleCandidates = filteredCandidates.slice(0, visibleCount);

  return (
    <div
      className="trainer-showcase-picker"
      aria-label={`Choose Pokemon for featured slot ${slotIndex + 1}`}
    >
      <header>
        <div>
          <span>Featured slot {slotIndex + 1}</span>
          <h3>Choose one Pokemon</h3>
        </div>
        <div className="trainer-showcase-picker-actions">
          {currentInstanceId ? (
            <button
              type="button"
              className="trainer-button trainer-button-secondary"
              onClick={onClear}
            >
              <FaTrash aria-hidden="true" />
              Clear slot
            </button>
          ) : null}
          <button
            type="button"
            className="trainer-icon-button"
            aria-label="Close Pokemon picker"
            title="Close Pokemon picker"
            onClick={onClose}
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>
      </header>

      <label className="trainer-showcase-search">
        <FaSearch aria-hidden="true" />
        <input
          type="search"
          aria-label="Search caught Pokemon"
          value={query}
          placeholder="Search caught Pokemon"
          onChange={(event) => setQuery(event.target.value)}
        />
        <small>{filteredCandidates.length}</small>
      </label>

      {visibleCandidates.length ? (
        <div className="trainer-showcase-grid">
          {visibleCandidates.map((instance) => {
            const instanceId = instance.instance_id || "";
            const variant = variantById.get(instance.variant_id);
            const name = candidateName(instance, variant);
            const selectedSlot = selectedSlots.get(instanceId);
            const isCurrent = instanceId === currentInstanceId;
            const isAssignedElsewhere =
              selectedSlot !== undefined && selectedSlot !== slotIndex + 1;

            return (
              <button
                type="button"
                className={`trainer-showcase-candidate ${
                  isCurrent ? "selected" : ""
                }`}
                key={instanceId}
                aria-label={
                  isCurrent
                    ? `Keep ${name} in featured slot ${slotIndex + 1}`
                    : isAssignedElsewhere
                      ? `${name} is already in featured slot ${selectedSlot}`
                    : `Choose ${name} for featured slot ${slotIndex + 1}`
                }
                aria-pressed={isCurrent}
                disabled={isAssignedElsewhere}
                onClick={() => onSelect(instanceId)}
              >
                <span className="trainer-showcase-selection" aria-hidden="true">
                  {isCurrent ? (
                    <>
                      <FaCheck />
                      Current
                    </>
                  ) : isAssignedElsewhere ? (
                    `Slot ${selectedSlot}`
                  ) : (
                    "+"
                  )}
                </span>
                {instance.favorite ? (
                  <FaStar
                    className="trainer-showcase-favorite"
                    aria-label="Favorite"
                  />
                ) : null}
                <span className="trainer-showcase-image">
                  <CandidateImage instance={instance} variant={variant} />
                </span>
                <strong>{name}</strong>
                <span>
                  {instance.cp
                    ? `CP ${instance.cp.toLocaleString()}`
                    : `#${String(instance.pokemon_id).padStart(4, "0")}`}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="trainer-showcase-empty">
          No caught Pokemon match this search.
        </div>
      )}

      {visibleCount < filteredCandidates.length ? (
        <button
          type="button"
          className="trainer-button trainer-button-secondary trainer-showcase-more"
          onClick={() =>
            setVisibleCount((current) =>
              Math.min(
                current + INITIAL_VISIBLE_CANDIDATES,
                filteredCandidates.length,
              ),
            )
          }
        >
          Show more
        </button>
      ) : null}
    </div>
  );
};

export default TrainerShowcasePicker;
