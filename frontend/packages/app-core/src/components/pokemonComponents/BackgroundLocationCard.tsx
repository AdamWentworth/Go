import React, { useEffect, useMemo, useState } from 'react';
import './BackgroundLocationCard.css';
import type { VariantBackground } from '@/types/pokemonSubTypes';

type Props = {
  pokemon?: {
    variantType?: string;
    backgrounds?: VariantBackground[];
  };
  onSelectBackground?: (background: VariantBackground | null) => void;
  selectedCostumeId?: number;
  filterBackground?: (background: VariantBackground) => boolean;
  title?: string;
  containerClassName?: string;
  itemClassName?: string;
  selectedItemClassName?: string;
};

const getNormalizedText = (value: string | null | undefined): string => String(value ?? '').trim();

const getBackgroundTitle = (background: VariantBackground): string =>
  getNormalizedText(background.name) || 'Unknown Background';

const getBackgroundLocationLabel = (background: VariantBackground): string =>
  getNormalizedText(background.location) || getBackgroundTitle(background);

const BackgroundLocationCard: React.FC<Props> = ({
  pokemon,
  onSelectBackground,
  selectedCostumeId,
  filterBackground,
  title = 'Select Background',
  containerClassName = 'background-location-card',
  itemClassName = 'background-item',
  selectedItemClassName = 'selected',
}) => {
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<number | null>(null);

  useEffect(() => {
    setSelectedBackgroundId(null);
  }, [pokemon]);

  const handleBackgroundSelect = (background: VariantBackground | null) => {
    setSelectedBackgroundId(background?.background_id ?? null);
    onSelectBackground?.(background);
  };

  const defaultFilter = (background: VariantBackground) => {
    if (!pokemon || !background) return false;
    const normalizedVariantType = (pokemon.variantType ?? '').toLowerCase();
    const isFusionVariant =
      normalizedVariantType.startsWith('fusion_') ||
      normalizedVariantType.startsWith('shiny_fusion_');
    if (isFusionVariant) return true;

    if (selectedCostumeId != null) {
      if (!background.costume_id) return true;
      return background.costume_id === selectedCostumeId;
    }

    if (pokemon.variantType) {
      const variantTypeId = pokemon.variantType.split('_')[1];
      if (!background.costume_id) return true;
      return background.costume_id === parseInt(variantTypeId, 10);
    }

    return true;
  };

  const isSelectable = filterBackground || defaultFilter;
  const selectableBackgrounds = pokemon?.backgrounds?.filter(isSelectable) || [];
  const selectedBackground = useMemo(
    () =>
      selectableBackgrounds.find((background) => background.background_id === selectedBackgroundId) ??
      null,
    [selectableBackgrounds, selectedBackgroundId],
  );

  return (
    <div className={containerClassName}>
      <div className="background-location-card__header">
        <h3>{title}</h3>
      </div>

      <div className="background-list" role="list">
        <button
          type="button"
          className={`${itemClassName} ${selectedBackgroundId == null ? selectedItemClassName : ''}`.trim()}
          onClick={() => handleBackgroundSelect(null)}
        >
          <div className="background-card-button background-card-button--none">
            <span className="none-option">None</span>
            <span className="background-card-subtitle">No location card</span>
          </div>
        </button>

        {selectableBackgrounds.map((background) => {
          const backgroundTitle = getBackgroundTitle(background);
          const backgroundLocationLabel = getBackgroundLocationLabel(background);
          const showLocationLabel =
            backgroundLocationLabel.length > 0 &&
            backgroundLocationLabel.toLowerCase() !== backgroundTitle.toLowerCase();

          return (
            <button
              key={background.background_id}
              type="button"
              className={`${itemClassName} ${
                selectedBackgroundId === background.background_id ? selectedItemClassName : ''
              }`.trim()}
              onClick={() => handleBackgroundSelect(background)}
            >
              <div className="background-card-button">
                <div className="background-card-media">
                  <img src={background.image_url} alt={backgroundTitle} />
                </div>

                <div className="background-info">
                  <div className="background-card-title">{backgroundTitle}</div>
                  {showLocationLabel ? (
                    <div className="background-card-subtitle">{backgroundLocationLabel}</div>
                  ) : null}
                  {getNormalizedText(background.date) ? (
                    <div className="background-card-date">{background.date}</div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedBackground ? (
        <div className="selected-background background-selection-summary">
          <div className="background-selection-summary__label">Selected Background</div>
          <div className="background-selection-summary__title">
            {getBackgroundTitle(selectedBackground)}
          </div>
          <div className="background-selection-summary__meta">
            {getBackgroundLocationLabel(selectedBackground)}
          </div>
          <img
            src={selectedBackground.image_url}
            alt={getBackgroundTitle(selectedBackground)}
          />
        </div>
      ) : null}
    </div>
  );
};

export default BackgroundLocationCard;
