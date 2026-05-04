import { useCallback, useMemo, useState } from 'react';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { CaughtComputedValues } from '../utils/caughtPersist';
import type { IVs as InstanceIVs, MovesState } from '../utils/buildInstanceChanges';
import {
  areInstanceIvsEmpty,
  getInitialCaughtNumericValue,
  getInitialCpText,
  getInitialGenderState,
  getInitialIvs,
  getInitialLevel,
  getInitialMaxMoveValue,
  getInitialMoves,
  normalizeIvsForState,
  parseEditableLevel,
} from '../utils/instanceFormState';
import { normalizeEditableDateValue } from '../utils/normalizeEditableDateValue';

type UseCaughtFormStateArgs = {
  instanceData: Partial<PokemonInstance>;
};

export const useCaughtFormState = ({ instanceData }: UseCaughtFormStateArgs) => {
  const initialGenderState = getInitialGenderState(instanceData);
  const [gender, setGender] = useState<string | null>(initialGenderState.gender);
  const [isFemale, setIsFemale] = useState<boolean>(initialGenderState.isFemale);
  const [nickname, setNickname] = useState<string | null>(instanceData.nickname ?? null);
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(instanceData.favorite));
  const [isLucky, setIsLucky] = useState<boolean>(Boolean(instanceData.lucky));
  const [isTradedInternal, setIsTradedInternal] = useState<boolean>(
    Boolean(instanceData.is_traded),
  );

  const [cp, setCP] = useState<string>(getInitialCpText(instanceData));
  const [weight, setWeight] = useState<number>(
    getInitialCaughtNumericValue(instanceData.weight),
  );
  const [height, setHeight] = useState<number>(
    getInitialCaughtNumericValue(instanceData.height),
  );
  const [level, setLevel] = useState<number | null>(getInitialLevel(instanceData));

  const [moves, setMoves] = useState<MovesState>(getInitialMoves(instanceData));

  const [ivs, setIvs] = useState<InstanceIVs>(getInitialIvs(instanceData));

  const areIVsEmpty = useMemo(() => areInstanceIvsEmpty(ivs), [ivs]);

  const [locationCaught, setLocationCaught] = useState<string | null>(
    instanceData.location_caught ?? null,
  );
  const [dateCaught, setDateCaught] = useState<string | null>(instanceData.date_caught ?? null);
  const [originalTrainerName, setOriginalTrainerName] = useState<string | null>(
    instanceData.original_trainer_name ?? null,
  );
  const [originalTrainerId, setOriginalTrainerId] = useState<string | null>(
    instanceData.original_trainer_id ?? null,
  );
  const [tradedDate, setTradedDate] = useState<string | null>(
    normalizeEditableDateValue(instanceData.traded_date),
  );
  const [pokeball, setPokeball] = useState<string | null>(instanceData.pokeball ?? null);

  const [isShadow, setIsShadow] = useState<boolean>(Boolean(instanceData.shadow));
  const [isPurified, setIsPurified] = useState<boolean>(Boolean(instanceData.purified));
  const isTraded = !isShadow && (isLucky || isTradedInternal);

  const [maxAttack, setMaxAttack] = useState<string>(
    getInitialMaxMoveValue(instanceData.max_attack),
  );
  const [maxGuard, setMaxGuard] = useState<string>(
    getInitialMaxMoveValue(instanceData.max_guard),
  );
  const [maxSpirit, setMaxSpirit] = useState<string>(
    getInitialMaxMoveValue(instanceData.max_spirit),
  );
  const [showMaxOptions, setShowMaxOptions] = useState<boolean>(false);

  const handleGenderChange = useCallback((nextGender: string | null) => {
    setGender(nextGender);
    setIsFemale(nextGender === 'Female');
  }, []);
  const handleCPChange = useCallback((value: string) => setCP(value), []);
  const handleLuckyToggle = useCallback((value: boolean) => {
    setIsLucky(value);
    if (value) {
      setIsTradedInternal(true);
    }
  }, []);
  const handleIsTradedChange = useCallback(
    (value: boolean) => {
      if (isLucky && !value) {
        setIsTradedInternal(true);
        return;
      }
      setIsTradedInternal(value);
    },
    [isLucky],
  );
  const handleNicknameChange = useCallback((value: string | null) => setNickname(value), []);
  const handleFavoriteChange = useCallback((value: boolean) => setIsFavorite(value), []);
  const handleWeightChange = useCallback((value: string | number) => setWeight(Number(value)), []);
  const handleHeightChange = useCallback((value: string | number) => setHeight(Number(value)), []);
  const handleMovesChange = useCallback((value: MovesState) => setMoves(value), []);
  const handleIvChange = useCallback(
    (value: { Attack: number | '' | null; Defense: number | '' | null; Stamina: number | '' | null }) =>
      setIvs(normalizeIvsForState(value)),
    [],
  );
  const handleLocationCaughtChange = useCallback((value: string) => setLocationCaught(value), []);
  const handleDateCaughtChange = useCallback((value: string) => setDateCaught(value), []);
  const handleOriginalTrainerNameChange = useCallback(
    (value: string) => setOriginalTrainerName(value),
    [],
  );
  const handleOriginalTrainerIdChange = useCallback(
    (value: string | null) => setOriginalTrainerId(value),
    [],
  );
  const handleTradedDateChange = useCallback(
    (value: string) => setTradedDate(normalizeEditableDateValue(value)),
    [],
  );
  const handlePokeballChange = useCallback((value: string | null) => setPokeball(value), []);
  const handleLevelChange = useCallback((value: string) => {
    setLevel(parseEditableLevel(value));
  }, []);
  const handlePurifyToggle = useCallback((value: boolean) => {
    if (value) {
      setIsPurified(true);
      setIsShadow(false);
      return;
    }
    setIsPurified(false);
    setIsShadow(true);
    setIsLucky(false);
    setIsTradedInternal(false);
  }, []);
  const handleMaxAttackChange = useCallback((value: string) => setMaxAttack(value), []);
  const handleMaxGuardChange = useCallback((value: string) => setMaxGuard(value), []);
  const handleMaxSpiritChange = useCallback((value: string) => setMaxSpirit(value), []);
  const handleToggleMaxOptions = useCallback(() => setShowMaxOptions((prev) => !prev), []);

  const applyComputedValues = useCallback((newComputedValues: CaughtComputedValues) => {
    if (typeof newComputedValues.level === 'number') {
      setLevel(newComputedValues.level);
    }
    if (newComputedValues.cp !== undefined) {
      setCP(newComputedValues.cp == null ? '' : String(newComputedValues.cp));
    }
    if (newComputedValues.ivs) {
      setIvs(newComputedValues.ivs);
    }
  }, []);

  return {
    gender,
    isFemale,
    nickname,
    isFavorite,
    isLucky,
    isTraded,
    cp,
    setCP,
    weight,
    height,
    level,
    moves,
    ivs,
    areIVsEmpty,
    locationCaught,
    dateCaught,
    originalTrainerName,
    originalTrainerId,
    tradedDate,
    pokeball,
    isShadow,
    isPurified,
    maxAttack,
    maxGuard,
    maxSpirit,
    showMaxOptions,
    setShowMaxOptions,
    applyComputedValues,
    handleGenderChange,
    handleCPChange,
    handleLuckyToggle,
    handleIsTradedChange,
    handleNicknameChange,
    handleFavoriteChange,
    handleWeightChange,
    handleHeightChange,
    handleMovesChange,
    handleIvChange,
    handleLocationCaughtChange,
    handleDateCaughtChange,
    handleOriginalTrainerNameChange,
    handleOriginalTrainerIdChange,
    handleTradedDateChange,
    handlePokeballChange,
    handleLevelChange,
    handlePurifyToggle,
    handleMaxAttackChange,
    handleMaxGuardChange,
    handleMaxSpiritChange,
    handleToggleMaxOptions,
  };
};
