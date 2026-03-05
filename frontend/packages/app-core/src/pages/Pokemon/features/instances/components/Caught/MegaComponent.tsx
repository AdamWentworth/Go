// MegaComponent.tsx

import React from 'react';
import '@/components/modals/ModalStyles.css';
import './MegaComponent.css';
import type { MegaData } from '../../utils/buildInstanceChanges';
import type { MegaEvolution } from '@/types/pokemonSubTypes';
import { resolveAssetUrl } from '@/utils/assetUrl';

const MEGA_ICON_URL = resolveAssetUrl('/media/images/mega.png');

interface MegaComponentProps {
  megaData: MegaData;
  setMegaData: React.Dispatch<React.SetStateAction<MegaData>>;
  editMode: boolean;
  megaEvolutions?: MegaEvolution[];
  isShadow: boolean;
  name?: string;
  basePokemonId?: number | null;
  baseImageUrl?: string | null;
  baseShinyImageUrl?: string | null;
  isShiny?: boolean;
}

const normalizeToken = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');

const buildPokemonIconUrl = (pokemonId: number, isShiny: boolean) =>
  resolveAssetUrl(
    isShiny
      ? `/media/images/shiny/shiny_pokemon_${pokemonId}.png`
      : `/media/images/default/pokemon_${pokemonId}.png`,
  );

const buildMegaImageUrl = (megaEvolution: MegaEvolution | null, isShiny: boolean): string =>
  resolveAssetUrl(
    (isShiny
      ? megaEvolution?.image_url_shiny ?? megaEvolution?.image_url
      : megaEvolution?.image_url) ?? '/images/default_pokemon.png',
  );

const buildBaseImageUrl = ({
  basePokemonId,
  isShiny,
  baseImageUrl,
  baseShinyImageUrl,
}: {
  basePokemonId: number | null;
  isShiny: boolean;
  baseImageUrl: string | null;
  baseShinyImageUrl: string | null;
}): string => {
  if (typeof basePokemonId === 'number') {
    return buildPokemonIconUrl(basePokemonId, isShiny);
  }

  return resolveAssetUrl(
    isShiny ? baseShinyImageUrl ?? baseImageUrl ?? '/images/default_pokemon.png' : baseImageUrl ?? '/images/default_pokemon.png',
  );
};

const resolveNextMegaState = (megaData: MegaData, megaEvolutions: MegaEvolution[]): MegaData => {
  const { isMega, megaForm } = megaData;

  if (!isMega) {
    return {
      isMega: true,
      mega: true,
      megaForm: megaEvolutions.length > 0 ? megaEvolutions[0].form ?? null : null,
    };
  }

  if (megaEvolutions.length <= 1) {
    return {
      isMega: false,
      mega: true,
      megaForm: null,
    };
  }

  const currentIndex = megaEvolutions.findIndex(
    (evolution) => normalizeToken(evolution.form) === normalizeToken(megaForm),
  );
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (safeCurrentIndex + 1) % (megaEvolutions.length + 1);

  if (nextIndex === megaEvolutions.length) {
    return {
      isMega: false,
      mega: true,
      megaForm: null,
    };
  }

  return {
    isMega: true,
    mega: true,
    megaForm: megaEvolutions[nextIndex].form ?? null,
  };
};

const MegaComponent: React.FC<MegaComponentProps> = ({
  megaData,
  setMegaData,
  editMode,
  megaEvolutions = [],
  isShadow,
  name,
  basePokemonId = null,
  baseImageUrl = null,
  baseShinyImageUrl = null,
  isShiny = false,
}) => {
  if (
    !megaEvolutions ||
    megaEvolutions.length === 0 ||
    isShadow ||
    (name && name.toLowerCase().includes("clone"))
  ) {
    return null; // Do not render anything if conditions are not met
  }

  const nextMegaState = resolveNextMegaState(megaData, megaEvolutions);
  const nextMegaEvolution = nextMegaState.isMega
    ? megaEvolutions.find(
        (evolution) =>
          normalizeToken(evolution.form) === normalizeToken(nextMegaState.megaForm),
      ) ?? megaEvolutions[0]
    : null;

  const handleClick = () => {
    if (!editMode) return;
    setMegaData(nextMegaState);
  };

  const actionLabel = megaData.isMega ? 'Change Form' : 'Mega Evolve';
  const leftImageSrc = nextMegaState.isMega
    ? MEGA_ICON_URL
    : buildBaseImageUrl({
        basePokemonId,
        isShiny,
        baseImageUrl,
        baseShinyImageUrl,
      });
  const leftImageAlt = nextMegaState.isMega ? 'Mega Icon' : 'Base Form';
  const rightImageSrc = nextMegaEvolution
    ? buildMegaImageUrl(nextMegaEvolution, isShiny)
    : null;

  return (
    <div className="mega-component mega-component--stateful">
      <div className="mega-state-row">
        <button
          type="button"
          className="mega-action-button btn btn-success"
          onClick={handleClick}
          disabled={!editMode}
          title={actionLabel}
        >
          <img
            src={leftImageSrc}
            alt={leftImageAlt}
            className={`mega-action-icon ${nextMegaState.isMega ? 'mega-action-icon--mega' : 'mega-action-icon--base'}`}
          />

          <span className="mega-action-text">{actionLabel}</span>

          {rightImageSrc ? (
            <img src={rightImageSrc} alt="Mega Form" className="mega-target-icon" />
          ) : null}
        </button>
      </div>
    </div>
  );
};

export default MegaComponent;
