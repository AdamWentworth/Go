// ListItems.tsx
import React, { KeyboardEvent } from 'react';
import type { TagItem } from '@/types/tags';
import './ListItems.css';

export interface ListItemsProps {
  listNames: string[];
  sortedLists: Record<string, TagItem[]>;
  onSelectList: (listName: string) => void;
}

function buildKey(p: TagItem, idx: number, bucket: string): string {
  if (p.instance_id) return p.instance_id;
  const idPart  = p.pokemon_id ?? p.instance_id ?? 'unk';
  const variant = p.variantType ?? 'base';
  return `${bucket}-${idPart}-${variant}-${idx}`;
}

const ListItems: React.FC<ListItemsProps> = ({
  listNames,
  sortedLists,
  onSelectList,
}) => (
  <>
    {listNames.map((listName) => {
      const listData = sortedLists[listName] ?? [];

      const preview = listData.slice(0, 24).map((p, i) => {
        if (!p?.currentImage) return null;

        const key    = buildKey(p, i, listName);
        const gmax   = p.variantType?.includes('gigantamax');
        const dmax   = p.variantType?.includes('dynamax');
        const isMiss = listName === 'Missing';

        return (
          <div key={key} className="pokemon-list-container">
            <img
              src={p.currentImage}
              alt={p.name ?? 'Unknown Pokémon'}
              className={`preview-image ${isMiss ? 'missing' : ''}`}
              draggable={false}
            />
            {(gmax || dmax) && (
              <img
                src={gmax ? '/images/gigantamax.png' : '/images/dynamax.png'}
                alt={gmax ? 'Gigantamax' : 'Dynamax'}
                className={`variant-overlay ${isMiss ? 'missing' : ''}`}
                aria-hidden
                draggable={false}
              />
            )}
          </div>
        );
      });

      const onKey = (e: KeyboardEvent<HTMLDivElement>) =>
        e.key === 'Enter' && onSelectList(listName); // no aliasing

      return (
        <div
          key={listName}
          className="list-item"
          onClick={() => onSelectList(listName)}       // no aliasing
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
