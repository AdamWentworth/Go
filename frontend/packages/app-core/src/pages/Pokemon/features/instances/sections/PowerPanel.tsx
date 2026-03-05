import React from 'react';
import './PowerPanel.css';
import MaxComponent from '../components/Caught/MaxComponent';
import MaxMovesComponent from '../components/Caught/MaxMovesComponent';
import MegaComponent from '../components/Caught/MegaComponent';
import CrownComponent from '../components/Caught/CrownComponent';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { CrownForm, MegaEvolution } from '@/types/pokemonSubTypes';
import type { MegaData } from '../utils/buildInstanceChanges';
import type { PokemonInstance } from '@/types/pokemonInstance';

type PokemonWithInstance = {
  pokemon_id?: number;
  image_url?: string;
  image_url_shiny?: string;
  variantType?: PokemonVariant['variantType'];
  variant_id?: PokemonVariant['variant_id'];
  max?: PokemonVariant['max'];
  instanceData?: Partial<PokemonInstance>;
};

interface PowerPanelProps {
  pokemon: PokemonWithInstance;
  editMode: boolean;
  megaData?: MegaData | Partial<MegaData>;
  setMegaData?: React.Dispatch<React.SetStateAction<MegaData>>;
  megaEvolutions?: MegaEvolution[];
  crownData: { isCrown: boolean; crownForm: string | null };
  setCrownData: React.Dispatch<
    React.SetStateAction<{ isCrown: boolean; crownForm: string | null }>
  >;
  crownForms?: CrownForm[];
  isShadow: boolean;
  name: string;
  dynamax: boolean;
  gigantamax: boolean;
  showMaxOptions: boolean;
  onToggleMax: () => void;
  maxAttack: string;
  maxGuard: string;
  maxSpirit: string;
  onMaxAttackChange: (value: string) => void;
  onMaxGuardChange: (value: string) => void;
  onMaxSpiritChange: (value: string) => void;
}

const PowerPanel: React.FC<PowerPanelProps> = ({
  pokemon,
  editMode,
  megaData = { isMega: false, mega: false, megaForm: null },
  setMegaData = () => undefined,
  megaEvolutions = [],
  crownData,
  setCrownData,
  crownForms = [],
  isShadow,
  name,
  dynamax,
  gigantamax,
  showMaxOptions,
  onToggleMax,
  maxAttack,
  maxGuard,
  maxSpirit,
  onMaxAttackChange,
  onMaxGuardChange,
  onMaxSpiritChange,
}) => {
  const normalizedMegaData: MegaData = {
    isMega: Boolean(megaData?.isMega),
    mega: Boolean(megaData?.mega),
    megaForm: megaData?.megaForm ?? null,
  };

  const hasMaxVariant =
    typeof pokemon.variantType === 'string' &&
    (pokemon.variantType.includes('dynamax') || pokemon.variantType.includes('gigantamax'));

  const canRenderMax =
    editMode &&
    hasMaxVariant &&
    Array.isArray(pokemon.max) &&
    pokemon.max.length > 0 &&
    !pokemon.instanceData?.shadow &&
    !pokemon.instanceData?.purified &&
      !pokemon.variantType?.includes('costume');
  const canRenderMega =
    Array.isArray(megaEvolutions) &&
    megaEvolutions.length > 0 &&
    !isShadow &&
    !name.toLowerCase().includes('clone');
  const canRenderCrown = Array.isArray(crownForms) && crownForms.length > 0 && !isShadow;
  const isShiny =
    Boolean(pokemon.instanceData?.shiny) ||
    (typeof pokemon.variantType === 'string' && pokemon.variantType.includes('shiny'));
  const renderedPowerCount =
    Number(canRenderMax) + Number(canRenderMega) + Number(canRenderCrown);

  return (
    <>
      <div className={`max-mega-container ${renderedPowerCount <= 1 ? 'max-mega-container--mega-only' : ''}`}>
        {canRenderMax ? (
          <div className="max-component">
            <MaxComponent
              pokemon={pokemon}
              editMode={editMode}
              dynamax={dynamax}
              gigantamax={gigantamax}
              onToggleMax={onToggleMax}
              showMaxOptions={showMaxOptions}
            />
          </div>
        ) : null}
        {canRenderMega ? (
          <div className="mega-component">
            <MegaComponent
              megaData={normalizedMegaData}
              setMegaData={setMegaData}
              editMode={editMode}
              megaEvolutions={megaEvolutions}
              isShadow={isShadow}
              name={name}
              basePokemonId={typeof pokemon.pokemon_id === 'number' ? pokemon.pokemon_id : null}
              baseImageUrl={pokemon.image_url ?? null}
              baseShinyImageUrl={pokemon.image_url_shiny ?? null}
              isShiny={isShiny}
            />
          </div>
        ) : null}
        {canRenderCrown ? (
          <div className="crown-component">
            <CrownComponent
              crownData={crownData}
              setCrownData={setCrownData}
              editMode={editMode}
              crownForms={crownForms}
              isShadow={isShadow}
              isShiny={isShiny}
            />
          </div>
        ) : null}
      </div>

      <MaxMovesComponent
        pokemon={pokemon}
        editMode={editMode}
        showMaxOptions={showMaxOptions}
        setShowMaxOptions={() => {
          // Kept for compatibility; no-op here.
        }}
        maxAttack={maxAttack}
        maxGuard={maxGuard}
        maxSpirit={maxSpirit}
        handleMaxAttackChange={onMaxAttackChange}
        handleMaxGuardChange={onMaxGuardChange}
        handleMaxSpiritChange={onMaxSpiritChange}
      />
    </>
  );
};

export default PowerPanel;
