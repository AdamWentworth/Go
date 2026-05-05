import React from 'react';

import {
  resolveTradeTargetDisplayName,
  resolveTradeTargetPokedexLabel,
  type TradeTargetDisplayItem,
} from './tradeTargetsListState';

type TradeTargetListItemProps = {
  wantedPokemon: TradeTargetDisplayItem;
  isNotWanted: boolean;
  editMode: boolean;
  onPokemonClick?: (key: string) => void;
  onNotWantedToggle: (key: string) => void;
};

const preventImageDrag = (event: React.DragEvent<HTMLImageElement>) => {
  event.preventDefault();
};

const TradeTargetListItem: React.FC<TradeTargetListItemProps> = ({
  wantedPokemon,
  isNotWanted,
  editMode,
  onPokemonClick,
  onNotWantedToggle,
}) => {
  const imageClasses = `wanted-item-img ${isNotWanted ? 'grey-out' : ''}`;
  const backdropClasses = `lucky-backdrop ${isNotWanted ? 'grey-out' : ''}`;
  const displayName = resolveTradeTargetDisplayName(wantedPokemon);
  const pokedexLabel = resolveTradeTargetPokedexLabel(wantedPokemon);

  const handleOpenTarget = () => {
    if (!editMode) {
      onPokemonClick?.(wantedPokemon.key);
    }
  };

  return (
    <div
      className={`wanted-item ${isNotWanted ? 'is-not-wanted' : ''}`}
      onClick={handleOpenTarget}
      role={!editMode ? 'button' : undefined}
      tabIndex={!editMode ? 0 : undefined}
      onKeyDown={(event) => {
        if (!editMode && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onPokemonClick?.(wantedPokemon.key);
        }
      }}
    >
      <div className="wanted-item__media">
        {wantedPokemon.pref_lucky && (
          <img
            src="/images/lucky.png"
            className={backdropClasses}
            alt="Lucky backdrop"
            draggable={false}
            onDragStart={preventImageDrag}
          />
        )}

        {wantedPokemon.variantType?.includes('dynamax') && (
          <img
            src="/images/dynamax.png"
            alt="Dynamax"
            className="wanted-item__max-badge"
            draggable={false}
            onDragStart={preventImageDrag}
          />
        )}

        {wantedPokemon.variantType?.includes('gigantamax') && (
          <img
            src="/images/gigantamax.png"
            alt="Gigantamax"
            className="wanted-item__max-badge"
            draggable={false}
            onDragStart={preventImageDrag}
          />
        )}

        <img
          src={wantedPokemon.currentImage}
          className={imageClasses}
          alt={`Trade Target ${wantedPokemon.name}`}
          title={displayName}
          draggable={false}
          onDragStart={preventImageDrag}
        />

        {editMode && (
          <button
            type="button"
            className="toggle-not-wanted"
            onClick={(event) => {
              event.stopPropagation();
              onNotWantedToggle(wantedPokemon.key);
            }}
          >
            {isNotWanted ? '\u2713' : 'X'}
          </button>
        )}
      </div>

      <div className="wanted-item__body">
        <div className="wanted-item__name" title={displayName}>
          {displayName}
        </div>
        {pokedexLabel ? <div className="wanted-item__meta">{pokedexLabel}</div> : null}
      </div>
    </div>
  );
};

export default TradeTargetListItem;
