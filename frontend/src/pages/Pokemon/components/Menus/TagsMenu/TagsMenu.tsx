// TagsMenu.tsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import './TagsMenu.css';
import useDownloadImage from './hooks/useDownloadImage';
import PreviewContainer from './PreviewContainer';
import useFavoriteList from '@/hooks/sort/useFavoriteList';
import TagItems from './TagItems';
import type { TagBuckets, TagItem } from '@/types/tags';
import type { AllVariants } from '@/types/pokemonVariants';
import { useTagsStore } from '@/features/tags/store/useTagsStore';

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
  const systemChildren = useTagsStore(s => s.systemChildren);

  // DEV visibility: verify cache/store contents
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const counts = Object.fromEntries(
      Object.entries(activeTags).map(([k, v]) => [k, Object.keys(v || {}).length])
    );
    const childCounts = {
      favorites  : Object.keys(systemChildren.caught.favorite || {}).length,
      trade      : Object.keys(systemChildren.caught.trade || {}).length,
      mostWanted : Object.keys(systemChildren.wanted.mostWanted || {}).length,
    };
    console.log('[TagsMenu] System buckets:', counts, activeTags);
    console.log('[TagsMenu] System children:', childCounts, systemChildren);
  }, [activeTags, systemChildren]);

  /* ----- tag sorting ---------------------------------------------- */
  const sortedCaught = useFavoriteList(
    activeTags.caught ? Object.values(activeTags.caught) : [],
  );

  const sortedFavorites = useMemo<TagItem[]>(() => {
    const arr = Object.values(systemChildren.caught.favorite || {});
    return arr.sort((a, b) => a.pokedex_number - b.pokedex_number);
  }, [systemChildren.caught.favorite]);

  // ✅ Trade is ALWAYS a child of Caught
  const sortedTrade = useMemo<TagItem[]>(() => {
    const obj = systemChildren.caught.trade || {};
    return Object.values(obj).sort((a, b) => a.pokedex_number - b.pokedex_number);
  }, [systemChildren.caught.trade]);

  const sortedWanted = useMemo<TagItem[]>(() => {
    if (!activeTags.wanted) return [];
    return Object.values(activeTags.wanted).sort(
      (a, b) => a.pokedex_number - b.pokedex_number,
    );
  }, [activeTags.wanted]);

  const sortedMostWanted = useMemo<TagItem[]>(() => {
    const obj = systemChildren.wanted.mostWanted || {};
    return Object.values(obj).sort((a, b) => a.pokedex_number - b.pokedex_number);
  }, [systemChildren.wanted.mostWanted]);

  // Public names → arrays to feed TagItems (no Missing here)
  const sortedTags: Record<string, TagItem[]> = {
    Favorites    : sortedFavorites,
    Caught       : sortedCaught,     // “See all inventory”
    Trade        : sortedTrade,      // child list from Caught only
    Wanted       : sortedWanted,     // “See all wanted”
    'Most Wanted': sortedMostWanted,
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
      trade : systemChildren.caught.trade ?? {},
    }),
    [activeTags.wanted, systemChildren.caught.trade]
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
                  <div className="tag-peek-row">
                    <button
                      className="tag-footer tag-footer-button"
                      onClick={() => handleSelectTagInternal('Trade')}
                      aria-label="Open Trade tag"
                    >
                      <span>Trade</span>
                      <span className="tag-count-badge light">{counts.trade}</span>
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
                {isWantedOpen && (
                  <div className="tag-sublist">
                    <TagGroup tagNames={['Most Wanted']} onSelect={handleSelectTagInternal} />
                    <TagGroup tagNames={['Wanted']} onSelect={handleSelectTagInternal} />
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
