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
      favorites      : Object.keys(systemChildren.caught.favorite || {}).length,
      tradeFromCaught: Object.keys(systemChildren.caught.trade || {}).length,
      mostWanted     : Object.keys(systemChildren.wanted.mostWanted || {}).length,
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

  const sortedTrade = useMemo<TagItem[]>(() => {
    if (!activeTags.trade) return [];
    return Object.values(activeTags.trade).sort(
      (a, b) => a.pokedex_number - b.pokedex_number,
    );
  }, [activeTags.trade]);

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

  const sortedMissing = useMemo<TagItem[]>(() => {
    if (!activeTags.missing) return [];
    return Object.values(activeTags.missing).sort(
      (a, b) => a.pokedex_number - b.pokedex_number,
    );
  }, [activeTags.missing]);

  const sortedTags: Record<string, TagItem[]> = {
    Favorites    : sortedFavorites,
    Caught       : sortedCaught,
    Trade        : sortedTrade,
    Wanted       : sortedWanted,
    'Most Wanted': sortedMostWanted,
    Missing      : sortedMissing,
  };

  // Click mapping: Favorites/Most Wanted map to their parents for filter logic
  const handleSelectTagInternal = (name: string) => {
    const key = name.toLowerCase();
    const mapped =
      key === 'favorites' ? 'caught'
      : key === 'most wanted' ? 'wanted'
      : key;
    onSelectTag(mapped);
  };

  /* ----- expand/collapse state ------------------------------------ */
  const [isCaughtOpen , setIsCaughtOpen ] = useState(true);
  const [isWantedOpen , setIsWantedOpen ] = useState(true);
  const [isMissingOpen, setIsMissingOpen] = useState(false);

  const toggleCaught  = () => setIsCaughtOpen(v => !v);
  const toggleWanted  = () => setIsWantedOpen(v => !v);
  const toggleMissing = () => setIsMissingOpen(v => !v);

  /* ----- preview / download --------------------------------------- */
  const [isPreviewMode     , setIsPreviewMode]      = useState(false);
  const [showColorSettings , setShowColorSettings]  = useState(false);
  const { isDownloading, downloadImage } = useDownloadImage();
  const downloadRef = useRef<any>(null);

  const handleDownload = () => {
    const captureArea = downloadRef.current?.getCaptureRef();
    const filename    = isPreviewMode
      ? 'preview-wanted-trade.png'
      : 'wanted-trade-pokemons.png';
    downloadImage(captureArea, filename);
  };

  /* ----- counts for footers --------------------------------------- */
  const counts = {
    caught : sortedTags.Caught.length,
    trade  : sortedTags.Trade.length,
    wanted : sortedTags.Wanted.length,
    mostW  : sortedTags['Most Wanted'].length,
    missing: sortedTags.Missing.length,
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
          activeTags={activeTags}
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
            {/* Caught */}
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
                    <TagGroup tagNames={['Trade']} onSelect={() => onSelectTag('trade')} />
                    <TagGroup tagNames={['Caught']} onSelect={handleSelectTagInternal} />
                  </div>
                ) : (
                  <div className="tag-peek-row">
                    <button
                      className="tag-footer tag-footer-button"
                      onClick={() => onSelectTag('trade')}
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

            {/* Missing */}
            <div className="tag-folder">
              <button
                className="tag-folder-header Missing"
                onClick={toggleMissing}
                aria-expanded={isMissingOpen}
                aria-controls="tag-folder-missing"
              >
                <span className="tag-folder-title">Missing</span>
                <span className="tag-folder-meta">
                  <span className="tag-count-badge dark">{counts.missing}</span>
                  <span className={`tag-chev ${isMissingOpen ? 'open' : ''}`} />
                </span>
              </button>

              <div id="tag-folder-missing" className="tag-folder-body">
                {isMissingOpen && (
                  <div className="tag-sublist">
                    <TagGroup tagNames={['Missing']} onSelect={handleSelectTagInternal} />
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