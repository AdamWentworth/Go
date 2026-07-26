import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { FaCheck, FaSearch, FaStar } from "react-icons/fa";

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
  variantById: Map<string, PokemonVariant>;
  onToggle: (instanceId: string) => void;
};

const TrainerShowcasePicker = ({
  candidates,
  selectedIds,
  variantById,
  onToggle,
}: TrainerShowcasePickerProps) => {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(
    INITIAL_VISIBLE_CANDIDATES,
  );
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const selected = useMemo(
    () => selectedIds.filter(Boolean).slice(0, 6),
    [selectedIds],
  );
  const selectedSlots = useMemo(
    () => new Map(selected.map((instanceId, index) => [instanceId, index + 1])),
    [selected],
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
      aria-label="Choose featured Pokemon"
    >
      <header>
        <div>
          <span>Trainer card</span>
          <h3>Featured Pokemon</h3>
        </div>
        <strong aria-label={`${selected.length} of 6 Pokemon selected`}>
          {selected.length} / 6
        </strong>
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
            const isSelected = selectedSlot !== undefined;
            const selectionFull = selected.length >= 6 && !isSelected;

            return (
              <button
                type="button"
                className={`trainer-showcase-candidate ${
                  isSelected ? "selected" : ""
                }`}
                key={instanceId}
                aria-label={
                  isSelected
                    ? `Remove ${name} from trainer card`
                    : `Select ${name} for trainer card`
                }
                aria-pressed={isSelected}
                disabled={selectionFull}
                onClick={() => onToggle(instanceId)}
              >
                <span className="trainer-showcase-selection" aria-hidden="true">
                  {isSelected ? (
                    <>
                      <FaCheck />
                      {selectedSlot}
                    </>
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
