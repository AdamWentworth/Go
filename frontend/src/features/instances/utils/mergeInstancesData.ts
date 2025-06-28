// mergeInstancesData.ts

import type { Instances } from '@/types/instances'; 

export const mergeInstancesData = (
    oldData: Instances,
    newData: Instances,
    username: string
  ): Instances => {
    const mergedData: Instances = {};
    const oldDataProcessed: Record<string, string[]> = {};
  
    const extractPrefix = (key: string): string => {
      const keyParts = key.split('_');
      keyParts.pop();
      return keyParts.join('_');
    };
  
    console.log('[mergeInstancesData] Starting merge process…');

  // Remove entries from oldData that don't match the username
  Object.keys(oldData).forEach(key => {
    const entry = oldData[key];
    if (entry.username && entry.username !== username) {
      delete oldData[key];
    }
  });

  // Remove entries from newData that don't match the username
  Object.keys(newData).forEach(key => {
    const entry = newData[key];
    if (entry.username && entry.username !== username) {
      delete newData[key];
    }
  });

  Object.keys(oldData).forEach(oldKey => {
    const prefix = extractPrefix(oldKey);
    if (!oldDataProcessed[prefix]) {
      mergedData[oldKey] = oldData[oldKey];
    } else {
      const significantOld = oldData[oldKey].is_owned || oldData[oldKey].is_for_trade || oldData[oldKey].is_wanted;
      if (significantOld) {
        mergedData[oldKey] = oldData[oldKey];
      }
    }
  });

  Object.keys(newData).forEach(key => {
    const prefix = extractPrefix(key);
    if (Object.prototype.hasOwnProperty.call(oldData, key)) { // fixed
      const significantNew = newData[key].is_owned || newData[key].is_for_trade || newData[key].is_wanted;
      if (significantNew) {
        mergedData[key] = newData[key];
      } else {
        const newDate = new Date(newData[key].last_update || 0);
        const oldDate = new Date(oldData[key].last_update || 0);
        mergedData[key] = (newDate > oldDate) ? newData[key] : oldData[key];
      }
    } else {
      mergedData[key] = newData[key];
    }

    oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
    oldDataProcessed[prefix].push(key);
  });

  Object.keys(mergedData).forEach(key => {
    if (key.includes("mega") || key.includes("primal")) {
      const leadingNumbersMatch = key.match(/^\d+/);
      if (leadingNumbersMatch) {
        const leadingNumbers = leadingNumbersMatch[0];
        const relatedNewKeys = Object.keys(newData).filter(newKey => newKey.startsWith(leadingNumbers));

        const isShinyMega = key.includes("shiny_mega");
        const isMegaX = key.toLowerCase().includes("mega_x");
        const isMegaY = key.toLowerCase().includes("mega_y");
        const isPrimal = key.includes("primal");
        const isShinyPrimal = key.includes("shiny_primal");

        const hasRelevantEntryInNew = relatedNewKeys.some(newKey => {
          const entry = newData[newKey];
          if (!entry) return false;
          if (isShinyMega) return entry.mega && entry.shiny;
          if (isMegaX || isMegaY) return entry.mega;
          if (isPrimal) return entry.mega;
          if (isShinyPrimal) return entry.mega && entry.shiny;
          return entry.mega;
        });

        if (hasRelevantEntryInNew && mergedData[key].is_unowned) {
          delete mergedData[key];
        }
      }
    }
  });

  Object.keys(mergedData).forEach(key => {
    if (key.includes("fusion")) {
      const leadingDigitsMatch = key.match(/^(\d+)-/);
      if (!leadingDigitsMatch) return;
      const pokemonId = leadingDigitsMatch[1];

      const fusionIdMatch = key.match(/fusion_(\d+)/);
      if (!fusionIdMatch) return;
      const fusionId = fusionIdMatch[1];

      const isShiny = key.includes("shiny");

      const relatedNewKeys = Object.keys(newData).filter(newKey => {
        return newKey.startsWith(pokemonId) && newKey.includes("shiny") === isShiny;
      });

      const hasOwnedFusionVariant = relatedNewKeys.some(newKey => {
        const entry = newData[newKey];
        if (!entry) return false;
        entry.fusion = entry.fusion || {};
        return entry.fusion[fusionId] === true;
      });

      if (hasOwnedFusionVariant && mergedData[key].is_unowned) {
        delete mergedData[key];
      }
    }
  });

  const finalData: Instances = {};
  const ownedTracker = new Set<string>();
  const wantedTracker = new Set<string>();
  const unownedTracker = new Set<string>();

  Object.keys(mergedData).forEach(key => {
    const prefix = extractPrefix(key);
    const entry = mergedData[key];
    if (entry.is_owned) {
      finalData[key] = entry;
      ownedTracker.add(prefix);
    }
  });

  Object.keys(mergedData).forEach(key => {
    const prefix = extractPrefix(key);
    const entry = mergedData[key];
    if (entry.is_wanted) {
      finalData[key] = entry;
      wantedTracker.add(prefix);
    }
  });

  Object.keys(mergedData).forEach(key => {
    const prefix = extractPrefix(key);
    const entry = mergedData[key];
    if (entry.is_unowned && !ownedTracker.has(prefix) && !wantedTracker.has(prefix) && !unownedTracker.has(prefix)) {
      finalData[key] = entry;
      unownedTracker.add(prefix);
    }
  });

  console.log("Merge process completed.");
  return finalData;
};