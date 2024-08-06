// useRaidBossesData.js

import { useEffect, useState } from 'react';

const CACHE_NAME = 'raidCache';
const CACHE_KEY = 'raid_bosses';

const useRaidBossesData = (variants, loading) => {
  const [raidBossesData, setRaidBossesData] = useState(null);
  const [raidLoading, setRaidLoading] = useState(true);

  useEffect(() => {
    const fetchFromCache = async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const response = await cache.match(CACHE_KEY);
        if (response) {
          const cachedData = await response.json();
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
      const raidBossCount = {};
      const foundRaidBossIds = new Set();

      const allRaidBossIds = Array.from({ length: 643 }, (_, i) => i + 1);

      const raidBossVariants = variants.filter(variant => {
        const hasRaidBoss = Array.isArray(variant.raid_boss) && variant.raid_boss.length > 0;
        return hasRaidBoss;
      });

      raidBossVariants.forEach(variant => {
        variant.raid_boss.forEach(boss => {
          const bossId = boss.id;
          if (raidBossCount[bossId]) {
            raidBossCount[bossId]++;
          } else {
            raidBossCount[bossId] = 1;
          }
          foundRaidBossIds.add(bossId);
        });
      });

      const notFoundRaidBossIds = allRaidBossIds.filter(id => !foundRaidBossIds.has(id));

      console.log('Raid boss IDs not found:', notFoundRaidBossIds);
      console.log('Storing raid boss variants in cache:', raidBossVariants);

      const enhancedRaidBossVariants = raidBossVariants.map(variant => ({
        ...variant,
        dps: variant.dps || DEFAULT_BOSS_DPS,
        attack: variant.attack || DEFAULT_BOSS_ATTACK,
        defense: variant.defense || DEFAULT_BOSS_DEFENSE,
        stamina: variant.stamina || DEFAULT_BOSS_STAMINA
      }));

      try {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(JSON.stringify(enhancedRaidBossVariants));
        await cache.put(CACHE_KEY, response);
        setRaidBossesData(enhancedRaidBossVariants);
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
