import React, { useCallback } from 'react';

import { useModal } from '@/contexts/ModalContext';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import { fromCustomTagFilter } from '@/features/tags/utils/customTagSelectors';

import './ActiveTagFilterChip.css';

type ActiveTagFilterChipProps = {
  tagFilter: string;
  onClearTagFilter?: () => void;
  placement?: 'search' | 'panel';
};

const toTagFilterClass = (tagFilter: string): string =>
  tagFilter
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const ActiveTagFilterChip: React.FC<ActiveTagFilterChipProps> = ({
  tagFilter,
  onClearTagFilter,
  placement = 'search',
}) => {
  const { confirm } = useModal();
  const trimmedTagFilter = tagFilter.trim();
  const customTagId = fromCustomTagFilter(trimmedTagFilter);
  const customTag = useTagsStore((state) => {
    if (!customTagId) return null;
    return state.customTags.caught[customTagId]?.tag ?? state.customTags.wanted[customTagId]?.tag ?? null;
  });
  const displayName = customTag?.name ?? trimmedTagFilter;

  const handleClearActiveTagFilter = useCallback(async () => {
    if (!onClearTagFilter) return;
    const confirmed = await confirm(
      `Clear the ${displayName} tag? This returns you to browsing all available Pokémon and forms in Pokémon GO, without using your personal tag lists.`,
    );
    if (confirmed) {
      onClearTagFilter();
    }
  }, [confirm, displayName, onClearTagFilter]);

  if (!trimmedTagFilter) return null;

  const isFavoritesFilter = trimmedTagFilter === 'Favorites';
  const tagFilterClass = toTagFilterClass(trimmedTagFilter);

  return (
    <div
      className={[
        'active-tag-filter-row',
        `active-tag-filter-${tagFilterClass}`,
        `active-tag-filter-placement-${placement}`,
        isFavoritesFilter ? 'active-tag-filter-with-icon' : '',
        !onClearTagFilter ? 'active-tag-filter-required' : '',
      ].filter(Boolean).join(' ')}
      aria-label={`${displayName} tag filter${
        onClearTagFilter ? '' : ', required while viewing this catalog'
      }`}
      data-custom={customTag?.color ? 'true' : undefined}
      style={customTag?.color ? { '--active-custom-tag-color': customTag.color } as React.CSSProperties : undefined}
      title={
        onClearTagFilter
          ? undefined
          : 'A tag is required while viewing another trainer’s catalog.'
      }
    >
      {isFavoritesFilter && (
        <img
          src="/images/fav_pressed.png"
          alt=""
          className="active-tag-filter-icon"
          aria-hidden
          draggable={false}
        />
      )}
      <span className="active-tag-filter-name">{displayName}</span>
      {onClearTagFilter ? (
        <button
          type="button"
          className="active-tag-filter-clear"
          onClick={handleClearActiveTagFilter}
          aria-label={`Clear ${displayName} tag filter`}
          title={`Clear ${displayName} tag`}
        >
          ×
        </button>
      ) : null}
    </div>
  );
};

export default React.memo(ActiveTagFilterChip);
