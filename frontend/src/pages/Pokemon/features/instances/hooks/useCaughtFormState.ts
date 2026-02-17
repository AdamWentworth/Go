import { useCallback, useMemo, useState } from 'react';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { CaughtComputedValues } from '../utils/caughtPersist';
import type { IVs as InstanceIVs, MovesState } from '../utils/buildInstanceChanges';

type UseCaughtFormStateArgs = {
  instanceData: Partial<PokemonInstance>;
};

export const useCaughtFormState = ({ instanceData }: UseCaughtFormStateArgs) => {
  const [gender, setGender] = useState<string | null>(instanceData.gender ?? null);
  const [isFemale, setIsFemale] = useState<boolean>(instanceData.gender === 'Female');
  const [nickname, setNickname] = useState<string | null>(instanceData.nickname ?? null);
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(instanceData.favorite));
  const [isLucky, setIsLucky] = useState<boolean>(Boolean(instanceData.lucky));

  const [cp, setCP] = useState<string>(instanceData.cp != null ? String(instanceData.cp) : '');
  const [weight, setWeight] = useState<number>(Number(instanceData.weight ?? 0));
  const [height, setHeight] = useState<number>(Number(instanceData.height ?? 0));
  const [level, setLevel] = useState<number | null>(
    instanceData.level != null ? Number(instanceData.level) : null,
  );

  const [moves, setMoves] = useState<MovesState>({
    fastMove: instanceData.fast_move_id ?? null,
    chargedMove1: instanceData.charged_move1_id ?? null,
    chargedMove2: instanceData.charged_move2_id ?? null,
  });

  const [ivs, setIvs] = useState<InstanceIVs>({
    Attack: instanceData.attack_iv != null ? Number(instanceData.attack_iv) : '',
    Defense: instanceData.defense_iv != null ? Number(instanceData.defense_iv) : '',
    Stamina: instanceData.stamina_iv != null ? Number(instanceData.stamina_iv) : '',
  });

  const areIVsEmpty = useMemo(
    () => ivs.Attack === '' && ivs.Defense === '' && ivs.Stamina === '',
    [ivs],
  );

  const [locationCaught, setLocationCaught] = useState<string | null>(
    instanceData.location_caught ?? null,
  );
  const [dateCaught, setDateCaught] = useState<string | null>(instanceData.date_caught ?? null);

  const [isShadow, setIsShadow] = useState<boolean>(Boolean(instanceData.shadow));
  const [isPurified, setIsPurified] = useState<boolean>(Boolean(instanceData.purified));

  const [maxAttack, setMaxAttack] = useState<string>(String(instanceData.max_attack ?? ''));
  const [maxGuard, setMaxGuard] = useState<string>(String(instanceData.max_guard ?? ''));
  const [maxSpirit, setMaxSpirit] = useState<string>(String(instanceData.max_spirit ?? ''));
  const [showMaxOptions, setShowMaxOptions] = useState<boolean>(false);

  const handleGenderChange = useCallback((nextGender: string | null) => {
    setGender(nextGender);
    setIsFemale(nextGender === 'Female');
  }, []);
  const handleCPChange = useCallback((value: string) => setCP(value), []);
  const handleLuckyToggle = useCallback((value: boolean) => setIsLucky(value), []);
  const handleNicknameChange = useCallback((value: string | null) => setNickname(value), []);
  const handleFavoriteChange = useCallback((value: boolean) => setIsFavorite(value), []);
  const handleWeightChange = useCallback((value: string | number) => setWeight(Number(value)), []);
  const handleHeightChange = useCallback((value: string | number) => setHeight(Number(value)), []);
  const handleMovesChange = useCallback((value: MovesState) => setMoves(value), []);
  const handleIvChange = useCallback(
    (value: { Attack: number | '' | null; Defense: number | '' | null; Stamina: number | '' | null }) =>
      setIvs({
        Attack: value.Attack ?? '',
        Defense: value.Defense ?? '',
        Stamina: value.Stamina ?? '',
      }),
    [],
  );
  const handleLocationCaughtChange = useCallback((value: string) => setLocationCaught(value), []);
  const handleDateCaughtChange = useCallback((value: string) => setDateCaught(value), []);
  const handleLevelChange = useCallback((value: string) => {
    setLevel(value !== '' ? Number(value) : null);
  }, []);
  const handlePurifyToggle = useCallback((value: boolean) => {
    if (value) {
      setIsPurified(true);
      setIsShadow(false);
      return;
    }
    setIsPurified(false);
    setIsShadow(true);
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
    handleNicknameChange,
    handleFavoriteChange,
    handleWeightChange,
    handleHeightChange,
    handleMovesChange,
    handleIvChange,
    handleLocationCaughtChange,
    handleDateCaughtChange,
    handleLevelChange,
    handlePurifyToggle,
    handleMaxAttackChange,
    handleMaxGuardChange,
    handleMaxSpiritChange,
    handleToggleMaxOptions,
  };
};

