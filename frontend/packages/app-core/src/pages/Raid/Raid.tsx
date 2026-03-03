import React, { useEffect, useState } from 'react';
import './Raid.css';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Move as PokemonMove } from '@/types/pokemonSubTypes';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getMoveCombinations } from './utils/moveCombinations';
import type { MoveCombination } from './utils/moveCombinations';
import Pagination from './Pagination';
import Table from './Table';
import useRaidBossesData from './hooks/useRaidBossesData';
import { DEFAULT_RAID_BOSS_STATS, TYPE_MAPPING } from './utils/constants';
import { calculateRaidBossDPS } from './utils/calculateRaidBossDPS';
import RaidBossSelector from './RaidBossSelector';
import MoveSelector from './MoveSelector';

type RaidPageVariant = PokemonVariant & {
  raid_boss?: Array<{ id: number }>;
  moves: PokemonMove[];
};

type RaidBossStats = {
  dps: number | string[];
  attack: number;
  defense: number;
  stamina: number;
};

const LEVEL_50_CP_MULTIPLIER = 0.84029999;
const ITEMS_PER_PAGE = 15;

const Raid: React.FC = () => {
  const variants = useVariantsStore((state) => state.variants) as RaidPageVariant[];
  const loading = useVariantsStore((state) => state.variantsLoading);
  const { raidBossesData, raidLoading } = useRaidBossesData(variants, loading);

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRaidBoss, setSelectedRaidBoss] = useState<RaidPageVariant | null>(null);
  const [selectedFastMove, setSelectedFastMove] = useState<PokemonMove | null>(null);
  const [selectedChargedMove, setSelectedChargedMove] = useState<PokemonMove | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pokemonFilter, setPokemonFilter] = useState('');
  const [showBest, setShowBest] = useState(false);

  useEffect(() => {
    if (raidBossesData && raidBossesData.length > 0) {
      setSelectedRaidBoss(null);
    }
  }, [raidBossesData]);

  useEffect(() => {
    if (selectedRaidBoss) {
      setSelectedFastMove(null);
      setSelectedChargedMove(null);
    }
  }, [selectedRaidBoss]);

  if (loading || raidLoading) {
    return <LoadingSpinner />;
  }

  const availableRaidBosses = raidBossesData ?? [];

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value === '') {
      setSelectedRaidBoss(null);
      return;
    }

    const matchedBoss =
      availableRaidBosses.find((boss) => boss.name.toLowerCase() === value.toLowerCase()) ?? null;
    setSelectedRaidBoss(matchedBoss);
  };

  const handlePokemonFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPokemonFilter(event.target.value.toLowerCase());
  };

  const handleBestToggle = () => {
    setShowBest((previous) => !previous);
  };

  const filteredRaidBosses = availableRaidBosses.filter((boss) =>
    boss.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredVariants = variants.filter((variant) => {
    const variantType1 = TYPE_MAPPING[variant.type_1_id]?.name.toLowerCase() ?? 'unknown';
    const variantType2 = TYPE_MAPPING[variant.type_2_id]?.name.toLowerCase() ?? 'unknown';
    const variantName = variant.name.toLowerCase();

    return (
      !(variant.variantType.includes('shiny') || variant.variantType.startsWith('costume')) &&
      (variantName.includes(pokemonFilter) ||
        variantType1.includes(pokemonFilter) ||
        variantType2.includes(pokemonFilter))
    );
  });

  let raidBossStats: RaidBossStats = { ...DEFAULT_RAID_BOSS_STATS };

  if (selectedRaidBoss) {
    const raidBossAttackStat = Math.floor(selectedRaidBoss.attack + 15);
    const raidBossDefenseStat = Math.floor(selectedRaidBoss.defense + 15);
    const raidBossStaminaStat = Math.floor(selectedRaidBoss.stamina + 15);

    const playerPokemons = filteredVariants.map((variant) => ({
      name: variant.name,
      form: variant.form,
      attack: Math.floor((variant.attack + 15) * LEVEL_50_CP_MULTIPLIER),
      defense: Math.floor((variant.defense + 15) * LEVEL_50_CP_MULTIPLIER),
      stamina: Math.floor((variant.stamina + 15) * LEVEL_50_CP_MULTIPLIER),
      type1: TYPE_MAPPING[variant.type_1_id]?.name ?? 'unknown',
      type2: TYPE_MAPPING[variant.type_2_id]?.name ?? 'none',
    }));

    const raidBossDPS = calculateRaidBossDPS(
      selectedRaidBoss,
      raidBossAttackStat,
      playerPokemons,
      selectedFastMove ?? undefined,
      selectedChargedMove ?? undefined,
    );

    raidBossStats = {
      ...selectedRaidBoss,
      attack: raidBossAttackStat,
      defense: raidBossDefenseStat,
      stamina: raidBossStaminaStat,
      dps: raidBossDPS,
    };
  }

  let moveCombinations: MoveCombination[] = filteredVariants.flatMap((variant, index) => {
    const bossDpsValue = Array.isArray(raidBossStats.dps)
      ? Number(raidBossStats.dps[index] ?? 0)
      : raidBossStats.dps;

    return getMoveCombinations(
      variant,
      bossDpsValue,
      raidBossStats.attack,
      raidBossStats.defense,
      raidBossStats.stamina,
      selectedRaidBoss,
    );
  });

  moveCombinations = moveCombinations.sort((a, b) => b.dps - a.dps);

  if (showBest) {
    const bestCombinations: Record<string, MoveCombination> = {};

    moveCombinations.forEach((combo) => {
      const key = combo.name;
      if (!bestCombinations[key] || Number(combo.dps) > Number(bestCombinations[key].dps)) {
        bestCombinations[key] = combo;
      }
    });

    moveCombinations = Object.values(bestCombinations).sort(
      (a, b) => Number(b.dps) - Number(a.dps),
    );
  }

  const totalPages = Math.ceil(moveCombinations.length / ITEMS_PER_PAGE);
  const currentItems = moveCombinations.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div className="raid-container">
      <h1>Raid Page</h1>
      <RaidBossSelector
        searchTerm={searchTerm}
        handleInputChange={handleInputChange}
        filteredRaidBosses={filteredRaidBosses}
      />
      {selectedRaidBoss && (
        <>
          <MoveSelector
            moves={selectedRaidBoss.moves.filter((move) => move.is_fast === 1)}
            selectedMove={selectedFastMove}
            onMoveSelect={(move) => setSelectedFastMove((move as PokemonMove) ?? null)}
            moveType="Fast"
          />
          <MoveSelector
            moves={selectedRaidBoss.moves.filter((move) => move.is_fast === 0)}
            selectedMove={selectedChargedMove}
            onMoveSelect={(move) => setSelectedChargedMove((move as PokemonMove) ?? null)}
            moveType="Charged"
          />
        </>
      )}
      <input
        type="text"
        value={pokemonFilter}
        onChange={handlePokemonFilterChange}
        placeholder="Filter Pokemon by name or type"
        className="pokemon-filter-input"
      />
      <button onClick={handleBestToggle} className="best-button">
        {showBest ? 'Show All' : 'Show Best'}
      </button>
      <Table moves={currentItems} />
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
};

export default Raid;
