import React, { useMemo, useState } from 'react';
import { FaCheck, FaTags, FaTimes } from 'react-icons/fa';

import OverlayDismissButton from '@/components/OverlayDismissButton';
import OverlayPortal from '@/components/OverlayPortal';
import { feedback } from '@/components/feedback';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import type { PokemonInstance } from '@/types/pokemonInstance';

import './CustomTagAssignmentSheet.css';

type CustomTagAssignmentSheetProps = {
  instanceIds: Set<string>;
  onClose: () => void;
  onSaved: () => void;
};

const normalizeIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];

const CustomTagAssignmentSheet: React.FC<CustomTagAssignmentSheetProps> = ({
  instanceIds,
  onClose,
  onSaved,
}) => {
  const instances = useInstancesStore((state) => state.instances);
  const customTags = useTagsStore((state) => state.customTags);
  const applyChanges = useTagsStore((state) => state.applyCustomTagChanges);
  const [changes, setChanges] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const selectedInstances = useMemo(() => {
    const byRequestedId = new Map<string, PokemonInstance>();
    for (const [key, instance] of Object.entries(instances)) {
      if (instanceIds.has(key) || (instance.instance_id && instanceIds.has(instance.instance_id))) {
        byRequestedId.set(instance.instance_id || key, instance);
      }
    }
    return [...byRequestedId.entries()];
  }, [instanceIds, instances]);

  const tagRows = useMemo(() => {
    return (['caught', 'wanted'] as const).flatMap((parent) =>
      Object.values(customTags[parent])
        .sort((left, right) =>
          (left.tag.sort ?? 0) - (right.tag.sort ?? 0) || left.tag.name.localeCompare(right.tag.name),
        )
        .map((bucket) => {
          const eligible = selectedInstances.filter(([, instance]) =>
            parent === 'caught' ? instance.is_caught : instance.is_wanted,
          );
          const applied = eligible.filter(([, instance]) =>
            normalizeIds(parent === 'caught' ? instance.caught_tags : instance.wanted_tags)
              .includes(bucket.tag.tag_id),
          ).length;
          const current = eligible.length > 0 && applied === eligible.length;
          return {
            ...bucket.tag,
            eligible: eligible.length,
            applied,
            current,
            mixed: applied > 0 && applied < eligible.length,
            selected: changes[bucket.tag.tag_id] ?? current,
          };
        }),
    );
  }, [changes, customTags, selectedInstances]);

  const handleSave = async () => {
    if (isSaving) return;
    if (Object.keys(changes).length === 0) {
      feedback.info('No custom tag changes to save.');
      onClose();
      return;
    }
    setIsSaving(true);
    try {
      const result = await applyChanges(instanceIds, changes);
      if (result.updated > 0) {
        feedback.success(`Custom tags updated on ${result.updated} Pokémon.`);
      } else {
        feedback.info('Those Pokémon already had the selected tags.');
      }
      if (result.skipped > 0) {
        feedback.warning(`${result.skipped} selection${result.skipped === 1 ? '' : 's'} must be added to Inventory or Wanted before custom tags can be applied.`);
      }
      onSaved();
      onClose();
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Could not update custom tags.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OverlayPortal closeOnBackdrop onClose={onClose}>
      <div className="custom-tag-assignment-overlay">
        <section aria-labelledby="custom-tag-assignment-title" aria-modal="true" className="custom-tag-assignment" role="dialog">
          <header className="custom-tag-assignment__header">
            <div>
              <span><FaTags aria-hidden="true" /> Organize Pokémon</span>
              <h2 id="custom-tag-assignment-title">Custom tags</h2>
              <p>{instanceIds.size} selected · {selectedInstances.length} saved instance{selectedInstances.length === 1 ? '' : 's'}</p>
            </div>
            <OverlayDismissButton aria-label="Close custom tags" className="custom-tag-assignment__close" onDismiss={onClose}>
              <FaTimes aria-hidden="true" />
            </OverlayDismissButton>
          </header>

          <div className="custom-tag-assignment__body">
            {tagRows.length === 0 ? (
              <div className="custom-tag-assignment__empty">
                <FaTags aria-hidden="true" />
                <strong>No custom tags yet</strong>
                <p>Create Inventory or Wanted tags from the Tags panels, then apply them here.</p>
              </div>
            ) : (
              <>
                <p className="custom-tag-assignment__help">Tags organize saved Pokémon without changing Caught, For Trade, or Wanted status.</p>
                <div className="custom-tag-assignment__list">
                  {tagRows.map((tag) => (
                    <button
                      aria-pressed={tag.selected}
                      className={tag.mixed && !(tag.tag_id in changes) ? 'mixed' : ''}
                      disabled={tag.eligible === 0}
                      key={tag.tag_id}
                      onClick={() => setChanges((current) => ({ ...current, [tag.tag_id]: !tag.selected }))}
                      style={{ '--assignment-tag-color': tag.color } as React.CSSProperties}
                      type="button"
                    >
                      <span className="custom-tag-assignment__swatch" aria-hidden="true" />
                      <span className="custom-tag-assignment__label">
                        <strong>{tag.name}</strong>
                        <small>{tag.parent === 'caught' ? 'Inventory' : 'Wanted'} · {tag.applied}/{tag.eligible} selected</small>
                      </span>
                      <span className="custom-tag-assignment__check" aria-hidden="true">
                        {tag.selected ? <FaCheck /> : tag.mixed && !(tag.tag_id in changes) ? '−' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <footer className="custom-tag-assignment__footer">
            <OverlayDismissButton className="custom-tag-assignment__cancel" onDismiss={onClose}>Cancel</OverlayDismissButton>
            <button className="custom-tag-assignment__save" disabled={isSaving || tagRows.length === 0} onClick={() => void handleSave()} type="button">
              {isSaving ? 'Saving…' : 'Apply tags'}
            </button>
          </footer>
        </section>
      </div>
    </OverlayPortal>
  );
};

export default CustomTagAssignmentSheet;
