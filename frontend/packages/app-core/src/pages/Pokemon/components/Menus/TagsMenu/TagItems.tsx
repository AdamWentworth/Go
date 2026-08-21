// TagItems.tsx
import React, {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { FaGripVertical } from 'react-icons/fa';
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
  tagMetadata?: Record<string, {
    color?: string | null;
    displayName: string;
    isCustom?: boolean;
  }>;
  onEditTag?: (tagName: string) => void;
  reorderMode?: boolean;
  onReorderTag?: (sourceTagName: string, targetTagName: string) => void;
}

interface DragPreview {
  layer: HTMLDivElement;
  preview: HTMLElement;
  sourceTag: string;
  offsetX: number;
  offsetY: number;
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
  tagMetadata = {},
  onEditTag,
  reorderMode = false,
  onReorderTag,
}) => {
  const [draggingTag, setDraggingTag] = useState<string | null>(null);
  const lastDragTargetRef = useRef<string | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);

  useEffect(() => () => {
    dragPreviewRef.current?.layer.remove();
    dragPreviewRef.current = null;
  }, []);

  const beginDrag = (event: PointerEvent<HTMLButtonElement>, tagName: string) => {
    event.preventDefault();
    event.stopPropagation();
    const card = event.currentTarget.closest<HTMLElement>('.tag-item');
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'tags-menu tag-drag-layer';
    layer.setAttribute('aria-hidden', 'true');

    const preview = card.cloneNode(true) as HTMLElement;
    preview.classList.add('tag-item-drag-preview');
    preview.dataset.floating = 'true';
    preview.removeAttribute('tabindex');
    preview.querySelectorAll<HTMLElement>('button').forEach((button) => {
      button.setAttribute('tabindex', '-1');
    });
    Object.assign(preview.style, {
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    });
    layer.appendChild(preview);
    document.body.appendChild(layer);

    dragPreviewRef.current?.layer.remove();
    dragPreviewRef.current = {
      layer,
      preview,
      sourceTag: tagName,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    lastDragTargetRef.current = null;
    setDraggingTag(tagName);
  };

  const continueDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragPreviewRef.current;
    if (!drag) return;
    event.preventDefault();
    event.stopPropagation();

    drag.preview.style.left = `${event.clientX - drag.offsetX}px`;
    drag.preview.style.top = `${event.clientY - drag.offsetY}px`;
    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-tag-selector]')
      ?.dataset.tagSelector;
    if (!target || target === drag.sourceTag || target === lastDragTargetRef.current) return;
    lastDragTargetRef.current = target;
    onReorderTag?.(drag.sourceTag, target);
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragPreviewRef.current?.layer.remove();
    dragPreviewRef.current = null;
    lastDragTargetRef.current = null;
    setDraggingTag(null);
  };

  return (
    <>
    {tagNames.map((tagName) => {
      const summary = tagSummaries[tagName] ?? { count: 0, preview: [] };
      const metadata = tagMetadata[tagName];
      const displayName = metadata?.displayName ?? tagName;

      // Build preview elements and filter out nulls so empty-state logic is accurate
      const previewEls = summary.preview
        .map((p, i) => {
          if (!p?.currentImage) return null;

          const key    = buildKey(p, i, tagName);
          const gmax   = p.variantType?.includes('gigantamax');
          const dmax   = p.variantType?.includes('dynamax');
          const isMiss = displayName === 'Missing';

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
        .filter(Boolean) as React.JSX.Element[];

      const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
        if (reorderMode) return;
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onSelectTag(tagName);
      };
      const handleEdit = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onEditTag?.(tagName);
      };

      // DOM order: footer THEN preview (so pseudo works)
      // Visual order: preview first via flex column-reverse in CSS
      return (
        <div
          key={tagName}
          className={`tag-item${reorderMode ? ' tag-item-reordering' : ''}`}
          data-tag={tagName}
          data-tag-selector={tagName}
          data-custom={metadata?.isCustom ? 'true' : undefined}
          data-dragging={(draggingTag === tagName).toString()}
          data-empty={(!previewEls.length).toString()}
          style={metadata?.color ? {
            '--custom-tag-color': metadata.color,
          } as CSSProperties : undefined}
          onClick={() => {
            if (!reorderMode) onSelectTag(tagName);
          }}
          tabIndex={reorderMode ? -1 : 0}
          onKeyDown={onKey}
        >
          <div className="tag-footer">
            <span className="tag-title">
              {metadata?.color ? <span className="tag-title-color" aria-hidden="true" /> : null}
              {displayName}
            </span>
            <span className="tag-subtitle">
              {summary.count} Pokémon have this tag.
            </span>
            {tagName === 'Favorites' && !reorderMode && (
              <img
                src="/images/fav_pressed.png"
                alt=""
                className="tag-footer-icon"
                draggable={false}
              />
            )}
            {metadata?.isCustom && onEditTag && !reorderMode ? (
              <button
                aria-label={`Edit ${displayName} tag`}
                className="tag-edit-button"
                onClick={handleEdit}
                type="button"
              >
                Edit
              </button>
            ) : null}
            {reorderMode ? (
              <div className="tag-reorder-controls">
                <button
                  aria-label={`Press and drag ${displayName} to reorder`}
                  className="tag-drag-handle"
                  onPointerCancel={endDrag}
                  onPointerDown={(event) => beginDrag(event, tagName)}
                  onPointerMove={continueDrag}
                  onPointerUp={endDrag}
                  type="button"
                >
                  <FaGripVertical aria-hidden="true" />
                </button>
              </div>
            ) : null}
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
};

export default React.memo(TagItems);
