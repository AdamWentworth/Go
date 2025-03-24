// HeaderUI.jsx
// HeaderUI.jsx

import React, { useRef, useState, useEffect } from 'react';
import './HeaderUI.css';

const HeaderUI = ({
  onListsButtonClick,
  onPokedexClick,
  onPokemonClick,
  contextText,
  totalPokemon,
  highlightedCards,
  onClearSelection,
  onSelectAll,
  activeView // "pokedex", "pokemon", or "tags"
}) => {
  const hasSelection = highlightedCards && highlightedCards.size > 0;
  const isCustomContext = React.isValidElement(contextText);
  const attachPokedexClick = !isCustomContext;

  // Refs for each column + the entire header
  const headerRef = useRef(null);
  const colRefs   = [useRef(null), useRef(null), useRef(null)];

  // We only store the "left" coordinate of the underline’s center:
  const [underlineLeft, setUnderlineLeft] = useState(0);

  // Determine which tab is active
  const isPokedexActive = activeView === 'pokedex';
  const isPokemonActive = activeView === 'pokemon';
  const isTagsActive    = activeView === 'tags';
  const activeIndex     = isPokedexActive ? 0 : isPokemonActive ? 1 : 2;

  useEffect(() => {
    function updateUnderline() {
      const activeCol = colRefs[activeIndex].current;
      const headerEl  = headerRef.current;
      if (!activeCol || !headerEl) return;

      const colRect    = activeCol.getBoundingClientRect();
      const headerRect = headerEl.getBoundingClientRect();
      
      // The horizontal center of the active column in absolute coords
      const colCenter  = colRect.left + colRect.width / 2;

      // We want the center of our underline to be colCenter (but
      // everything is relative to the headerRef’s left):
      const centerWithinHeader = colCenter - headerRect.left;

      // Store that center position
      setUnderlineLeft(centerWithinHeader);
    }

    updateUnderline();
    window.addEventListener('resize', updateUnderline);
    return () => window.removeEventListener('resize', updateUnderline);
  }, [activeIndex]);

  const headerClassNames = [
    'header',
    hasSelection ? 'header-fast-select' : ''
  ];

  // Left toggle (POKÉDEX or X)
  const renderPokedexToggle = () => {
    if (hasSelection) {
      return (
        <div className="free-toggle" onClick={onClearSelection}>
          <span className="free-toggle-text">X</span>
        </div>
      );
    }
    const toggleButtonClass = isCustomContext
      ? 'toggle-button custom-context-button'
      : 'toggle-button';

    const toggleTextClass = isCustomContext
      ? 'toggle-text custom-context'
      : 'toggle-text';

    return (
      <div
        className={toggleButtonClass}
        onClick={attachPokedexClick ? onPokedexClick : undefined}
      >
        <span className={`${toggleTextClass} ${isPokedexActive ? 'active' : ''}`}>
          {isCustomContext ? contextText : 'POKÉDEX'}
        </span>
      </div>
    );
  };

  // Right toggle (TAGS or SELECT ALL)
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
      </div>
    );
  };

  return (
    <header className={headerClassNames.join(' ')} ref={headerRef}>
      <div className="controls-row">
        {/* Left Column */}
        <div className="toggle-col" ref={colRefs[0]}>
          {renderPokedexToggle()}
        </div>

        {/* Middle Column: Pokémon + total */}
        <div className="toggle-col" ref={colRefs[1]} onClick={onPokemonClick}>
          <div className="toggle-button">
            <span className={`toggle-text ${isPokemonActive ? 'active' : ''}`}>
              Pokémon
            </span>
            <span className={`toggle-text ${isPokemonActive ? 'active' : ''}`}>
              ({totalPokemon})
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="toggle-col" ref={colRefs[2]}>
          {renderListsToggle()}
        </div>
      </div>

      {/* We set only left= (the position for the center).
          The width is clamp’d in CSS; transform: translateX(-50%) does the centering. */}
      <div
        className="header-underline"
        style={{ left: underlineLeft }}
      />
    </header>
  );
};

export default React.memo(HeaderUI);