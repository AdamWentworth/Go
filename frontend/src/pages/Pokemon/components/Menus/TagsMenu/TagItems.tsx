// TagItems.tsx
import React, { KeyboardEvent } from 'react';
import type { TagItem } from '@/types/tags';
import './TagItems.css';

export interface TagSummary {
  count: number;
  preview: TagItem[];
}

export interface TagItemsProps {
  tagNames: string[];
  tagSummaries: Record<string, TagSummary>;
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
  tagSummaries,
  onSelectTag,
}) => (
  <>
    {tagNames.map((tagName) => {
      const summary = tagSummaries[tagName] ?? { count: 0, preview: [] };

      // Build preview elements and filter out nulls so empty-state logic is accurate
      const previewEls = summary.preview
        .map((p, i) => {
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
        })
        .filter(Boolean) as JSX.Element[];

      const onKey = (e: KeyboardEvent<HTMLDivElement>) =>
        e.key === 'Enter' && onSelectTag(tagName);

      // DOM order: footer THEN preview (so pseudo works)
      // Visual order: preview first via flex column-reverse in CSS
      return (
        <div
          key={tagName}
          className="tag-item"
          data-tag={tagName}
          data-empty={(!previewEls.length).toString()}
          onClick={() => onSelectTag(tagName)}
          tabIndex={0}
          onKeyDown={onKey}
        >
          <div className="tag-footer">
            <span className="tag-title">{tagName}</span>
            <span className="tag-subtitle">
              {summary.count} Pokémon have this tag.
            </span>
            {tagName === 'Favorites' && (
              <img
                src="/images/fav_pressed.png"
                alt=""
                className="tag-footer-icon"
                draggable={false}
              />
            )}
          </div>

          <div className="tag-preview">
            {previewEls.length ? (
              previewEls
            ) : (
              <p className="tag-empty-text">No Pokémon in this tag.</p>
            )}
          </div>
        </div>
      );
    })}
  </>
);

export default React.memo(TagItems);

