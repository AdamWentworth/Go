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

      // List of all possible raid boss IDs between 1 and 643
      const allRaidBossIds = Array.from({ length: 643 }, (_, i) => i + 1);

      // Filter out the variants that do not have a raid_boss property or where raid_boss is an empty list
      const raidBossVariants = variants.filter(variant => {
        const hasRaidBoss = Array.isArray(variant.raid_boss) && variant.raid_boss.length > 0;
        return hasRaidBoss;
      });

      // Increment count for each raid_boss item and track found IDs
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

      // Determine the IDs not found in the processed data
      const notFoundRaidBossIds = allRaidBossIds.filter(id => !foundRaidBossIds.has(id));

      // Log the IDs not found in the data processed
      console.log('Raid boss IDs not found:', notFoundRaidBossIds);

      // Log the object that will be stored in the cache
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
