// TagItems.tsx
import React, { KeyboardEvent } from 'react';
import type { TagItem } from '@/types/tags';
import './TagItems.css';

export interface TagItemsProps {
  tagNames: string[];
  sortedTags: Record<string, TagItem[]>;
  onSelectTag: (tagName: string) => void;
}

function buildKey(p: TagItem, idx: number, bucket: string): string {
  if (p.instance_id) return p.instance_id;
  const idPart  = p.pokemon_id ?? p.instance_id ?? 'unk';
  const variant = p.variantType ?? 'base';
  return `${bucket}-${idPart}-${variant}-${idx}`;
}

const TagItems: React.FC<TagItemsProps> = ({
  tagNames,
  sortedTags,
  onSelectTag,
}) => (
  <>
    {tagNames.map((tagName) => {
      const tagData = sortedTags[tagName] ?? [];

      const preview = tagData.slice(0, 24).map((p, i) => {
        if (!p?.currentImage) return null;

        const key    = buildKey(p, i, tagName);
        const gmax   = p.variantType?.includes('gigantamax');
        const dmax   = p.variantType?.includes('dynamax');
        const isMiss = tagName === 'Missing';

        return (
          <div key={key} className="tag-sprite">
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
                className={`tag-variant-overlay ${isMiss ? 'missing' : ''}`}
                aria-hidden
                draggable={false}
              />
            )}
          </div>
        );
      });

      const onKey = (e: KeyboardEvent<HTMLDivElement>) =>
        e.key === 'Enter' && onSelectTag(tagName);

      // DOM order: footer THEN preview (so `.tag-footer + .tag-preview` works)
      // Visual order: preview first (via flex column-reverse in CSS).
      return (
        <div
          key={tagName}
          className="tag-item"
          onClick={() => onSelectTag(tagName)}
          tabIndex={0}
          onKeyPress={onKey}
        >
          <div className={`tag-footer ${tagName.replace(' ', '.')}`}>{tagName}</div>
          <div className="tag-preview">
            {preview.length ? preview : (
              <p className="tag-empty-text">No Pokémon in this tag</p>
            )}
          </div>
        </div>
      );
    })}
  </>
);

export default TagItems;