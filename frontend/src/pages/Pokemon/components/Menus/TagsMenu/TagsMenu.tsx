// TagsMenu.tsx

import React, { useRef, useState, useMemo } from 'react';
import './TagsMenu.css';
import useDownloadImage from './hooks/useDownloadImage';
import PreviewContainer from './PreviewContainer';
import useFavoriteList from '@/hooks/sort/useFavoriteList';
import TagItems from './TagItems';
import type { TagBuckets, TagItem } from '@/types/tags';
import type { AllVariants } from '@/types/pokemonVariants';

export interface TagsMenuProps {
  onSelectTag: (tagName: string) => void;
  activeTags : TagBuckets;
  variants   : AllVariants;
}

const TagsMenu: React.FC<TagsMenuProps> = ({
  onSelectTag,
  activeTags,
  variants,
}) => {
  // Derive system-children from the currently active buckets (own or foreign).
  // This prevents foreign profile views from accidentally using local-user children.
  const derivedChildren = useMemo(() => {
    const caught = activeTags.caught ?? {};
    const wanted = activeTags.wanted ?? {};

    const favorite: Record<string, TagItem> = {};
    const trade: Record<string, TagItem> = {};
    const mostWanted: Record<string, TagItem> = {};

    for (const [id, item] of Object.entries(caught)) {
      if ((item as any).favorite) favorite[id] = item;
      if ((item as any).is_for_trade) trade[id] = item;
    }

    for (const [id, item] of Object.entries(wanted)) {
      if ((item as any).most_wanted) mostWanted[id] = item;
    }

    return { caught: { favorite, trade }, wanted: { mostWanted } };
  }, [activeTags]);

  /* ----- tag sorting ---------------------------------------------- */
  const unsortedCaught = useMemo<TagItem[]>(() => {
    if (!activeTags.caught) return [];
    return Object.values(activeTags.caught);
  }, [activeTags.caught]);

  const sortedFavorites = useFavoriteList(
    Object.values(derivedChildren.caught.favorite || {})
  );

  // Trade (child of Caught) — unsorted
  const unsortedTrade = useMemo<TagItem[]>(() => {
    const obj = derivedChildren.caught.trade || {};
    return Object.values(obj);
  }, [derivedChildren.caught.trade]);

  // Wanted — unsorted
  const unsortedWanted = useMemo<TagItem[]>(() => {
    if (!activeTags.wanted) return [];
    return Object.values(activeTags.wanted);
  }, [activeTags.wanted]);

  // Most Wanted — unsorted
  const unsortedMostWanted = useMemo<TagItem[]>(() => {
    const obj = derivedChildren.wanted.mostWanted || {};
    return Object.values(obj);
  }, [derivedChildren.wanted.mostWanted]);


  // Public names → arrays to feed TagItems (no Missing here)
  const sortedTags: Record<string, TagItem[]> = {
    Favorites    : sortedFavorites,   // keep favorite-based sorting
    Caught       : unsortedCaught,    // raw / insertion order
    Trade        : unsortedTrade,     // raw / insertion order
    Wanted       : unsortedWanted,    // raw / insertion order
    'Most Wanted': unsortedMostWanted // raw / insertion order
  };

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
  const downloadRef = useRef<any>(null);

  const handleDownload = () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    const filename    = isPreviewMode
      ? 'preview-wanted-trade.png'
      : 'wanted-trade-pokemons.png';
    downloadImage(captureArea, filename);
  };

  // ✅ Force preview to use derived Trade (child of Caught)
  const previewTags = useMemo(
    () => ({
      wanted: activeTags.wanted ?? {},
      trade : derivedChildren.caught.trade ?? {},
    }),
    [activeTags.wanted, derivedChildren.caught.trade]
  );

  /* ----- counts for footers --------------------------------------- */
  const counts = {
    caught : sortedTags.Caught.length,
    trade  : sortedTags.Trade.length,
    wanted : sortedTags.Wanted.length,
    mostW  : sortedTags['Most Wanted'].length,
    favs   : sortedTags.Favorites.length,
  };

  const TagGroup = ({
    tagNames,
    onSelect,
  }: {
    tagNames: string[];
    onSelect: (name: string) => void;
  }) => (
    <TagItems
      tagNames={tagNames}
      sortedTags={sortedTags}
      onSelectTag={onSelect}
    />
  );

  /* ----- render ---------------------------------------------------- */
  return (
    <div className="tags-menu">
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
          activeTags={previewTags as any}
          variants={variants}
        />
      ) : (
        <>
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

          {/* TAG TREE */}
          <div className="tag-tree">
            {/* Inventory (Caught) */}
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

            {/* Wanted */}
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
          </div>
        </>
      )}
    </div>
  );
};

export default TagsMenu;
