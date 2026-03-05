import React from 'react';
import '@/components/modals/ModalStyles.css';
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

const resolveEnergyImageCandidates = (formLabel: string | null): string[] => {
  const normalized = normalizeToken(formLabel);
  if (!normalized) return [];
  if (normalized.includes('sword')) {
    return [
      resolveAssetUrl('/images/crowned_sword_energy.png'),
      resolveAssetUrl('/images/Crowned_Sword_Energy.png'),
    ];
  }
  if (normalized.includes('shield')) {
    return [
      resolveAssetUrl('/images/crowned_shield_energy.png'),
      resolveAssetUrl('/images/Crowned_Shield_Energy.png'),
    ];
  }
  return [];
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

  const activeForm = resolveActiveCrownForm(crownForms, crownData.crownForm) ?? crownForms[0];
  const formLabel = getCrownFormLabel(activeForm) ?? 'Crown';
  const firstBasePokemonId =
    typeof crownForms[0]?.base_pokemon_id === 'number' ? crownForms[0].base_pokemon_id : null;
  const heroImageUrl =
    buildHeroImageUrl(firstBasePokemonId, isShiny) ?? resolveAssetUrl('/images/default_pokemon.png');
  const crownImageUrl = resolveAssetUrl(
    isShiny
      ? activeForm.image_url_shiny ?? activeForm.image_url ?? '/images/default_pokemon.png'
      : activeForm.image_url ?? '/images/default_pokemon.png',
  );
  const targetLabel = crownData.isCrown ? 'Hero' : formLabel;
  const targetImageUrl = crownData.isCrown ? heroImageUrl : crownImageUrl;
  const energyImageCandidates = crownData.isCrown ? [] : resolveEnergyImageCandidates(formLabel);
  const hasLeftEnergyIcon = energyImageCandidates.length > 0;
  const leftImageSrc = hasLeftEnergyIcon ? energyImageCandidates[0] : targetImageUrl;
  const leftImageAlt = hasLeftEnergyIcon ? `${formLabel} energy` : targetLabel;
  const leftImageClass = hasLeftEnergyIcon
    ? 'crown-partner-icon crown-partner-icon--energy'
    : 'crown-partner-icon crown-partner-icon--target';
  const showRightImage = hasLeftEnergyIcon;

  const setCrownForm = (nextForm: string | null, isCrownNext: boolean) => {
    setCrownData({
      isCrown: isCrownNext,
      crownForm: isCrownNext ? nextForm : null,
    });
  };

  return (
    <div className="crown-component crown-component--stateful">
      <div className="crown-state-row">
        <button
          type="button"
          className="crown-action-button btn btn-success"
          onClick={() =>
            crownData.isCrown ? setCrownForm(null, false) : setCrownForm(formLabel, true)
          }
          disabled={!editMode}
          title={`Change to ${targetLabel} form`}
        >
          <img
            src={leftImageSrc}
            alt={leftImageAlt}
            className={leftImageClass}
            onError={
              hasLeftEnergyIcon
                ? (event) => {
                    const currentIndex = Number.parseInt(
                      event.currentTarget.dataset.fallbackIndex ?? '0',
                      10,
                    );
                    const nextIndex = currentIndex + 1;
                    if (nextIndex >= energyImageCandidates.length) return;
                    event.currentTarget.src = energyImageCandidates[nextIndex];
                    event.currentTarget.dataset.fallbackIndex = String(nextIndex);
                  }
                : undefined
            }
          />

          <span className="crown-action-text">Change Form</span>

          {showRightImage ? (
            <img
              src={targetImageUrl}
              alt={targetLabel}
              className="crown-partner-icon crown-partner-icon--target"
            />
          ) : null}
        </button>
      </div>
    </div>
  );
};

export default CrownComponent;
