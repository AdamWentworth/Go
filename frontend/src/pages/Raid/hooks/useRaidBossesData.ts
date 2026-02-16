// useRaidBossesData.ts

import { useEffect, useState } from 'react';

const CACHE_NAME = 'raidCache';
const CACHE_KEY = 'raid_bosses';

export interface RaidBossReference {
  id: number;
}

type HasRaidBossData = {
  raid_boss?: RaidBossReference[] | null;
};

interface UseRaidBossesDataReturn<T extends HasRaidBossData> {
  raidBossesData: T[] | null;
  raidLoading: boolean;
}

const useRaidBossesData = <T extends HasRaidBossData>(
  variants: T[],
  loading: boolean,
): UseRaidBossesDataReturn<T> => {
  const [raidBossesData, setRaidBossesData] = useState<T[] | null>(null);
  const [raidLoading, setRaidLoading] = useState(true);

  useEffect(() => {
    const fetchFromCache = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(CACHE_KEY);
        if (response) {
          const cachedData = (await response.json()) as T[];
          console.log('Retrieved raid boss variants from cache:', cachedData);
          setRaidBossesData(cachedData);
          setRaidLoading(false);
        } else if (!loading && variants.length > 0) {
          processAndStoreData();
        }
      } catch (error) {
        console.error('Error fetching from cache:', error);
        if (!loading && variants.length > 0) {
          processAndStoreData();
        }
      }
    };

    const processAndStoreData = async () => {
      const raidBossCount: Record<number, number> = {};
      const foundRaidBossIds = new Set<number>();

      // List of all possible raid boss IDs between 1 and 643.
      const allRaidBossIds = Array.from({ length: 643 }, (_, i) => i + 1);

      // Filter out variants that do not have a raid_boss property or where raid_boss is an empty array.
      const raidBossVariants = variants.filter(
        (variant): variant is T & { raid_boss: RaidBossReference[] } =>
          Array.isArray(variant.raid_boss) && variant.raid_boss.length > 0,
      );

      // Increment count for each raid_boss item and track found IDs.
      raidBossVariants.forEach(variant => {
        variant.raid_boss.forEach(boss => {
          const bossId = boss.id;
          raidBossCount[bossId] = (raidBossCount[bossId] || 0) + 1;
          foundRaidBossIds.add(bossId);
        });
      });

      // Determine the IDs not found in the processed data.
      const notFoundRaidBossIds = allRaidBossIds.filter(id => !foundRaidBossIds.has(id));

      console.log('Raid boss IDs not found:', notFoundRaidBossIds);
      console.log('Storing raid boss variants in cache:', raidBossVariants);

      try {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(JSON.stringify(raidBossVariants));
        await cache.put(CACHE_KEY, response);
        setRaidBossesData(raidBossVariants);
      } catch (error) {
        console.error('Error storing data in cache:', error);
      }
      setRaidLoading(false);
    };

    fetchFromCache();
  }, [variants, loading]);

  return { raidBossesData, raidLoading };
};

export default useRaidBossesData;
