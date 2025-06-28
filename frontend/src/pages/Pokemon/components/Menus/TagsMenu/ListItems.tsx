// ListItems.tsx

import React, { KeyboardEvent } from 'react';
import type { TagItem } from '@/types/tags';
import './ListItems.css';

export interface ListItemsProps {
  listNames: string[];
  sortedLists: Record<string, TagItem[]>;
  onSelectList: (listName: string) => void;
}

/* -------------------------------------------------------------------------- */
/*  Robust unique-key builder                                                 */
/* -------------------------------------------------------------------------- */
function buildKey(p: TagItem, idx: number, bucket: string): string {
  /* 1⃣  Prefer the natural instance_id when present. */
  if (p.instance_id) return p.instance_id;

  /* 2⃣  Fall back to a composite of known fields. */
  const idPart   = p.pokemon_id ?? p.instance_id ?? 'unk';
  const variant  = p.variantType ?? 'base';

  /* 3⃣  Append bucket & index so keys are unique even across columns. */
  return `${bucket}-${idPart}-${variant}-${idx}`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
const ListItems: React.FC<ListItemsProps> = ({
  listNames,
  sortedLists,
  onSelectList,
}) => (
  <>
    {listNames.map((listName) => {
      const listData = sortedLists[listName] ?? [];

      /* ---------- preview thumbnails ----------------------------------- */
      const preview = listData.slice(0, 24).map((p, i) => {
        if (!p?.currentImage) return null;

        const key   = buildKey(p, i, listName);        // <<<<<<<<  UNIQUE!
        const gmax  = p.variantType?.includes('gigantamax');
        const dmax  = p.variantType?.includes('dynamax');
        const isUn  = listName === 'Unowned';

        return (
          <div key={key} className="pokemon-list-container">
            <img
              src={p.currentImage}
              alt={p.name ?? 'Unknown Pokémon'}
              className={`preview-image ${isUn ? 'unowned' : ''}`}
              draggable={false}
            />
            {(gmax || dmax) && (
              <img
                src={gmax ? '/images/gigantamax.png' : '/images/dynamax.png'}
                alt={gmax ? 'Gigantamax' : 'Dynamax'}
                className={`variant-overlay ${isUn ? 'unowned' : ''}`}
                aria-hidden
                draggable={false}
              />
            )}
          </div>
        );
      });

      /* ---------- container -------------------------------------------- */
      const filterName = listName === 'Caught' ? 'Owned' : listName;
      const onKey      = (e: KeyboardEvent<HTMLDivElement>) =>
        e.key === 'Enter' && onSelectList(filterName);

      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => onSelectList(filterName)}
          tabIndex={0}
          onKeyPress={onKey}
        >
          <div className={`list-header ${listName}`}>{listName}</div>
          <div className="pokemon-preview">
            {preview.length ? preview : (
              <p className="no-pokemon-text">No Pokémon in this list</p>
            )}
          </div>
        </div>
      );
    })}
  </>
);

export default ListItems;

