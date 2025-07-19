// TradeListDisplay.jsx (DEBUG VERSION – full keys w/ fallback)
// ---------------------------------------------------
// Same as previous full‑key debug version, **but now also
// checks the BASE key as a fallback** when testing
// localNotTradeList so that entries are hidden no matter
// which form of the key the data store happens to use.
// ---------------------------------------------------

import React, { useState, useEffect } from 'react';
import './TradeListDisplay.css';
import useSortManager from '@/hooks/sort/useSortManager';

// Helper kept for MIRROR logic & fallback ------------
const extractBaseKey = (pokemonKey) => {
  const parts = String(pokemonKey).split('_');
  parts.pop(); // remove trailing UUID segment
  return parts.join('_');
};

const TradeListDisplay = ({
  pokemon,
  lists,
  localNotTradeList,
  setLocalNotTradeList,
  editMode,
  toggleReciprocalUpdates,
  sortType,
  sortMode,
  onPokemonClick,
}) => {
  // -------------------------------------------------
  // Render‑time DEBUG info
  // -------------------------------------------------
  // console.log('[TradeListDisplay] render', {
  //   pokemonInstanceId: pokemon?.instanceData?.instance_id,
  //   localNotTradeList,
  //   editMode,
  // });

  // Responsive breakpoint ---------------------------
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // -------------------------------------------------
  // Toggle "Not‑for‑trade" flag (stores FULL key)
  // -------------------------------------------------
  const handleNotTradeToggle = (fullKey) => {
    if (!editMode) return;
    const updated = !localNotTradeList[fullKey];
    console.log('[TOGGLE]', { fullKey, updated });
    setLocalNotTradeList((prev) => ({ ...prev, [fullKey]: updated }));
    toggleReciprocalUpdates(fullKey, updated);
  };

  // -------------------------------------------------
  // Build list to render
  // -------------------------------------------------
  const pokemonFullKey = pokemon.instanceData.instance_id;
  const pokemonBaseKey = extractBaseKey(pokemonFullKey);

  const tradeListToDisplay = Object.entries(lists.trade).filter(
    ([fullKey, details]) => {
      const itemBaseKey = extractBaseKey(fullKey);
      const mirrorOK =
        !details.mirror || (details.mirror && itemBaseKey === pokemonBaseKey);
      const hideBecauseNotTrade =
        !!localNotTradeList[fullKey] || !!localNotTradeList[itemBaseKey];

      return (!hideBecauseNotTrade || editMode) && mirrorOK;
    }
  );

  // Transform & sort --------------------------------
  const transformedTradeList = tradeListToDisplay.map(([key, details]) => ({
    key, // FULL key – used everywhere else
    pokemon_id: details.pokemon_id,
    name: details.name,
    pokedex_number: details.pokedex_number,
    image_url: details.currentImage,
    currentImage: details.currentImage,
    image_url_shiny: details.image_url_shiny || details.currentImage,
    ...details,
  }));

  const sortedTradeListToDisplay = useSortManager(
    transformedTradeList,
    sortType,
    sortMode,
    {
      isShiny: false,
      showShadow: false,
      showCostume: false,
      showAll: true,
    }
  );

  if (!lists || sortedTradeListToDisplay.length === 0) {
    return <div>No Pokémon currently for trade.</div>;
  }

  // -------------------------------------------------
  // Styling helpers
  // -------------------------------------------------
  let containerClass = '';
  if (sortedTradeListToDisplay.length > 30) {
    containerClass = 'xxlarge-list';
  } else if (sortedTradeListToDisplay.length > 15) {
    containerClass = 'xlarge-list';
  } else if (sortedTradeListToDisplay.length > 9) {
    containerClass = 'large-list';
  }

  const gridClass = isSmallScreen ? 'max-3-per-row' : '';

  // -------------------------------------------------
  // Render
  // -------------------------------------------------
  return (
    <div className={`trade-list-container ${containerClass} ${gridClass}`}>
      {sortedTradeListToDisplay.map((poke) => {
        const isNotTrade =
          localNotTradeList[poke.key] ||
          localNotTradeList[extractBaseKey(poke.key)];
        const imageClasses = `trade-item-img ${isNotTrade ? 'grey-out' : ''}`;

        return (
          <div
            key={poke.key}
            className="trade-item"
            onClick={() => {
              if (!editMode) {
                console.log('[CLICK]', poke.key);
                onPokemonClick(poke.key);
              }
            }}
          >
            {/* Dynamax Icon */}
            {poke.variantType?.includes('dynamax') && (
              <img
                src="/images/dynamax.png"
                alt="Dynamax"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '3%',
                  width: '30%',
                  height: 'auto',
                  zIndex: 0,
                }}
              />
            )}
            {/* Gigantamax Icon */}
            {poke.variantType?.includes('gigantamax') && (
              <img
                src="/images/gigantamax.png"
                alt="Gigantamax"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '3%',
                  width: '30%',
                  height: 'auto',
                  zIndex: 0,
                }}
              />
            )}

            {/* Pokémon sprite */}
            <img
              src={poke.image_url}
              alt={`Trade Pokémon ${poke.name}`}
              className={imageClasses}
              title={`${poke.form ? `${poke.form} ` : ''}${poke.name}`}
            />

            {editMode && (
              <button
                className="toggle-not-trade"
                onClick={() => handleNotTradeToggle(poke.key)}
              >
                {isNotTrade ? '✓' : 'X'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TradeListDisplay;