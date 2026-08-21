// TagsMenu.tsx

import React, { CSSProperties, useRef, useState, useMemo } from 'react';
import { FaPlus } from 'react-icons/fa';
import './TagsMenu.css';
import useDownloadImage from './hooks/useDownloadImage';
import PreviewContainer from './PreviewContainer';
import type { TagImageDownloadRef } from './TagImageDownload';
import useFavoriteList from '@/hooks/sort/useFavoriteList';
import TagItems, { type TagSummary } from './TagItems';
import type { TagBuckets, TagItem } from '@/types/tags';
import type { AllVariants } from '@/types/pokemonVariants';
import CustomTagEditorSheet from './CustomTagEditorSheet';
import { useTagsStore } from '@/features/tags/store/useTagsStore';
import {
  fromCustomTagFilter,
  toCustomTagFilter,
} from '@/features/tags/utils/customTagSelectors';
import type { TagDef } from '@/db/tagsDB';
import type { CustomTagParent } from '@shared-contracts/users';

export interface TagsMenuProps {
  onSelectTag: (tagName: string) => void;
  activeTags : TagBuckets;
  variants   : AllVariants;
  panel?: 'inventory' | 'wishlist' | 'all';
  tagFilter?: string;
  onClearTagFilter?: () => void;
  isEditable?: boolean;
}

const PREVIEW_LIMIT = 18;

function summarizeRecord(record: Record<string, TagItem> | undefined): TagSummary {
  if (!record) return { count: 0, preview: [] };

  const preview: TagItem[] = [];
  let count = 0;

  for (const item of Object.values(record)) {
    count += 1;
    if (preview.length < PREVIEW_LIMIT && item?.currentImage) {
      preview.push(item);
    }
  }

  return { count, preview };
}

function summarizeArray(items: TagItem[]): TagSummary {
  const preview: TagItem[] = [];
  let count = 0;

  for (const item of items) {
    count += 1;
    if (preview.length < PREVIEW_LIMIT && item?.currentImage) {
      preview.push(item);
    }
  }

  return { count, preview };
}

