// PokedexListsMenu.tsx
import React, { ReactNode } from 'react';
import useWindowWidth from '@/pages/Pokemon/hooks/useWindowWidth';
import './PokedexListsMenu.css';
import type { PokemonVariant, AllVariants } from '@/types/pokemonVariants';
import type { PokedexLists } from '@/types/pokedex';

export interface PokedexListsMenuProps {
  setTagFilter?: (filter: string) => void;
  setHighlightedCards?: (cards: Set<number | string>) => void;
  setActiveView?: (view: string) => void;
  pokedexLists: PokedexLists;
  variants: AllVariants;
  onListSelect?: (list: PokemonVariant[]) => void;
}

const PokedexListsMenu: React.FC<PokedexListsMenuProps> = ({
  setTagFilter,
  setHighlightedCards,
  setActiveView,
  pokedexLists,
  variants,
  onListSelect,
}) => {
  const leftColumnLists: string[] = [
    'default',
    'costume',
    'shadow',
    'mega',
    'dynamax',
    'gigantamax',
    'fusion',
    'shadow costume',
  ];
  const rightColumnLists: string[] = [
    'shiny',
    'shiny costume',
    'shiny shadow',
    'shiny mega',
    'shiny dynamax',
    'shiny gigantamax',
    'shiny fusion',
  ];
  const fullWidthList = 'all';

  const displayNameMap: Record<string, string> = {
    default: 'Default',
    shiny: 'Shiny',
    costume: 'Costume',
    shadow: 'Shadow',
    'shiny costume': 'Shiny Costume',
    'shiny shadow': 'Shiny Shadow',
    'shadow costume': 'Shadow Costume',
    mega: 'Mega',
    'shiny mega': 'Shiny Mega',
    dynamax: 'Dynamax',
    'shiny dynamax': 'Shiny Dynamax',
    gigantamax: 'Gigantamax',
    'shiny gigantamax': 'Shiny Gigantamax',
    fusion: 'Fusion',
    'shiny fusion': 'Shiny Fusion',
    all: 'All',
  };

  const getClassNameForList = (listName: string): string =>
    listName.replace(/\s+/g, '-').toLowerCase();

  const handleListClick = (listName: string): void => {
    setTagFilter?.('');
    setHighlightedCards?.(new Set());
    if (onListSelect) {
      onListSelect(listName === fullWidthList ? variants : pokedexLists[listName] || []);
    }
    setActiveView?.('pokemon');
  };

  const renderHeaderIcons = (listName: string): ReactNode[] => {
    const lower = listName.toLowerCase();
    const icons: ReactNode[] = [];

    if (lower === 'fusion') {
      ['fusion_3', 'fusion_4', 'fusion_1', 'fusion_2'].forEach((key) => {
        icons.push(
          <img key={key} src={`/images/${key}.png`} alt={key} className="list-header-icon" />
        );
      });
      return icons;
    }

    if (lower === 'shiny fusion') {
      icons.push(
        <img key="shiny" src={`/images/shiny_icon.png`} alt="Shiny" className="list-header-icon" />
      );
      ['fusion_3', 'fusion_4', 'fusion_1', 'fusion_2'].forEach((key) => {
        icons.push(
          <img key={key} src={`/images/${key}.png`} alt={key} className="list-header-icon" />
        );
      });
      return icons;
    }

    if (lower.includes('shiny')) {
      icons.push(
        <img key="shiny" src={`/images/shiny_icon.png`} alt="Shiny" className="list-header-icon" />
      );
    }
    if (lower.includes('shadow')) {
      icons.push(
        <img key="shadow" src={`/images/shadow_icon.png`} alt="Shadow" className="list-header-icon" />
      );
    }
    if (lower.includes('costume')) {
      icons.push(
        <img key="costume" src={`/images/costume_icon.png`} alt="Costume" className="list-header-icon" />
      );
    }
    if (lower.includes('mega')) {
      icons.push(
        <img key="mega" src={`/images/mega.png`} alt="Mega" className="list-header-icon" />
      );
    }
    if (lower.includes('dynamax')) {
      icons.push(
        <img key="dynamax" src={`/images/dynamax-icon.png`} alt="Dynamax" className="list-header-icon" />
      );
    }
    if (lower.includes('gigantamax')) {
      icons.push(
        <img key="gigantamax" src={`/images/gigantamax-icon.png`} alt="Gigantamax" className="list-header-icon" />
      );
    }
    if (lower.includes('fusion')) {
      ['fusion_1', 'fusion_2'].forEach((key) => {
        icons.push(
          <img key={key} src={`/images/${key}.png`} alt={key} className="list-header-icon" />
        );
      });
    }
    return icons;
  };

  const renderListPreview = (listName: string): ReactNode[] => {
    const listData = listName === fullWidthList ? variants : pokedexLists[listName] || [];
    return listData.slice(0, 24).map((pokemon, index) => {
      if (!pokemon.currentImage) return null;
      const vt = pokemon.variantType.toLowerCase();
      const hasDynamax = vt.includes('dynamax');
      const hasGigantamax = vt.includes('gigantamax');
      const overlaySrc = hasGigantamax
        ? `/images/gigantamax.png`
        : hasDynamax
        ? `/images/dynamax.png`
        : '';

      return (
        <div key={pokemon.pokemonKey} className="pokedex-pokemon-list-container">
          <img
            src={pokemon.currentImage}
            alt={pokemon.species_name}
            className="pokedex-preview-image"
          />
          {overlaySrc && (
            <img
              src={overlaySrc}
              alt={hasGigantamax ? 'Gigantamax' : 'Dynamax'}
              className="pokedex-variant-overlay"
              aria-hidden="true"
            />
          )}
        </div>
      );
    });
  };

  const renderListItems = (listNames: string[]): ReactNode[] =>
    listNames.map((listName) => {
      const lower = listName.toLowerCase();
      const icons = renderHeaderIcons(listName);
      return (
        <div
          key={listName}
          className="pokedex-list-item"
          onClick={() => handleListClick(listName)}
          tabIndex={0}
          onKeyPress={(e) => { if (e.key === 'Enter') handleListClick(listName); }}
        >
          <div className={
            `pokedex-list-header ${getClassNameForList(listName)}` +
            ((lower === 'fusion' || lower === 'shiny fusion') ? ' fusion-header' : '')
          }>
            {icons.length === 2 ? (
              <>
                <span className="list-header-icon left">{icons[0]}</span>
                <span className="list-header-text">{displayNameMap[listName]}</span>
                <span className="list-header-icon right">{icons[1]}</span>
              </>
            ) : (
              <>
                {icons.length > 0 && <div className="list-header-icons">{icons}</div>}
                <span className="list-header-text">{displayNameMap[listName]}</span>
              </>
            )}
          </div>
          <div className="pokedex-pokemon-preview">
            {renderListPreview(listName).length > 0 ? renderListPreview(listName) : (
              <p className="pokedex-no-pokemon-text">No Pokémon in this list</p>
            )}
          </div>
        </div>
      );
    });

  const width = useWindowWidth();
  const isOneColumn = width < 650;

  if (isOneColumn) {
    const alternateLists: string[] = [];  
    const maxLen = Math.max(leftColumnLists.length, rightColumnLists.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < leftColumnLists.length) alternateLists.push(leftColumnLists[i]);
      if (i < rightColumnLists.length) alternateLists.push(rightColumnLists[i]);
    }
    const oneColumnOrder = [fullWidthList, ...alternateLists];
    return (
      <div className="pokedex-lists-menu one-column">
        {renderListItems(oneColumnOrder)}
      </div>
    );
  }

  return (
    <div className="pokedex-lists-menu">
      <div className="pokedex-fullwidth-list">
        {renderListItems([fullWidthList])}
      </div>
      <div className="pokedex-columns">
        <div className="pokedex-column">{renderListItems(leftColumnLists)}</div>
        <div className="pokedex-column">{renderListItems(rightColumnLists)}</div>
      </div>
    </div>
  );
};

export default PokedexListsMenu;