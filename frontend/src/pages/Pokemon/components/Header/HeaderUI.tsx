// HeaderUI.tsx

import React, { useRef, useState, useEffect } from 'react';
import './HeaderUI.css';

export interface HeaderUIProps {
  onListsButtonClick: () => void;
  onPokedexClick: () => void;
  onPokemonClick: () => void;
  contextText: React.ReactNode;
  totalPokemon: number;
  highlightedCards?: Set<string | number>;
  onClearSelection: () => void;
  onSelectAll: () => void;
  activeView: 'pokedex' | 'pokemon' | 'tags';
  /** optional sub-label shown under “POKÉDEX” */
  pokedexSubLabel?: string;
  /** optional sub-label shown under “TAGS” */
  tagsSubLabel?: string;                // NEW
}

const HeaderUI: React.FC<HeaderUIProps> = ({
  onListsButtonClick,
  onPokedexClick,
  onPokemonClick,
  contextText,
  totalPokemon,
  highlightedCards,
  onClearSelection,
  onSelectAll,
  activeView,
  pokedexSubLabel,
  tagsSubLabel,          // NEW
}) => {
  const hasSelection = Boolean(highlightedCards && highlightedCards.size > 0);
  const isCustomContext = React.isValidElement(contextText);
  const attachPokedexClick = !isCustomContext;

  // Refs for header and each column
  const headerRef = useRef<HTMLElement>(null);         // ← use HTMLElement here
  const colRef0 = useRef<HTMLDivElement>(null);
  const colRef1 = useRef<HTMLDivElement>(null);
  const colRef2 = useRef<HTMLDivElement>(null);

  const [underlineLeft, setUnderlineLeft] = useState(0);

  const isPokedexActive = activeView === 'pokedex';
  const isPokemonActive = activeView === 'pokemon';
  const isTagsActive = activeView === 'tags';
  const activeIndex = isPokedexActive ? 0 : isPokemonActive ? 1 : 2;

  useEffect(() => {
    const updateUnderline = () => {
      const activeCol =
        activeIndex === 0 ? colRef0.current : activeIndex === 1 ? colRef1.current : colRef2.current;
      const headerEl = headerRef.current;
      if (!activeCol || !headerEl) return;

      const colRect = activeCol.getBoundingClientRect();
      const headerRect = headerEl.getBoundingClientRect();
      const colCenter = colRect.left + colRect.width / 2;
      setUnderlineLeft(colCenter - headerRect.left);
    };

    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [activeIndex]);

  const headerClassName = `header${hasSelection ? ' header-fast-select' : ''}`;

  const renderPokedexToggle = () => {
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onClearSelection}>
          <span className="free-toggle-text">X</span>
        </div>
      );
    }

    const btnClass = isCustomContext
      ? 'toggle-button custom-context-button'
      : 'toggle-button';
    const textClass = isCustomContext
      ? 'toggle-text custom-context'
      : 'toggle-text';

    return (
      <div
        className={btnClass}
        onClick={attachPokedexClick ? onPokedexClick : undefined}
      >
        <span className={`${textClass} ${isPokedexActive ? 'active' : ''}`}>
          {isCustomContext ? contextText : 'POKÉDEX'}
        </span>

        {/* NEW — second line, only when supplied and not in custom context */}
        {!isCustomContext && pokedexSubLabel && (
          <span className={`${textClass} ${isPokedexActive ? 'active' : ''}`}>
            {pokedexSubLabel}
          </span>
        )}
      </div>
    );
  };

  const renderListsToggle = () => {
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onSelectAll}>
          <span className="free-toggle-text">SELECT ALL</span>
        </div>
      );
    }
    return (
      <div className="toggle-button" onClick={onListsButtonClick}>
        <span className={`toggle-text ${isTagsActive ? 'active' : ''}`}>
          TAGS
        </span>
        {/* NEW — second line under TAGS when supplied */}
        {tagsSubLabel && (
          <span className={`toggle-text ${isTagsActive ? 'active' : ''}`}>
            {tagsSubLabel}
          </span>
        )}
      </div>
    );
  };

  return (
    <header className={headerClassName} ref={headerRef}>
      <div className="controls-row">
        <div className="toggle-col" ref={colRef0}>
          {renderPokedexToggle()}
        </div>

        <div className="toggle-col" ref={colRef1} onClick={onPokemonClick}>
          <div className="toggle-button">
            <span className={`toggle-text ${isPokemonActive ? 'active' : ''}`}>
              Pokémon
            </span>
            <span className={`toggle-text ${isPokemonActive ? 'active' : ''}`}>
              ({totalPokemon})
            </span>
          </div>
        </div>

        <div className="toggle-col" ref={colRef2}>
          {renderListsToggle()}
        </div>
      </div>

      <div
        className="header-underline"
        style={{ left: underlineLeft }}
      />
    </header>
  );
};

export default React.memo(HeaderUI);