const TagsMenu: React.FC<TagsMenuProps> = ({
  onSelectTag,
  activeTags,
  variants,
  panel = 'all',
  tagFilter = '',
  onClearTagFilter,
  isEditable = false,
}) => {
  const customTags = useTagsStore((state) => state.customTags);
  const createCustomTag = useTagsStore((state) => state.createCustomTag);
  const updateCustomTag = useTagsStore((state) => state.updateCustomTag);
  const deleteCustomTag = useTagsStore((state) => state.deleteCustomTag);
  const [editingTag, setEditingTag] = useState<TagDef | null>(null);
  const [creatingFor, setCreatingFor] = useState<CustomTagParent | null>(null);
  // Derive system-children from the currently active buckets (own or foreign).
  // This prevents foreign profile views from accidentally using local-user children.
  const derivedChildren = useMemo(() => {
    const caught = activeTags.caught ?? {};
    const wanted = activeTags.wanted ?? {};

    const favorite: Record<string, TagItem> = {};
    const trade: Record<string, TagItem> = {};
    const mostWanted: Record<string, TagItem> = {};

    for (const [id, item] of Object.entries(caught)) {
      if (item.favorite) favorite[id] = item;
      if (item.is_for_trade) trade[id] = item;
    }

    for (const [id, item] of Object.entries(wanted)) {
      if (item.most_wanted) mostWanted[id] = item;
    }

    return { caught: { favorite, trade }, wanted: { mostWanted } };
  }, [activeTags]);

  /* ----- tag summaries -------------------------------------------- */
  const sortedFavorites = useFavoriteList(
    Object.values(derivedChildren.caught.favorite || {})
  );

  const customTagEntries = useMemo(() => {
    if (!isEditable) return { caught: [], wanted: [] } as Record<CustomTagParent, Array<[string, typeof customTags.caught[string]]>>;
    const sortEntries = (entries: Array<[string, typeof customTags.caught[string]]>) =>
      entries.sort(([, left], [, right]) =>
        (left.tag.sort ?? 0) - (right.tag.sort ?? 0) || left.tag.name.localeCompare(right.tag.name),
      );
    return {
      caught: sortEntries(Object.entries(customTags.caught)),
      wanted: sortEntries(Object.entries(customTags.wanted)),
    };
  }, [customTags, isEditable]);

  const tagSummaries = useMemo<Record<string, TagSummary>>(
    () => {
      const summaries: Record<string, TagSummary> = {
      Favorites: summarizeArray(sortedFavorites), // keep favorite ordering
      Caught: summarizeRecord(activeTags.caught),
      Trade: summarizeRecord(derivedChildren.caught.trade),
      Wanted: summarizeRecord(activeTags.wanted),
      'Most Wanted': summarizeRecord(derivedChildren.wanted.mostWanted),
      };
      for (const entries of Object.values(customTagEntries)) {
        for (const [tagId, bucket] of entries) {
          summaries[toCustomTagFilter(tagId)] = summarizeRecord(bucket.items);
        }
      }
      return summaries;
    },
    [
      activeTags.caught,
      activeTags.wanted,
      derivedChildren.caught.trade,
      derivedChildren.wanted.mostWanted,
      sortedFavorites,
      customTagEntries,
    ]
  );

  const customTagMetadata = useMemo(() => {
    const metadata: Record<string, { color?: string | null; displayName: string; isCustom: boolean }> = {};
    for (const entries of Object.values(customTagEntries)) {
      for (const [tagId, bucket] of entries) {
        metadata[toCustomTagFilter(tagId)] = {
          color: bucket.tag.color,
          displayName: bucket.tag.name,
          isCustom: true,
        };
      }
    }
    return metadata;
  }, [customTagEntries]);

  const handleSelectTagInternal = (name: string) => onSelectTag(name);

  /* ----- expand/collapse state ------------------------------------ */
  const [isCaughtOpen , setIsCaughtOpen ] = useState(true);
  const [isWantedOpen , setIsWantedOpen ] = useState(true);

  const toggleCaught  = () => setIsCaughtOpen(v => !v);
  const toggleWanted  = () => setIsWantedOpen(v => !v);

  /* ----- preview / download --------------------------------------- */
  const [isPreviewMode     , setIsPreviewMode]     = useState(false);
  const [showColorSettings , setShowColorSettings] = useState(false);
  const { isDownloading, downloadImage } = useDownloadImage();
  const downloadRef = useRef<TagImageDownloadRef | null>(null);

  const handleDownload = () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    if (!captureArea) return;
    const filename    = isPreviewMode
      ? 'preview-wanted-trade.png'
      : 'wanted-trade-pokemons.png';
    downloadImage(captureArea, filename);
  };

  // ✅ Force preview to use derived Trade (child of Caught)
  const previewTags = useMemo<Pick<TagBuckets, 'wanted' | 'trade'>>(
    () => ({
      wanted: activeTags.wanted ?? {},
      trade : derivedChildren.caught.trade ?? {},
    }),
    [activeTags.wanted, derivedChildren.caught.trade]
  );

  /* ----- counts for footers --------------------------------------- */
  const counts = {
    caught : tagSummaries.Caught?.count ?? 0,
    trade  : tagSummaries.Trade?.count ?? 0,
    wanted : tagSummaries.Wanted?.count ?? 0,
    mostW  : tagSummaries['Most Wanted']?.count ?? 0,
    favs   : tagSummaries.Favorites?.count ?? 0,
  };

  const showInventory = panel === 'all' || panel === 'inventory';
  const showWishlist = panel === 'all' || panel === 'wishlist';
  const showPreviewButton = panel !== 'inventory';

  const TagGroup = ({
    tagNames,
    onSelect,
    onEdit,
  }: {
    tagNames: string[];
    onSelect: (name: string) => void;
    onEdit?: (name: string) => void;
  }) => (
    <TagItems
      tagNames={tagNames}
      tagSummaries={tagSummaries}
      onSelectTag={onSelect}
      tagMetadata={customTagMetadata}
      onEditTag={onEdit}
    />
  );

  const closeEditor = () => {
    setEditingTag(null);
    setCreatingFor(null);
  };

  const editBySelector = (selector: string) => {
    const entry = [...customTagEntries.caught, ...customTagEntries.wanted]
      .find(([tagId]) => toCustomTagFilter(tagId) === selector);
    if (entry) setEditingTag(entry[1].tag);
  };

  const handleDeleteCustomTag = async (tagId: string) => {
    await deleteCustomTag(tagId);
    if (fromCustomTagFilter(tagFilter) === tagId) {
      onClearTagFilter?.();
    }
  };

  /* ----- render ---------------------------------------------------- */
  return (
    <div className={`tags-menu tags-menu-${panel}`}>
      {isPreviewMode ? (
        <PreviewContainer
          isDownloading={isDownloading}
          setIsPreviewMode={setIsPreviewMode}
          setShowColorSettings={setShowColorSettings}
          showColorSettings={showColorSettings}
          downloadRef={downloadRef}
          handleDownload={handleDownload}
          /* these keep PreviewContainer happy; its CSS has fallbacks anyway */
          previewBgColor="#e0f0e5"
          sectionFrameBgColor="#f8fff9"
          h2FontColor="#000000"
          pokemonNameColor="#000000"
          onSelectPreset={() => {}}
          activeTags={previewTags}
          variants={variants}
        />
      ) : (
        <>
          {showPreviewButton && (
            <div className="tag-toggle-row">
              <button
                className="tag-preview-toggle-button"
                onClick={() => setIsPreviewMode(true)}
              >
                <img
                  src="/images/image-icon.png"
                  alt="Image Icon"
                  className="button-icon"
                />
                Preview Trade / Wanted Image
              </button>
            </div>
          )}

          {/* TAG TREE */}
          <div className="tag-tree">
            {/* Inventory (Caught) */}
            {showInventory && (
              <div className="tag-folder">
                <button
                  className="tag-folder-header Caught"
                  onClick={toggleCaught}
                  aria-expanded={isCaughtOpen}
                  aria-controls="tag-folder-caught"
                >
                  <span className="tag-folder-title">Inventory</span>
                  <span className="tag-folder-meta">
                    <span className="tag-count-badge">{counts.caught}</span>
                    <span className={`tag-chev ${isCaughtOpen ? 'open' : ''}`} />
                  </span>
                </button>

                <div id="tag-folder-caught" className="tag-folder-body">
                  {isCaughtOpen ? (
                    <div className="tag-sublist">
                      <TagGroup tagNames={['Favorites']} onSelect={handleSelectTagInternal} />
                      <TagGroup tagNames={['Trade']} onSelect={handleSelectTagInternal} />
                      <TagGroup tagNames={['Caught']} onSelect={handleSelectTagInternal} />
                      {customTagEntries.caught.length ? (
                        <div className="tag-custom-section">
                          <div className="tag-custom-section__heading">Your inventory tags</div>
                          <TagGroup
                            tagNames={customTagEntries.caught.map(([tagId]) => toCustomTagFilter(tagId))}
                            onSelect={handleSelectTagInternal}
                            onEdit={editBySelector}
                          />
                        </div>
                      ) : null}
                      {isEditable ? (
                        <button className="tag-create-button" onClick={() => setCreatingFor('caught')} type="button">
                          <FaPlus aria-hidden="true" /> New inventory tag
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    /* ⬇ Collapsed: show all child tags as colored peek buttons */
                    <div className="tag-peek-row">
                      <button
                        className="tag-peek-button"
                        data-tag="Favorites"
                        onClick={() => handleSelectTagInternal('Favorites')}
                        title="Open Favorites"
                        aria-label="Open Favorites tag"
                      >
                        <span className="tag-peek-title">Favorites</span>
                        <span className="tag-count-badge dark">{counts.favs}</span>
                      </button>
                      {customTagEntries.caught.map(([tagId, bucket]) => (
                        <button
                          className="tag-peek-button tag-peek-button-custom"
                          key={tagId}
                          onClick={() => handleSelectTagInternal(toCustomTagFilter(tagId))}
                          style={{ '--custom-tag-color': bucket.tag.color } as CSSProperties}
                          type="button"
                        >
                          <span className="tag-peek-title">{bucket.tag.name}</span>
                          <span className="tag-count-badge dark">{Object.keys(bucket.items).length}</span>
                        </button>
                      ))}

                      <button
                        className="tag-peek-button"
                        data-tag="Trade"
                        onClick={() => handleSelectTagInternal('Trade')}
                        title="Open Trade"
                        aria-label="Open Trade tag"
                      >
                        <span className="tag-peek-title">Trade</span>
                        <span className="tag-count-badge dark">{counts.trade}</span>
                      </button>

                      <button
                        className="tag-peek-button"
                        data-tag="Caught"
                        onClick={() => handleSelectTagInternal('Caught')}
                        title="Open Caught"
                        aria-label="Open Caught tag"
                      >
                        <span className="tag-peek-title">Caught</span>
                        <span className="tag-count-badge dark">{counts.caught}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wanted */}
            {showWishlist && (
              <div className="tag-folder">
                <button
                  className="tag-folder-header Wanted"
                  onClick={toggleWanted}
                  aria-expanded={isWantedOpen}
                  aria-controls="tag-folder-wanted"
                >
                  <span className="tag-folder-title">Wanted</span>
                  <span className="tag-folder-meta">
                    <span className="tag-count-badge">{counts.wanted}</span>
                    <span className={`tag-chev ${isWantedOpen ? 'open' : ''}`} />
                  </span>
                </button>

                <div id="tag-folder-wanted" className="tag-folder-body">
                  {isWantedOpen ? (
                    <div className="tag-sublist">
                      <TagGroup tagNames={['Most Wanted']} onSelect={handleSelectTagInternal} />
                      <TagGroup tagNames={['Wanted']} onSelect={handleSelectTagInternal} />
                      {customTagEntries.wanted.length ? (
                        <div className="tag-custom-section">
                          <div className="tag-custom-section__heading">Your wanted tags</div>
                          <TagGroup
                            tagNames={customTagEntries.wanted.map(([tagId]) => toCustomTagFilter(tagId))}
                            onSelect={handleSelectTagInternal}
                            onEdit={editBySelector}
                          />
                        </div>
                      ) : null}
                      {isEditable ? (
                        <button className="tag-create-button tag-create-button-wanted" onClick={() => setCreatingFor('wanted')} type="button">
                          <FaPlus aria-hidden="true" /> New wanted tag
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    /* ⬇ Collapsed: show both child tags as colored peek buttons */
                    <div className="tag-peek-row">
                      <button
                        className="tag-peek-button"
                        data-tag="Most Wanted"
                        onClick={() => handleSelectTagInternal('Most Wanted')}
                        title="Open Most Wanted"
                        aria-label="Open Most Wanted tag"
                      >
                        <span className="tag-peek-title">Most Wanted</span>
                        <span className="tag-count-badge dark">{counts.mostW}</span>
                      </button>
                      {customTagEntries.wanted.map(([tagId, bucket]) => (
                        <button
                          className="tag-peek-button tag-peek-button-custom"
                          key={tagId}
                          onClick={() => handleSelectTagInternal(toCustomTagFilter(tagId))}
                          style={{ '--custom-tag-color': bucket.tag.color } as CSSProperties}
                          type="button"
                        >
                          <span className="tag-peek-title">{bucket.tag.name}</span>
                          <span className="tag-count-badge dark">{Object.keys(bucket.items).length}</span>
                        </button>
                      ))}

                      <button
                        className="tag-peek-button"
                        data-tag="Wanted"
                        onClick={() => handleSelectTagInternal('Wanted')}
                        title="Open Wanted"
                        aria-label="Open Wanted tag"
                      >
                        <span className="tag-peek-title">Wanted</span>
                        <span className="tag-count-badge dark">{counts.wanted}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {(editingTag || creatingFor) ? (
            <CustomTagEditorSheet
              parent={(editingTag?.parent === 'wanted' ? 'wanted' : creatingFor ?? 'caught')}
              tag={editingTag}
              onClose={closeEditor}
              onCreate={async (input) => { await createCustomTag(input); }}
              onUpdate={async (tagId, input) => { await updateCustomTag(tagId, input); }}
              onDelete={handleDeleteCustomTag}
            />
          ) : null}
        </>
      )}
    </div>
  );
};

export default TagsMenu;
