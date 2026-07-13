import React, { useCallback } from 'react';

import { useModal } from '@/contexts/ModalContext';

import './ActiveTagFilterChip.css';

type ActiveTagFilterChipProps = {
  tagFilter: string;
  onClearTagFilter: () => void;
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

  const handleClearActiveTagFilter = useCallback(async () => {
    const confirmed = await confirm(
      `Clear the ${trimmedTagFilter} tag? This returns you to browsing all available Pokémon and forms in Pokémon GO, without using your personal tag lists.`,
    );
    if (confirmed) {
      onClearTagFilter();
    }
  }, [confirm, onClearTagFilter, trimmedTagFilter]);

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
      ].filter(Boolean).join(' ')}
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
      <span className="active-tag-filter-name">{trimmedTagFilter}</span>
      <button
        type="button"
        className="active-tag-filter-clear"
        onClick={handleClearActiveTagFilter}
        aria-label={`Clear ${trimmedTagFilter} tag filter`}
        title={`Clear ${trimmedTagFilter} tag`}
      >
        ×
      </button>
    </div>
  );
};

export default React.memo(ActiveTagFilterChip);
