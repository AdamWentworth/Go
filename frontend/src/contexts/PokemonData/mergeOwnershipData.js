// mergeOwnershipData.js

export const mergeOwnershipData = (oldData, newData, username) => {
    const mergedData = {};
    const oldDataProcessed = {};

    const extractPrefix = (key) => {
        const keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part
        return keyParts.join('_'); // Rejoin to form the actual prefix
    };

    console.log("Starting merge process...");

    // Early username filtering for newData
    Object.keys(newData).forEach(key => {
        const entry = newData[key];
        if (entry.username) {
            // console.log(`Entry ${key} has username: ${entry.username}.`);

            if (entry.username === username) {
                console.log(`Keeping entry ${key} because username matches provided username.`);
            } else {
                console.log(`Dropping entry ${key} because username does not match provided username (${username}).`);
                delete newData[key];
                delete oldData[key];
            }
        }
    });
    // Step 1: Merge old data
    Object.keys(oldData).forEach(oldKey => {
        const prefix = extractPrefix(oldKey);
    
        if (!oldDataProcessed[prefix]) {
            // No new data with this prefix, add old data as is
            mergedData[oldKey] = oldData[oldKey];
        } else {
            // Check if this old entry is significant
            const significantOld = oldData[oldKey].is_owned || 
                                   oldData[oldKey].is_for_trade || 
                                   oldData[oldKey].is_wanted;
            
            // If the old entry is significant, always preserve it
            if (significantOld) {
                mergedData[oldKey] = oldData[oldKey];
            }
            // Non-significant old entries are not merged if there's new data for the prefix
        }
    });
    
    // Step 2: Merge new data
    Object.keys(newData).forEach(key => {
        const prefix = extractPrefix(key);
        if (oldData.hasOwnProperty(key)) {
            // Determine if the new entry is significant
            const significantNew = newData[key].is_owned || newData[key].is_for_trade || newData[key].is_wanted;
            
            if (significantNew) {
                // Always prefer new if it is significant
                mergedData[key] = newData[key];
            } else {
                // If not significant, compare based on last_update
                const newDate = new Date(newData[key].last_update);
                const oldDate = new Date(oldData[key].last_update);
                mergedData[key] = (newDate > oldDate) ? newData[key] : oldData[key];
            }
        } else {
            // Key doesn't exist in oldData, so take newData as is
            mergedData[key] = newData[key];
        }
        
        // Track processed prefixes
        oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
        oldDataProcessed[prefix].push(key);
    });



    // Step 3: Integrate Mega and Primal Logic
    // Drop all 'mega', 'shiny_mega', 'mega_x', 'mega_y', 'primal', or 'shiny_primal' entries that are 'is_unowned'
    // if newData has matching instances with the required flags
    Object.keys(mergedData).forEach(key => {
        if (key.includes("mega") || key.includes("primal")) {
            // Extract the leading numbers by removing "mega" or "primal" from the key
            const leadingNumbersMatch = key.match(/^\d+/);
            if (leadingNumbersMatch) {
                const leadingNumbers = leadingNumbersMatch[0];
                // Find all related keys in newData that start with the same leading numbers
                const relatedNewKeys = Object.keys(newData).filter(newKey => 
                    newKey.startsWith(leadingNumbers)
                );

                // Determine specific types
                const isShinyMega = key.includes("shiny_mega");
                const isMegaX = key.toLowerCase().includes("mega_x");
                const isMegaY = key.toLowerCase().includes("mega_y");
                const isPrimal = key.includes("primal");
                const isShinyPrimal = key.includes("shiny_primal");

                // Check for relevant entries in newData
                const hasRelevantEntryInNew = relatedNewKeys.some(newKey => {
                    const entry = newData[newKey];
                    if (!entry) return false;

                    if (isShinyMega) {
                        return entry.mega === true && entry.shiny === true;
                    } else if (isMegaX || isMegaY) {
                        return entry.mega === true;
                    } else if (isPrimal) {
                        return entry.mega === true;
                    } else if (isShinyPrimal) {
                        return entry.mega === true && entry.shiny === true;
                    } else {
                        return entry.mega === true;
                    }
                });

                // Drop if we found a relevant new entry + old entry is_unowned
                if (hasRelevantEntryInNew && mergedData[key].is_unowned === true) {
                    delete mergedData[key];
                }
            }
        }
    });

    // Step 4: Ensure at most one instance per prefix has is_unowned: true
    const finalData = {};

    // Track which prefixes already have owned or wanted
    const ownedTracker = new Set(); 
    const wantedTracker = new Set();
    
    // Track if we've already added an "unowned" entry for that prefix
    const unownedTracker = new Set();
    
    // ---- 1) Pass One: keep all "owned" ----
    Object.keys(mergedData).forEach((key) => {
      const prefix = extractPrefix(key);
      const entry = mergedData[key];
    
      if (entry.is_owned === true) {
        // Keep all owned
        finalData[key] = entry;
        ownedTracker.add(prefix);
      }
    });
    
    // ---- 2) Pass Two: keep all "wanted" ----
    Object.keys(mergedData).forEach((key) => {
      const prefix = extractPrefix(key);
      const entry = mergedData[key];
    
      if (entry.is_wanted === true) {
        // Keep all wanted
        finalData[key] = entry;
        wantedTracker.add(prefix);
      }
    });
    
    // ---- 3) Pass Three: keep at most one "unowned" per prefix ----
    Object.keys(mergedData).forEach((key) => {
      const prefix = extractPrefix(key);
      const entry = mergedData[key];
    
      // Only consider unowned if we have no owned/wanted for that prefix
      if (entry.is_unowned === true) {
        // Keep unowned entries only if:
        // - we haven't owned that prefix
        // - we don't want that prefix
        // - we haven't yet kept an unowned for that prefix
        if (
          !ownedTracker.has(prefix) &&
          !wantedTracker.has(prefix) &&
          !unownedTracker.has(prefix)
        ) {
          finalData[key] = entry;
          unownedTracker.add(prefix);
        }
      }
    });

    console.log("Merge process completed.");
    return finalData;
};
