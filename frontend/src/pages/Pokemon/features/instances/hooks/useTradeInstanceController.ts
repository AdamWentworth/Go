import { useCallback, useEffect, useMemo, useState } from 'react';
import { determineImageUrl } from '@/utils/imageHelpers';
import { cpMultipliers } from '@/utils/constants';
import { calculateCP } from '@/utils/calculateCP';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { VariantBackground } from '@/types/pokemonSubTypes';
import { areTradeIvsEmpty, type TradeIvs, type TradeMoves } from '../utils/tradeInstanceForm';

type BackgroundOption = VariantBackground;

export type TradePokemon = PokemonVariant & {
  instanceData: PokemonInstance;
  backgrounds: BackgroundOption[];
  max: unknown[];
};

type TradeComputedValues = {
  level?: number | null;
  cp?: number | null;
  ivs?: TradeIvs;
};

export const useTradeInstanceController = (pokemon: TradePokemon) => {
  const [isFemale, setIsFemale] = useState<boolean>(
    pokemon.instanceData.gender === 'Female',
  );
  const [currentImage, setCurrentImage] = useState<string>(
    determineImageUrl(isFemale, pokemon),
  );
  const [editMode, setEditMode] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string | null>(
    pokemon.instanceData.nickname,
  );
  const [cp, setCP] = useState<string>(
    pokemon.instanceData.cp != null ? pokemon.instanceData.cp.toString() : '',
  );
  const [gender, setGender] = useState<string | null>(pokemon.instanceData.gender);
  const [weight, setWeight] = useState<number | ''>(
    Number(pokemon.instanceData.weight) || '',
  );
  const [height, setHeight] = useState<number | ''>(
    Number(pokemon.instanceData.height) || '',
  );

  const dynamax = !!pokemon.instanceData.dynamax;
  const gigantamax = !!pokemon.instanceData.gigantamax;
  const [showMaxOptions, setShowMaxOptions] = useState<boolean>(false);

  const [maxAttack, setMaxAttack] = useState<string>(
    pokemon.instanceData.max_attack != null
      ? String(pokemon.instanceData.max_attack)
      : '',
  );
  const [maxGuard, setMaxGuard] = useState<string>(
    pokemon.instanceData.max_guard != null
      ? String(pokemon.instanceData.max_guard)
      : '',
  );
  const [maxSpirit, setMaxSpirit] = useState<string>(
    pokemon.instanceData.max_spirit != null
      ? String(pokemon.instanceData.max_spirit)
      : '',
  );

  const [moves, setMoves] = useState<TradeMoves>({
    fastMove: pokemon.instanceData.fast_move_id,
    chargedMove1: pokemon.instanceData.charged_move1_id,
    chargedMove2: pokemon.instanceData.charged_move2_id,
  });

  const [ivs, setIvs] = useState<TradeIvs>({
    Attack:
      pokemon.instanceData.attack_iv != null
        ? Number(pokemon.instanceData.attack_iv)
        : '',
    Defense:
      pokemon.instanceData.defense_iv != null
        ? Number(pokemon.instanceData.defense_iv)
        : '',
    Stamina:
      pokemon.instanceData.stamina_iv != null
        ? Number(pokemon.instanceData.stamina_iv)
        : '',
  });

  const [level, setLevel] = useState<number | null>(
    pokemon.instanceData.level != null ? Number(pokemon.instanceData.level) : null,
  );
  const [locationCaught, setLocationCaught] = useState<string | null>(
    pokemon.instanceData.location_caught,
  );
  const [dateCaught, setDateCaught] = useState<string | null>(
    pokemon.instanceData.date_caught,
  );

  const [showBackgrounds, setShowBackgrounds] = useState<boolean>(false);
  const [selectedBackground, setSelectedBackground] =
    useState<BackgroundOption | null>(null);

  const currentBaseStats = useMemo(
    () => ({
      attack: Number(pokemon.attack),
      defense: Number(pokemon.defense),
      stamina: Number(pokemon.stamina),
    }),
    [pokemon],
  );

  useEffect(() => {
    if (pokemon.instanceData.location_card !== null) {
      const locationCardId = parseInt(pokemon.instanceData.location_card, 10);
      const background = pokemon.backgrounds.find(
        (bg: BackgroundOption) => bg.background_id === locationCardId,
      );
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.instanceData.location_card]);

  useEffect(() => {
    setCurrentImage(
      determineImageUrl(
        isFemale,
        pokemon,
        false,
        undefined,
        false,
        undefined,
        false,
        gigantamax,
      ),
    );
  }, [isFemale, pokemon, gigantamax]);

  useEffect(() => {
    const { attack, defense, stamina } = currentBaseStats;
    const atk = ivs.Attack;
    const def = ivs.Defense;
    const sta = ivs.Stamina;

    if (
      level != null &&
      !isNaN(level) &&
      atk !== '' &&
      atk !== null &&
      def !== '' &&
      def !== null &&
      sta !== '' &&
      sta !== null &&
      !isNaN(atk) &&
      !isNaN(def) &&
      !isNaN(sta)
    ) {
      const multiplier = (cpMultipliers as Record<string, number>)[String(level)];
      if (multiplier) {
        const calculatedCP = calculateCP(
          attack,
          defense,
          stamina,
          Number(atk),
          Number(def),
          Number(sta),
          multiplier,
        );
        setCP(calculatedCP.toString());
      }
    }
  }, [currentBaseStats, level, ivs]);

  const areIVsEmpty = areTradeIvsEmpty(ivs);

  const handleGenderChange = useCallback((newGender: string | null) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');
  }, []);

  const handleCPChange = useCallback((newCP: string) => setCP(newCP), []);
  const handleNicknameChange = useCallback(
    (newNickname: string | null) => setNickname(newNickname),
    [],
  );
  const handleWeightChange = useCallback((newWeight: string) => {
    setWeight(newWeight === '' ? '' : Number(newWeight));
  }, []);
  const handleHeightChange = useCallback((newHeight: string) => {
    setHeight(newHeight === '' ? '' : Number(newHeight));
  }, []);
  const handleMovesChange = useCallback((newMoves: TradeMoves) => setMoves(newMoves), []);
  const handleIvChange = useCallback((newIvs: TradeIvs) => setIvs(newIvs), []);
  const handleLevelChange = useCallback((newLevel: string) => {
    setLevel(newLevel !== '' ? Number(newLevel) : null);
  }, []);
  const handleLocationCaughtChange = useCallback(
    (newLocation: string) => setLocationCaught(newLocation),
    [],
  );
  const handleDateCaughtChange = useCallback((newDate: string) => setDateCaught(newDate), []);
  const handleBackgroundSelect = useCallback((background: BackgroundOption | null) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  }, []);
  const handleToggleMaxOptions = useCallback(
    () => setShowMaxOptions((prev) => !prev),
    [],
  );

  const applyComputedValues = useCallback((computedValues: TradeComputedValues) => {
    if (computedValues.level !== undefined) {
      setLevel(computedValues.level);
    }
    if (computedValues.cp !== undefined) {
      setCP(computedValues.cp == null ? '' : String(computedValues.cp));
    }
    if (computedValues.ivs !== undefined) {
      setIvs(computedValues.ivs);
    }
  }, []);

  return {
    isFemale,
    currentImage,
    editMode,
    setEditMode,
    nickname,
    cp,
    gender,
    weight,
    height,
    dynamax,
    gigantamax,
    showMaxOptions,
    setShowMaxOptions,
    maxAttack,
    setMaxAttack,
    maxGuard,
    setMaxGuard,
    maxSpirit,
    setMaxSpirit,
    moves,
    ivs,
    areIVsEmpty,
    level,
    locationCaught,
    dateCaught,
    showBackgrounds,
    setShowBackgrounds,
    selectedBackground,
    currentBaseStats,
    applyComputedValues,
    handleGenderChange,
    handleCPChange,
    handleNicknameChange,
    handleWeightChange,
    handleHeightChange,
    handleMovesChange,
    handleIvChange,
    handleLevelChange,
    handleLocationCaughtChange,
    handleDateCaughtChange,
    handleBackgroundSelect,
    handleToggleMaxOptions,
  };
};

