import React from 'react';
import './CrownComponent.css';
import type { CrownForm } from '@/types/pokemonSubTypes';
import { getCrownFormLabel, resolveActiveCrownForm } from '@/utils/crownHelpers';
import { resolveAssetUrl } from '@/utils/assetUrl';

interface CrownData {
  isCrown: boolean;
  crownForm: string | null;
}

interface CrownComponentProps {
  crownData: CrownData;
  setCrownData: React.Dispatch<React.SetStateAction<CrownData>>;
  editMode: boolean;
  crownForms?: CrownForm[];
  isShadow: boolean;
  isShiny?: boolean;
}

const normalizeToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const buildHeroImageUrl = (basePokemonId: number | null, isShiny: boolean): string | null => {
  if (basePokemonId == null) return null;
  return resolveAssetUrl(
    isShiny
      ? `/images/shiny/shiny_pokemon_${basePokemonId}.png`
      : `/images/default/pokemon_${basePokemonId}.png`,
  );
};

const resolveEnergyImageUrl = (formLabel: string | null): string | null => {
  const normalized = normalizeToken(formLabel);
  if (!normalized) return null;
  if (normalized.includes('sword')) {
    return resolveAssetUrl('/images/crowned_sword_energy.png');
  }
  if (normalized.includes('shield')) {
    return resolveAssetUrl('/images/crowned_shield_energy.png');
  }
  return null;
};

const CrownComponent: React.FC<CrownComponentProps> = ({
  crownData,
  setCrownData,
  editMode,
  crownForms = [],
  isShadow,
  isShiny = false,
}) => {
  if (!Array.isArray(crownForms) || crownForms.length === 0 || isShadow) {
    return null;
  }

  const activeForm = resolveActiveCrownForm(crownForms, crownData.crownForm);
  const imageUrl = activeForm?.image_url ?? '/images/default_pokemon.png';
  const formLabel = getCrownFormLabel(activeForm) ?? 'Crown';
  const firstBasePokemonId =
    typeof crownForms[0]?.base_pokemon_id === 'number' ? crownForms[0].base_pokemon_id : null;
  const heroImageUrl =
    buildHeroImageUrl(firstBasePokemonId, isShiny) ?? resolveAssetUrl('/images/default_pokemon.png');

  const setCrownForm = (nextForm: string | null, isCrownNext: boolean) => {
    setCrownData({
      isCrown: isCrownNext,
      crownForm: isCrownNext ? nextForm : null,
    });
  };

  if (!editMode) {
    return (
      <div className="crown-component">
        <img
          src={imageUrl}
          alt="Crown Toggle"
          className={`crown-image ${crownData.isCrown ? 'saturated' : 'desaturated'} static-mode`}
          title={crownData.isCrown ? formLabel : 'Normal'}
        />
      </div>
    );
  }

  return (
    <div className="crown-component crown-component--actions">
      {crownForms.map((form) => {
        const label = getCrownFormLabel(form);
        if (!label) return null;

        const energyImageUrl = resolveEnergyImageUrl(label);
        const crownImageUrl = resolveAssetUrl(
          isShiny
            ? form.image_url_shiny ?? form.image_url ?? '/images/default_pokemon.png'
            : form.image_url ?? '/images/default_pokemon.png',
        );
        const isActive =
          crownData.isCrown && normalizeToken(crownData.crownForm) === normalizeToken(label);

        return (
          <button
            key={`${form.id}-${label}`}
            type="button"
            className={`crown-action-button ${isActive ? 'is-active' : ''}`}
            onClick={() => setCrownForm(label, true)}
            disabled={isActive}
            title={`Change to ${label} form`}
          >
            {energyImageUrl ? (
              <img
                src={energyImageUrl}
                alt={`${label} energy`}
                className="crown-action-icon crown-action-icon--energy"
              />
            ) : null}
            <img
              src={crownImageUrl}
              alt={label}
              className="crown-action-icon crown-action-icon--form"
            />
            <span className="crown-action-text">{`Change to ${label} form`}</span>
          </button>
        );
      })}

      <button
        type="button"
        className={`crown-action-button crown-action-button--hero ${
          !crownData.isCrown ? 'is-active' : ''
        }`}
        onClick={() => setCrownForm(null, false)}
        disabled={!crownData.isCrown}
        title="Change to Hero form"
      >
        <img
          src={heroImageUrl}
          alt="Hero form"
          className="crown-action-icon crown-action-icon--form"
        />
        <span className="crown-action-text">Change to Hero form</span>
      </button>
    </div>
  );
};

export default CrownComponent;
